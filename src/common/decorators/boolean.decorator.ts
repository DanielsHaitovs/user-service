import { Transform, type TransformFnParams } from 'class-transformer';

export function ToBoolean(): PropertyDecorator {
  return Transform(
    ({ obj, key }: TransformFnParams) => {
      const source: Record<string, unknown> =
        obj != undefined && typeof obj === 'object'
          ? (obj as Record<string, unknown>)
          : {};

      const raw = source[String(key)];

      if (raw === undefined || raw === null || raw === '') {
        return undefined;
      }

      if (typeof raw === 'boolean') return raw;

      if (typeof raw === 'string') {
        const v = raw.toLowerCase().trim();
        if (v === 'true') return true;
        if (v === 'false') return false;
      }

      return undefined;
    },
    { toClassOnly: true },
  );
}
