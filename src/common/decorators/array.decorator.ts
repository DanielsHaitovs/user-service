import { Transform, type TransformFnParams } from 'class-transformer';

export function ToArray(): PropertyDecorator {
  return Transform(({ value }: TransformFnParams): unknown[] => {
    if (value === undefined || value === null || value === '') {
      return [];
    }

    if (Array.isArray(value)) {
      return value;
    }

    return [value];
  });
}
