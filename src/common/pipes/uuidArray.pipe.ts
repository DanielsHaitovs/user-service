import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { UUID } from 'crypto';
import { validate as isUUID } from 'uuid';

@Injectable()
export class ParseUUIDArrayPipe
  implements PipeTransform<string | string[], UUID[]>
{
  transform(value: string | string[] | undefined): UUID[] {
    if (value == undefined) return [];

    const values: string[] = Array.isArray(value)
      ? value
      : value
          .split(',')
          .map((v) => v.trim())
          .filter(Boolean);

    const invalid = values.filter((v) => !isUUID(v));
    if (invalid.length > 0) {
      throw new BadRequestException(
        `Invalid UUID format for value(s): ${invalid.join(', ')}`,
      );
    }

    return values as UUID[];
  }
}
