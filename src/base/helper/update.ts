import type { UpdateResult } from 'typeorm';

/*
 * Helper method to determine if the update operation affected any records.
 * @param updated - The result of the update operation
 * @returns A boolean indicating whether any records were affected by the update
 */
export function updatedResults(updated: UpdateResult | undefined): boolean {
  return updated?.affected == undefined ? false : updated.affected > 0;
}
