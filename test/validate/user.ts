import type { GetUserDto, UserResponseDto } from '@/userDto/user.dto';

export function validateUserResponseDto({
  response,
  expected,
}: {
  response: GetUserDto | UserResponseDto;
  expected: Partial<UserResponseDto>;
}): void {
  expect(response).toBeDefined();
  expect(response.id).toBeDefined();

  if (expected.id != undefined) {
    expect(response.id).toBe(expected.id);
  }

  if (expected.firstName != undefined) {
    expect(response.firstName).toBe(expected.firstName);
  }

  if (expected.lastName != undefined) {
    expect(response.lastName).toBe(expected.lastName);
  }

  if (expected.email != undefined) {
    expect(response.email).toBe(expected.email);
  }

  if (expected.phone != undefined) {
    expect(response.phone).toBe(expected.phone);
  }

  // if (expected.dateOfBirth) {
  //   const responseDate = new Date(response.dateOfBirth)
  //     .toISOString()
  //     .split('T')[0];
  //   const expectedDate = new Date(expected.dateOfBirth)
  //     .toISOString()
  //     .split('T')[0];

  //   expect(responseDate).toBe(expectedDate);
  // }

  if (expected.isActive != undefined) {
    expect(response.isActive).toBe(expected.isActive);
  }

  if (expected.password != undefined) {
    expect(response.password).toBe(expected.password);
  }

  if (expected.twoFactorSecret != undefined) {
    expect(response.twoFactorSecret).toBe(expected.twoFactorSecret);
  }
}
