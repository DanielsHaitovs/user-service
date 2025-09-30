import type { UserRole } from '@/user/entities/userRoles.entity';

export function validateUserRoleApiResponse(userRoles: UserRole[]): void {
  if (userRoles.length === 0) {
    throw new Error('Role array is empty, nothing to validate');
  }

  expect(userRoles).toBeDefined();
  expect(userRoles.length).toBeGreaterThan(0);

  userRoles.forEach((userRole) => {
    expect(userRole.role).toHaveProperty('id');
    expect(userRole.role).toHaveProperty('name');
    expect(userRole.user).toHaveProperty('id');
    expect(userRole.user).toHaveProperty('email');
    expect(userRole.assignedBy).toHaveProperty('id');
    expect(userRole.assignedBy).toHaveProperty('email');
  });
}

export function validateUnassignUserRole(response: {
  unassigned: boolean;
}): void {
  expect(response).toBeDefined();
  expect(response.unassigned).toBeDefined();
  expect(response.unassigned).toBe(true);
}
