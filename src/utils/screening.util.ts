/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/strict-boolean-expressions */
/* eslint-disable sonarjs/anchor-precedence */

import { sensitiveDataScreeningConfig } from '@/config/screening.config';
import { Logger } from '@nestjs/common';

/**
 * Screens sensitive data by masking or redacting fields defined in configuration.
 *
 * @param data - The JSON string to be screened.
 * @param secrets - Optional additional keys to fully redact.
 * @returns The screened string with sensitive data masked.
 */
export function screenSensitiveData(data: string, secrets?: string[]): string {
  if (!data || typeof data !== 'string') return '';

  try {
    const fullyScreen = [...sensitiveDataScreeningConfig.fullyScreen];
    if (secrets?.length) {
      fullyScreen.push(...secrets);
    }

    const allKeys = [
      ...fullyScreen,
      ...sensitiveDataScreeningConfig.partiallyScreen,
    ];
    const keyPattern = allKeys.join('|');

    const regex = new RegExp(
      `"(${keyPattern})":\\s*("[^"]*"|\\[[^\\]]*\\]|\\{[^}]*\\}|[^,}\\]]*)`,
      'g',
    );

    return data.replace(regex, (match: string, key: string, value: any) => {
      // Full redaction
      if (fullyScreen.includes(key)) {
        return `"${key}": "***"`;
      }

      // Partial masking
      if (sensitiveDataScreeningConfig.partiallyScreen.includes(key)) {
        try {
          const stringValue =
            typeof value === 'string' ? value : JSON.stringify(value ?? '');
          const cleaned = stringValue.replace(/^"|"$/g, '');
          const half = Math.ceil(cleaned.length / 2);
          return `"${key}": "***${cleaned.slice(half)}"`;
        } catch {
          return `"${key}": "***"`;
        }
      }

      return match;
    });
  } catch (error) {
    Logger.error('Error processing data:', error);
    return data;
  }
}
