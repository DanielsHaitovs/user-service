import { ToDate } from '@/commonDecorators/date.decorator';

import { plainToInstance } from 'class-transformer';

class TestTargetDto {
  @ToDate()
  public dateField?: Date;
}

describe('ToDate Decorator - Empty and Missing Input Channels', () => {
  it('should return undefined if the incoming value evaluates to null, undefined, or an empty string literal', () => {
    const emptyInputs = [null, undefined, ''];

    for (const val of emptyInputs) {
      const output = plainToInstance(TestTargetDto, { dateField: val });
      expect(output.dateField).toBeUndefined();
    }
  });

  it('should return undefined if the payload object completely omits the decorated property key', () => {
    const output = plainToInstance(TestTargetDto, {});
    expect(output.dateField).toBeUndefined();
  });
});

describe('ToDate Decorator - Valid Instance and Scalar Parsers', () => {
  it('should pass an existing native Date instance through completely unaltered', () => {
    const nativeDate = new Date('2026-07-13T00:00:00.000Z');
    const output = plainToInstance(TestTargetDto, { dateField: nativeDate });

    expect(output.dateField).toBeInstanceOf(Date);
    expect(output.dateField?.getTime()).toBe(nativeDate.getTime());
  });

  it('should successfully parse valid date string formats into active Date objects', () => {
    const validStrings = [
      '2026-07-13',
      '2026-07-13T12:00:00.000Z',
      'Mon Jul 13 2026',
    ];

    for (const str of validStrings) {
      const output = plainToInstance(TestTargetDto, { dateField: str });
      expect(output.dateField).toBeInstanceOf(Date);
      expect(isNaN(output.dateField?.getTime() ?? NaN)).toBe(false);
    }
  });

  it('should successfully parse numeric millisecond timestamps into accurate Date objects', () => {
    const mockTimestamp = 1783936800000;
    const output = plainToInstance(TestTargetDto, { dateField: mockTimestamp });

    expect(output.dateField).toBeInstanceOf(Date);
    expect(output.dateField?.getTime()).toBe(mockTimestamp);
  });
});

describe('ToDate Decorator - Malformed Inputs and Type Fallbacks', () => {
  it('should gracefully return undefined if the string parameter cannot be parsed into a valid calendar milestone', () => {
    const invalidStrings = ['not-a-valid-date', '2026-99-99', '---'];

    for (const str of invalidStrings) {
      const output = plainToInstance(TestTargetDto, { dateField: str });
      expect(output.dateField).toBeUndefined();
    }
  });

  it('should gracefully return undefined if numeric properties equal invalid limits like NaN or Infinity', () => {
    const invalidNumbers = [NaN, Infinity, -Infinity];

    for (const num of invalidNumbers) {
      const output = plainToInstance(TestTargetDto, { dateField: num });
      expect(output.dateField).toBeUndefined();
    }
  });

  it('should return undefined if the incoming type parameter matches unsupported complex structures or boolean values', () => {
    const unsupportedTypes = [true, false, {}, [], { date: '2026-07-13' }];

    for (const val of unsupportedTypes) {
      const output = plainToInstance(TestTargetDto, { dateField: val });
      expect(output.dateField).toBeUndefined();
    }
  });
});
