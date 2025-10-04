import { screenSensitiveData } from '@/utils/screening.util';

// export function safeStringify(value: any): string {
//   try {
//     const json = JSON.stringify(value, getCircularReplacer(), 2);
//     return screenSensitiveData(json); // <- integrated here
//   } catch {
//     return '[Unserializable]';
//   }
// }

// function getCircularReplacer() {
//   const seen = new WeakSet();
//   return (key: string, value: any) => {
//     if (typeof value === 'object' && value !== null) {
//       if (seen.has(value)) {
//         return '[Circular]';
//       }
//       seen.add(value);
//     }
//     return value;
//   };
// }

export function safeStringify(value: unknown): string {
  try {
    const cache = new WeakSet<object>();
    const str = JSON.stringify(value, (_, v: unknown) => {
      if (typeof v === 'object' && v !== null) {
        if (cache.has(v)) return '[Circular]';
        cache.add(v);
      }
      if (typeof v === 'bigint') return v.toString();
      return v;
    });

    return screenSensitiveData(str);
  } catch {
    return '[Unserializable]';
  }
}
