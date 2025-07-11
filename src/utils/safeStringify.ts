/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-unsafe-return */

import { screenSensitiveData } from '@/utils/screening.util';

export function safeStringify(value: any): string {
  try {
    const json = JSON.stringify(value, getCircularReplacer(), 2);
    return screenSensitiveData(json); // <- integrated here
  } catch {
    return '[Unserializable]';
  }
}

function getCircularReplacer() {
  const seen = new WeakSet();
  return (key: string, value: any) => {
    if (typeof value === 'object' && value !== null) {
      if (seen.has(value)) {
        return '[Circular]';
      }
      seen.add(value);
    }
    return value;
  };
}
