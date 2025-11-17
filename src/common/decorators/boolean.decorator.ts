import { Transform, type TransformFnParams } from 'class-transformer';

export function ToBoolean(): PropertyDecorator {
  return Transform(({ value }: TransformFnParams): boolean | undefined => {
    if (value === undefined || value === null || value === '') return undefined;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      const v = value.toLowerCase().trim();
      if (v === 'true') return true;
      if (v === 'false') return false;
    }
    return value;
  });
}
