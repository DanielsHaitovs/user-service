import type { QueryFailedError } from 'typeorm';

export interface PostgresQueryFailedError extends QueryFailedError {
  code: string;
}
