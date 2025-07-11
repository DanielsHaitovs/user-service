import {
  EXAMPLE_DEPARTMENT_COUNTRY,
  EXAMPLE_DEPARTMENT_NAME,
} from '@/lib/const/department.const';
import { ApiProperty, PartialType } from '@nestjs/swagger';

import { IsString, MaxLength, MinLength } from 'class-validator';
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
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  country: string;

  constructor(name: string, country: string) {
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

  constructor(id: UUID, name: string, country: string) {
    super(name, country);
    this.id = id;
    this.name = name;
    this.country = country;
  }
}

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {}
