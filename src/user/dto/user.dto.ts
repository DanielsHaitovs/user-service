import { PaginatedResponseDto } from '@/baseDto/pagination.dto';
import { ToArray } from '@/commonDecorators/array.decorator';
import { EXAMPLE_ROLE_ID } from '@/lib/const/role.const';
import { COUNTRIES } from '@/libConst/countries.const';
import { EXAMPLE_USER_ID } from '@/libConst/user.const';
import { GetUserRoleDto } from '@/userDto/roles.dto';
import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';

import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { UUID } from 'crypto';

/**
 * Base DTO containing core user information shared across multiple operations.
 *
 * Serves as the foundation for user creation, updates, and responses while ensuring
 * consistent validation rules and API documentation across all user-related endpoints.
 */
export class UserBaseDto {
  @ApiProperty({
    description: 'Country where the user is located',
    required: true,
    minLength: 1,
    maxLength: 100,
    type: String,
    enum: COUNTRIES,
  })
  @IsEnum(COUNTRIES)
  @MinLength(1)
  @MaxLength(100)
  country: COUNTRIES;

  @ApiProperty({
    description: 'User first name',
    example: 'John',
    minLength: 1,
    maxLength: 100,
    type: String,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  firstName: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    minLength: 1,
    maxLength: 100,
    type: String,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  lastName: string;

  @ApiProperty({
    description: 'User email address - must be unique across the platform',
    example: 'john.doe@example.com',
    format: 'email',
    maxLength: 255,
    type: String,
    uniqueItems: true,
  })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'User password - will be hashed before storage',
    example: 'SecurePassword123!',
    minLength: 8,
    maxLength: 255,
    type: String,
    writeOnly: true,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  password: string;

  @ApiProperty({
    description:
      'User two-factor authentication secret - used for 2FA verification',
    example: 'SecureTwoFactorSecret123!',
    minLength: 8,
    maxLength: 255,
    type: String,
    writeOnly: true,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(255)
  twoFactorSecret: string;

  @ApiPropertyOptional({
    description: 'User phone number in international format',
    example: '+1234567890',
    maxLength: 20,
    type: String,
    required: false,
    pattern: '^\\+[1-9]\\d{1,14}$',
  })
  @IsOptional()
  @Matches(/^\+[1-9]\d{1,14}$/, {
    message: 'phone must be a valid E.164 phone number',
  })
  @MaxLength(20)
  phone: string;

  @ApiPropertyOptional({
    description: 'User date of birth for age verification and personalization',
    example: '1990-01-15',
    format: 'date',
    type: String,
  })
  @Type(() => Date)
  @IsDate()
  dateOfBirth: Date;

  constructor(
    country: COUNTRIES,
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    twoFactorSecret: string,
    phone: string,
    dateOfBirth: Date,
  ) {
    this.country = country;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.password = password;
    this.twoFactorSecret = twoFactorSecret;
    this.phone = phone;
    this.dateOfBirth = dateOfBirth;
  }
}

/**
 * DTO for creating a new user account with required and optional fields.
 * Extends UserBaseDto with additional fields for account activation, role and store assignments.
 */
export class CreateUserDto extends UserBaseDto {
  @ApiProperty({
    description: 'Account activation status - false for suspended accounts',
    example: true,
    type: Boolean,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive: boolean;

  @ApiProperty({
    type: String,
    format: 'uuid',
    isArray: true,
    title: 'User Role IDs',
    description:
      'Role IDs to assign to the user - must be valid UUIDs of existing roles',
    example: [EXAMPLE_ROLE_ID],
    required: false,
  })
  @ToArray()
  @IsUUID('all', { each: true })
  @IsOptional()
  roleIds: UUID[];

  constructor(
    country: COUNTRIES,
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    twoFactorSecret: string,
    phone: string,
    dateOfBirth: Date,
    isActive: boolean,
    roleIds: UUID[],
  ) {
    super(
      country,
      firstName,
      lastName,
      email,
      password,
      twoFactorSecret,
      phone,
      dateOfBirth,
    );
    this.isActive = isActive;
    this.roleIds = roleIds;
  }
}

/**
 * DTO for retrieving complete user information including system-generated fields.
 *
 * Extends UserBaseDto with read-only fields like ID, account status, and security tokens
 * that are managed by the system and should not be directly modified by users.
 */
export class GetUserDto extends UserBaseDto {
  @ApiProperty({
    description: 'Unique user identifier generated by the system',
    example: EXAMPLE_USER_ID,
    format: 'uuid',
    type: String,
    readOnly: true,
  })
  @IsUUID()
  id: UUID;

  @ApiProperty({
    description: 'Account activation status - false for suspended accounts',
    example: true,
    type: Boolean,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Email verification status - required for full account access',
    example: false,
    type: Boolean,
    default: false,
  })
  @IsBoolean()
  isEmailVerified: boolean;

  @ApiProperty({
    description: 'Token used for email verification process',
    type: String,
    writeOnly: true,
  })
  @IsString()
  emailVerificationToken: string;

  @ApiProperty({
    description: 'Token for password reset functionality - expires after use',
    type: String,
    writeOnly: true,
  })
  @IsString()
  passwordResetToken: string;

  @ApiProperty({
    description: 'Expiration timestamp for password reset token',
    example: '2025-07-04T12:00:00.000Z',
    format: 'date-time',
    type: String,
  })
  @IsDate()
  passwordResetExpires: Date;

  @ApiProperty({
    description: 'Date when the user account was created',
    example: '2023-01-01T12:00:00.000Z',
    format: 'date-time',
    type: Date,
  })
  @IsDate()
  createdAt: Date;

  @ApiProperty({
    description: 'Date when the user account was last updated',
    example: '2023-01-02T12:00:00.000Z',
    format: 'date-time',
    type: Date,
  })
  @IsDate()
  updatedAt: Date;

  @ApiProperty({
    description: 'Is two-factor authentication enabled for the user',
    example: true,
    type: Boolean,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isTwoFactorEnabled: boolean;

  constructor(
    id: UUID,
    country: COUNTRIES,
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    twoFactorSecret: string,
    phone: string,
    dateOfBirth: Date,
    isActive: boolean,
    isEmailVerified: boolean,
    passwordResetExpires: Date,
    emailVerificationToken: string,
    passwordResetToken: string,
    isTwoFactorEnabled: boolean,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(
      country,
      firstName,
      lastName,
      email,
      password,
      twoFactorSecret,
      phone,
      dateOfBirth,
    );
    this.id = id;
    this.isActive = isActive;
    this.isTwoFactorEnabled = isTwoFactorEnabled;
    this.isEmailVerified = isEmailVerified;
    this.emailVerificationToken = emailVerificationToken;
    this.passwordResetToken = passwordResetToken;
    this.passwordResetExpires = passwordResetExpires;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}

/**
 * DTO for representing related user information in API responses without sensitive fields.
 *
 * Used for nested user representations such as the creator of an entity or users assigned role, store,
 * while omitting sensitive fields that should not be exposed in these contexts.
 */
export class GetRelatedUserDto extends OmitType(GetUserDto, [
  'password',
  'twoFactorSecret',
  'isEmailVerified',
  'emailVerificationToken',
  'passwordResetToken',
  'passwordResetExpires',
  'isTwoFactorEnabled',
]) {}

/**
 * DTO for representing the creator of an entity in API responses.
 * Extends GetRelatedUserDto to provide a consistent structure for user information while ensuring sensitive fields are excluded.
 */
export class GetCreatedByDto extends OmitType(GetUserDto, [
  'password',
  'twoFactorSecret',
  'isEmailVerified',
  'emailVerificationToken',
  'passwordResetToken',
  'passwordResetExpires',
  'isTwoFactorEnabled',
]) {}

/**
 * DTO for representing the user who assigned a role to another user in API responses.
 * Extends GetRelatedUserDto to provide a consistent structure for user information while ensuring sensitive fields are excluded.
 */
export class GetAssignedByDto extends OmitType(GetUserDto, [
  'password',
  'twoFactorSecret',
  'isEmailVerified',
  'emailVerificationToken',
  'passwordResetToken',
  'passwordResetExpires',
  'isTwoFactorEnabled',
]) {}

/**
 * Complete user data DTO for API responses including system-generated fields.
 *
 * Extends UserBaseDto with read-only fields like ID, account status, and security tokens
 * that are managed by the system and should not be directly modified by users.
 */
export class UserResponseDto extends GetUserDto {
  @ApiProperty({
    description: 'User that created the user',
    type: GetCreatedByDto,
    isArray: false,
  })
  @Type(() => GetCreatedByDto)
  @ValidateNested()
  createdBy?: GetCreatedByDto;

  @ApiProperty({
    description: 'List of roles assigned to the user',
    type: GetUserRoleDto,
    isArray: true,
  })
  @Type(() => GetUserRoleDto)
  @ValidateNested({ each: true })
  userRoles?: GetUserRoleDto[];

  constructor(
    id: UUID,
    country: COUNTRIES,
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    twoFactorSecret: string,
    phone: string,
    dateOfBirth: Date,
    isActive: boolean,
    isEmailVerified: boolean,
    passwordResetExpires: Date,
    emailVerificationToken: string,
    passwordResetToken: string,
    isTwoFactorEnabled: boolean,
    createdAt: Date,
    updatedAt: Date,
    createdBy: GetCreatedByDto,
    userRoles?: GetUserRoleDto[],
  ) {
    super(
      id,
      country,
      firstName,
      lastName,
      email,
      password,
      twoFactorSecret,
      phone,
      dateOfBirth,
      isActive,
      isEmailVerified,
      passwordResetExpires,
      emailVerificationToken,
      passwordResetToken,
      isTwoFactorEnabled,
      createdAt,
      updatedAt,
    );
    this.createdBy = createdBy;
    this.userRoles = userRoles ?? [];
  }
}

/**
 * DTO for partial user updates using PATCH operations.
 *
 * Inherits all fields from CreateUserDto as optional, plus additional system fields
 * that may be updated by administrators or system processes.
 */
export class UpdateUserDto extends PartialType(GetUserDto) {
  constructor(
    firstName: string,
    lastName: string,
    email: string,
    password: string,
    phone: string,
    dateOfBirth: Date,
    isActive: boolean,
    isEmailVerified: boolean,
    emailVerificationToken: string,
    isTwoFactorEnabled: boolean,
    passwordResetToken: string,
    passwordResetExpires: Date,
  ) {
    super(
      firstName,
      lastName,
      email,
      password,
      phone,
      dateOfBirth,
      isActive,
      isEmailVerified,
      emailVerificationToken,
      isTwoFactorEnabled,
      passwordResetToken,
      passwordResetExpires,
    );
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.password = password;
    this.phone = phone;
    this.dateOfBirth = dateOfBirth;
    this.isActive = isActive;
    this.isTwoFactorEnabled = isTwoFactorEnabled;
    this.isEmailVerified = isEmailVerified;
    this.emailVerificationToken = emailVerificationToken;
    this.passwordResetToken = passwordResetToken;
    this.passwordResetExpires = passwordResetExpires;
  }
}

/**
 * Paginated response wrapper for user list endpoints.
 * Extends base pagination with strongly-typed user array validation.
 */
export class UserListResponseDto extends PaginatedResponseDto {
  @ApiProperty({
    description: 'Array of user objects matching the query criteria',
    type: UserResponseDto,
    isArray: true,
  })
  @Type(() => UserResponseDto)
  @ValidateNested({ each: true })
  users: UserResponseDto[];

  constructor(
    total: number,
    page: number,
    limit: number,
    totalPages: number,
    users: UserResponseDto[],
  ) {
    super(total, page, limit, totalPages);
    this.users = users;
  }
}
