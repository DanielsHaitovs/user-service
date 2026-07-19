import { screenSensitiveData } from '@/utils/screening.util';
import { Logger } from '@nestjs/common';

jest.mock('@/config/screening.config', () => ({
  sensitiveDataScreeningConfig: {
    fullyScreen: ['password', 'secretToken', 'cvv'],
    partiallyScreen: ['creditCard', 'phoneNumber'],
  },
}));

describe('screenSensitiveData - Operational Guard Rails', () => {
  it('should return an empty string immediately if the incoming data parameter is empty or not a string', () => {
    expect(screenSensitiveData('')).toBe('');
    expect(screenSensitiveData(undefined as unknown as string)).toBe('');
    expect(screenSensitiveData(null as unknown as string)).toBe('');
    expect(screenSensitiveData(99999 as unknown as string)).toBe('');
  });

  it('should return the original string completely untouched if no sensitive fields are present', () => {
    const safePayload =
      '{"id":"user_01","email":"test@example.com","status":"active"}';
    const result = screenSensitiveData(safePayload);

    expect(result).toBe(safePayload);
  });
});

describe('screenSensitiveData - Full Redaction Path', () => {
  it('should completely mask fields found in the fullyScreen configuration array', () => {
    const rawJson =
      '{"username":"dan","password":"SuperSecretPassword123","cvv":"987"}';
    const result = screenSensitiveData(rawJson);

    expect(result).toContain('"password": "***"');
    expect(result).toContain('"cvv": "***"');
    expect(result).toContain('"username":"dan"');
  });

  it('should dynamically apply full redaction parameters when runtime custom keys are passed via secrets', () => {
    const rawJson =
      '{"traceId":"req-456","internalIp":"10.0.0.1","sessionKey":"xyz"}';
    const result = screenSensitiveData(rawJson, ['internalIp', 'sessionKey']);

    expect(result).toContain('"internalIp": "***"');
    expect(result).toContain('"sessionKey": "***"');
    expect(result).toContain('"traceId":"req-456"');
  });
});

describe('screenSensitiveData - Partial Redaction Path', () => {
  it('should mask the first half of a clean string property value and preserve the trailing half', () => {
    const rawJson = '{"creditCard":"12345678"}';
    const result = screenSensitiveData(rawJson);

    expect(result).toBe('{"creditCard": "***5678"}');
  });

  it('should round up the masked length calculation cleanly when processing odd-length values', () => {
    const rawJson = '{"phoneNumber":"12345"}';
    const result = screenSensitiveData(rawJson);

    expect(result).toBe('{"phoneNumber": "***45"}');
  });
});

describe('screenSensitiveData - System Exception Tracking', () => {
  let loggerErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    loggerErrorSpy = jest
      .spyOn(Logger, 'error')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    loggerErrorSpy.mockRestore();
  });

  it('should fall back to full masking inside a field if an internal error occurs during partial processing', () => {
    const ceilSpy = jest.spyOn(Math, 'ceil').mockImplementationOnce(() => {
      throw new Error('Inner operational math breakdown');
    });

    const rawJson = '{"creditCard":"12345678"}';
    const result = screenSensitiveData(rawJson);

    expect(result).toBe('{"creditCard": "***"}');

    ceilSpy.mockRestore();
  });

  it('should log a descriptive message and fall back to the raw un-screened payload if the root process crashes', () => {
    const replaceSpy = jest
      .spyOn(String.prototype, 'replace')
      .mockImplementationOnce(() => {
        throw new Error('Simulated root regular expression breakdown');
      });

    const targetPayload = '{"creditCard":"12345678"}';
    const result = screenSensitiveData(targetPayload);

    expect(result).toBe(targetPayload);
    expect(loggerErrorSpy).toHaveBeenCalledWith(
      'Error processing data:',
      expect.any(Error),
    );

    replaceSpy.mockRestore();
  });
});
