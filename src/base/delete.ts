import type { DeleteResult } from 'typeorm';

/**
 * Checks if the delete operation affected any rows.
 * @param updated - The result of the delete operation.
 * @returns true if at least one row was affected (deleted), false otherwise.
 */
export function deletedResults(updated: DeleteResult): boolean {
  return updated.affected == undefined ? false : updated.affected > 0;
}
