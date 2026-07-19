import { ToArray } from '@/commonDecorators/array.decorator';

import { plainToInstance } from 'class-transformer';

class TestTargetDto {
  @ToArray()
  public values?: unknown[] = [];
}

describe('ToArray Decorator - Empty and Missing Values', () => {
  it('should return an empty array if the value evaluates to null, undefined, or an empty string literal', () => {
    const emptyValues = [null, undefined, ''];

    for (const val of emptyValues) {
      const output = plainToInstance(TestTargetDto, { values: val });
      expect(output.values).toEqual([]);
      expect(Array.isArray(output.values)).toBe(true);
    }
  });

  it('should return a clean empty array if the payload object completely omits the decorated property key', () => {
    const output = plainToInstance(TestTargetDto, {});
    expect(output.values).toEqual([]);
  });
});

describe('ToArray Decorator - Array Preservation', () => {
  it('should return the original array completely untouched if the input parameter value is already an array', () => {
    const primaryStrings = ['nest', 'fastify', 'typescript'];
    const outputStrings = plainToInstance(TestTargetDto, {
      values: primaryStrings,
    });
    expect(outputStrings.values).toEqual(['nest', 'fastify', 'typescript']);

    const complexObjects = [{ id: '123' }, { id: '456' }];
    const outputObjects = plainToInstance(TestTargetDto, {
      values: complexObjects,
    });
    expect(outputObjects.values).toEqual([{ id: '123' }, { id: '456' }]);
  });
});

describe('ToArray Decorator - Single Value Wrapping', () => {
  it('should wrap a standalone primitive scalar string, number, or boolean element into a single-item array wrapper', () => {
    const outputString = plainToInstance(TestTargetDto, {
      values: 'standalone-string-metric',
    });
    expect(outputString.values).toEqual(['standalone-string-metric']);

    const outputNumber = plainToInstance(TestTargetDto, { values: 2026 });
    expect(outputNumber.values).toEqual([2026]);

    const outputBoolean = plainToInstance(TestTargetDto, { values: false });
    expect(outputBoolean.values).toEqual([false]);
  });

  it('should successfully enclose a standalone single dictionary object configuration value into a single-element array', () => {
    const simpleDict = { key: 'value', active: true };
    const output = plainToInstance(TestTargetDto, { values: simpleDict });

    expect(output.values).toEqual([simpleDict]);
    expect(output.values?.[0]).toHaveProperty('key', 'value');
  });
});
