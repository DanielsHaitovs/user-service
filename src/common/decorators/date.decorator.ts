import { Transform, type TransformFnParams } from 'class-transformer';

export function ToDate(): PropertyDecorator {
  return Transform(
    ({ value }: TransformFnParams): Date | undefined => {
      if (value === undefined || value === null || value === '') {
        return undefined;
      }

      if (value instanceof Date) {
        return value;
      }

      if (typeof value === 'number') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? undefined : date;
      }

      if (typeof value === 'string') {
        const date = new Date(value);
        return isNaN(date.getTime()) ? undefined : date;
      }

      return undefined;
    },
    { toClassOnly: true }, // 👈 makes sure it runs when plain → class
  );
}
