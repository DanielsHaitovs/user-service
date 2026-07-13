import { safeStringify } from '@/utils/safeStringify';
import { screenSensitiveData } from '@/utils/screening.util';

jest.mock('@/config/log.config', () => ({
  classesToSkip: ['SkipMeClass', 'TypeORMQueryRunner'],
}));

jest.mock('@/utils/screening.util', () => ({
  screenSensitiveData: jest.fn().mockImplementation((str: string) => str),
}));

describe('SafeStringify Utility - Primitive and Standard Formats', () => {
  const screeningSpy = screenSensitiveData as unknown as jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should successfully serialize flat primitive types like strings, numbers, and booleans', () => {
    expect(safeStringify('hello')).toBe('"hello"');
    expect(safeStringify(42)).toBe('42');
    expect(safeStringify(true)).toBe('true');
    expect(safeStringify(null)).toBe('null');
    expect(screeningSpy).toHaveBeenCalled();
  });

  it('should cleanly serialize BigInt primitive values by converting them to string representations', () => {
    const payload = { amount: BigInt(9007199254740991) };
    const result = safeStringify(payload);

    expect(result).toBe('{"amount":"9007199254740991"}');
  });
});

describe('SafeStringify Utility - Array Summarization Path', () => {
  it('should return empty arrays completely untouched without formatting summaries', () => {
    expect(safeStringify([])).toBe('[]');
  });

  it('should format populated arrays into a clean summarized logging preview string', () => {
    const payload = { tags: ['admin', 'user', 'guest', 'extra1', 'extra2'] };
    const result = safeStringify(payload);

    expect(result).toBe(
      '{"tags":"[Array(5) sample: \\"admin\\", \\"user\\", \\"guest\\"]"}',
    );
  });

  it('should handle array items matching undefined components by returning an explicit string placeholder', () => {
    const payload = [undefined];
    const result = safeStringify(payload);

    expect(result).toBe('"[Array(1) sample: undefined]"');
  });

  it('should stringify function pointers matching inner collection properties alongside their identifier names', () => {
    const mockFunction = function testCallback(): void {
      void 0;
    };
    const payload = [mockFunction];
    const result = safeStringify(payload);

    expect(result).toBe('"[Array(1) sample: [FunctiontestCallback]]"');
  });
});

describe('SafeStringify Utility - Advanced Structures and Circularity', () => {
  it('should identify circular reference loops safely and replace them with a string literal tag', () => {
    const circularObj: Record<string, unknown> = { name: 'Node' };
    circularObj.self = circularObj;

    const result = safeStringify(circularObj);

    expect(result).toBe('{"name":"Node","self":"[Circular]"}');
  });

  it('should gracefully intercept deep runtime serialization crashes and return an unserializable indicator tag', () => {
    const brokenObj = {
      get explode(): string {
        throw new Error('Unpredicted execution error');
      },
    };

    const result = safeStringify(brokenObj);

    expect(result).toBe('[Unserializable]');
  });
});

describe('SafeStringify Utility - Class Skipping and Request Redaction', () => {
  it('should condense blacklisted system instances into simplified constructor literal tags', () => {
    const mockSkippedInstance = Object.create({
      constructor: { name: 'SkipMeClass' },
    }) as Record<string, unknown>;

    mockSkippedInstance.secretData = 'hidden';

    const payload = { target: mockSkippedInstance };
    const result = safeStringify(payload);

    expect(result).toBe('{"target":"[SkipMeClass]"}');
  });

  it('should simplify HTTP IncomingMessage request graphs cleanly and redact sensitive authorization properties', () => {
    const mockRequest = Object.create({
      constructor: { name: 'IncomingMessage' },
    }) as Record<string, unknown>;

    mockRequest.method = 'POST';
    mockRequest.url = '/v1/user/roles';
    mockRequest.originalUrl = '/v1/user/roles';
    mockRequest.query = { active: 'true' };
    mockRequest.params = {};
    mockRequest.body = { roleId: '123' };
    mockRequest.headers = {
      host: 'localhost:3000',
      'user-agent': 'Jest-Engine',
      authorization: 'Bearer secret_jwt_token_payload',
    };

    const result = safeStringify(mockRequest);
    const parsed = JSON.parse(result) as Record<string, unknown>;

    expect(parsed).toHaveProperty('method', 'POST');
    expect(parsed).toHaveProperty('url', '/v1/user/roles');

    const headers = parsed.headers as Record<string, string>;
    expect(headers).toBeDefined();
    expect(headers.authorization).toBe('[REDACTED TOKEN]');
  });
});
