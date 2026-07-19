import { ToBoolean } from '@/commonDecorators/boolean.decorator';

import { plainToInstance } from 'class-transformer';

class TestTargetDto {
  @ToBoolean()
  public isActive?: boolean;
}

describe('ToBoolean Decorator - Native Boolean Values', () => {
  it('should pass native boolean values through completely unaltered', () => {
    const outputTrue = plainToInstance(TestTargetDto, { isActive: true });
    expect(outputTrue.isActive).toBe(true);

    const outputFalse = plainToInstance(TestTargetDto, { isActive: false });
    expect(outputFalse.isActive).toBe(false);
  });
});

describe('ToBoolean Decorator - String Parsers', () => {
  it('should parse truthy text combinations into booleans regardless of string casing or extra whitespace', () => {
    const truthyInputs = ['true', 'TRUE', ' True ', 'true '];

    for (const val of truthyInputs) {
      const output = plainToInstance(TestTargetDto, { isActive: val });
      expect(output.isActive).toBe(true);
    }
  });

  it('should parse falsy text combinations into booleans regardless of string casing or extra whitespace', () => {
    const falsyInputs = ['false', 'FALSE', ' False ', 'false '];

    for (const val of falsyInputs) {
      const output = plainToInstance(TestTargetDto, { isActive: val });
      expect(output.isActive).toBe(false);
    }
  });
});

describe('ToBoolean Decorator - Empty and Invalid Inputs', () => {
  it('should resolve to undefined if target payload values are empty, null, or completely absent', () => {
    const emptyInputs = ['', null, undefined];

    for (const val of emptyInputs) {
      const output = plainToInstance(TestTargetDto, { isActive: val });
      expect(output.isActive).toBeUndefined();
    }
  });

  it('should resolve to undefined if input values match unparseable strings, numbers, or complex objects', () => {
    const invalidInputs = ['yes', 'no', '1', '0', 1, 0, {}, []];

    for (const val of invalidInputs) {
      const output = plainToInstance(TestTargetDto, { isActive: val });
      expect(output.isActive).toBeUndefined();
    }
  });

  it('should handle missing keys or entirely empty object inputs safely without throwing errors', () => {
    const output = plainToInstance(TestTargetDto, {});
    expect(output.isActive).toBeUndefined();
  });
});
