import type { GetRoleDto, RoleResponseDto } from '@/roleDto/role.dto';
import { validatePermissionResponseDto } from '@/test/validate/permission';

export function validateRoleResponseDto({
  response,
  expected,
}: {
  response: GetRoleDto | RoleResponseDto;
  expected?: Partial<GetRoleDto> | undefined;
}): void {
  expect(response).toBeDefined();
  expect(response.id).toBeDefined();

  if (expected?.id != undefined) {
    expect(response.id).toBe(expected.id);
  }

  if (expected?.name != undefined) {
    expect(response.name).toBe(expected.name);
  }
}

export function validateRoleWithPermissionsResponseDto({
  response,
  expected,
}: {
  response: RoleResponseDto;
  expected: Partial<RoleResponseDto>;
}): void {
  const { permissions: expectedPermissions, ...expectedRoleData } = expected;
  const { permissions: responsePermissions, ...responseRoleData } = response;

  validateRoleResponseDto({
    response: responseRoleData,
    expected: expectedRoleData,
  });

  if (expectedPermissions === undefined || expectedPermissions.length === 0) {
    if (responsePermissions.length > 0) {
      throw new Error(
        `Expected no permissions, but found ${responsePermissions.length.toString()} permissions in the response.`,
      );
    }

    return;
  }

  expect(responsePermissions).toBeDefined();

  if (responsePermissions.length !== expectedPermissions.length) {
    console.log(response);
    console.log(responsePermissions);
    throw new Error(
      `Expected ${expectedPermissions.length.toString()} permissions, but found ${responsePermissions.length.toString()} permissions in the response.`,
    );
  }
  expect(responsePermissions).toHaveLength(expectedPermissions.length);

  expectedPermissions.forEach((expectedPermission) => {
    const matchingResponsePermission = responsePermissions.find(
      (p) => p.id === expectedPermission.id,
    );

    if (!matchingResponsePermission) {
      throw new Error(
        `Could not find expected permission with ID ${expectedPermission.id} in the response permissions array.`,
      );
    }

    validatePermissionResponseDto({
      response: matchingResponsePermission,
      expected: expectedPermission,
    });
  });
}
