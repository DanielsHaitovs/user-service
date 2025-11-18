import { PaginatedResponseDto } from '@/base/dto/pagination.dto';
import { COUNTRIES } from '@/lib/const/countries.const';
import {
  EXAMPLE_DEPARTMENT_COUNTRY,
  EXAMPLE_DEPARTMENT_NAME,
} from '@/lib/const/department.const';
import { GetUserDto } from '@/user/dto/user.dto';
import { ApiProperty, PartialType } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import {
  IsDate,
  IsEnum,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { UUID } from 'crypto';

export class DepartmentBaseDto {
  @ApiProperty({
    description: 'Name of the department',
    example: EXAMPLE_DEPARTMENT_NAME,
    required: true,
    minLength: 1,
    maxLength: 100,
    type: String,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Country where the department is located',
    example: EXAMPLE_DEPARTMENT_COUNTRY,
    required: true,
    minLength: 1,
    maxLength: 100,
    type: String,
  })
  @IsEnum(COUNTRIES)
  @MinLength(1)
  @MaxLength(100)
  country: keyof typeof COUNTRIES;

  constructor(name: string, country: keyof typeof COUNTRIES) {
    this.name = name;
    this.country = country;
  }
}

export class CreateDepartmentDto extends DepartmentBaseDto {}

export class DepartmentResponseDto extends DepartmentBaseDto {
  @ApiProperty({
    description: 'Unique identifier for the department',
    type: String,
  })
  id: UUID;

  @ApiProperty({
    description: 'User that created the department',
    type: GetUserDto,
    isArray: false,
  })
  @Type(() => GetUserDto)
  @ValidateNested()
  createdBy?: GetUserDto;

  @ApiProperty({
    description: 'List of users assigned to the department',
    type: GetUserDto,
    isArray: false,
  })
  @Type(() => GetUserDto)
  @ValidateNested({ each: true })
  users?: GetUserDto[];

  @ApiProperty({
    description: 'Date when the department was created',
    example: '2023-01-01T12:00:00.000Z',
    format: 'date-time',
    type: Date,
  })
  @IsDate()
  createdAt: Date;

  @ApiProperty({
    description: 'Date when the department was last updated',
    example: '2023-01-02T12:00:00.000Z',
    format: 'date-time',
    type: Date,
  })
  @IsDate()
  updatedAt: Date;

  constructor(
    id: UUID,
    createdAt: Date,
    updatedAt: Date,
    name: string,
    country: keyof typeof COUNTRIES,
    createdBy: GetUserDto,
    users: GetUserDto[],
  ) {
    super(name, country);
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.name = name;
    this.country = country;
    this.createdBy = createdBy;
    this.users = users;
  }
}

export class DepartmentListResponseDto extends PaginatedResponseDto {
  @ApiProperty({
    type: DepartmentResponseDto,
    isArray: true,
    description: 'List of departments',
  })
  @Type(() => DepartmentResponseDto)
  @ValidateNested({ each: true })
  departments: DepartmentResponseDto[];

  constructor(
    total: number,
    page: number,
    limit: number,
    totalPages: number,
    departments: DepartmentResponseDto[],
  ) {
    super(total, page, limit, totalPages);
    this.departments = departments;
  }
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}
