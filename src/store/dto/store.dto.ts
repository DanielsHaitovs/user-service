import { PaginatedResponseDto } from '@/baseDto/pagination.dto';
import {
  EXAMPLE_STORE_CODE,
  EXAMPLE_STORE_NAME,
  EXAMPLE_STORE_VIEW_CODE,
} from '@/lib/const/store.const';
import { GetCreatedByDto, GetRelatedUserDto } from '@/userDto/user.dto';
import { ApiProperty, PartialType } from '@nestjs/swagger';

import { Type } from 'class-transformer';
import {
  IsDate,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { UUID } from 'crypto';

/**
 * Base DTO for creating and retrieving STORE information, containing common fields and validation rules.
 * This class serves as the foundation for more specific DTOs used in different API operations related to STOREs.
 * It includes fields for name, code, and view code, along with appropriate validation decorators to ensure data integrity.
 * The constructor allows for easy instantiation of the DTO with the required fields.
 * The fields in this DTO are designed to capture essential information about a STORE, which can be extended or modified in derived DTO classes as needed.
 * The validation rules ensure that the data provided for creating or updating a STORE meets the expected format and constraints, such as length and type requirements.
 */
export class StoreBaseDto {
  @ApiProperty({
    description: 'Name of the store',
    example: EXAMPLE_STORE_NAME,
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
    description: 'Code of the store',
    example: EXAMPLE_STORE_CODE,
    required: true,
    minLength: 1,
    maxLength: 100,
    type: String,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  code: string;

  @ApiProperty({
    description: 'Store View Code',
    example: EXAMPLE_STORE_VIEW_CODE,
    required: true,
    minLength: 1,
    maxLength: 100,
    type: String,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  viewCode: string;

  constructor(name: string, code: string, viewCode: string) {
    this.name = name;
    this.code = code;
    this.viewCode = viewCode;
  }
}

/**
 * DTO for creating a new STORE, extending the base DTO with any additional fields or validation rules specific to the creation process.
 * This class can be used in API endpoints that handle the creation of STOREs, ensuring that the required data is provided and validated according to the defined rules.
 * By extending StoreBaseDto, it inherits all the common fields and validation logic, while allowing for future extensions if needed without affecting the base structure.
 */
export class CreateStoreDto extends StoreBaseDto {}

/**
 * DTO for retrieving complete STORE information including system-generated fields.
 * Extends StoreBaseDto with read-only fields like ID, createdAt, and updatedAt that are managed by the system and should not be directly modified by users.
 * This class is used in API responses when fetching STORE details, providing a comprehensive view of the STORE entity while ensuring that certain fields are protected from modification.
 */
export class GetStoreDto extends StoreBaseDto {
  @ApiProperty({
    description: 'Unique identifier for the store',
    type: String,
  })
  id: UUID;

  @ApiProperty({
    description: 'Date when the store was created',
    example: '2023-01-01T12:00:00.000Z',
    format: 'date-time',
    type: Date,
  })
  @IsDate()
  createdAt: Date;

  @ApiProperty({
    description: 'Date when the store was last updated',
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
    code: string,
    viewCode: string,
  ) {
    super(name, code, viewCode);
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.name = name;
    this.code = code;
    this.viewCode = viewCode;
  }
}

/**
 * DTO for representing related store information in API responses without sensitive fields.
 *
 * Used for nested store representations such as the creator of an entity or stores assigned to a user,
 * while omitting sensitive fields that should not be exposed in these contexts.
 */
export class GetRelatedStoreDto extends GetStoreDto {}

/**
 * Full DTO for retrieving complete STORE information including related entities and system-generated fields.
 * Extends GetStoreDto with additional fields for related entities such as the creator and assigned users, while maintaining the read-only nature of system-generated fields.
 * This class is used in API responses when fetching detailed STORE information, providing a comprehensive view of the STORE entity along with its relationships to other entities in the system.
 */
export class StoreResponseDto extends GetStoreDto {
  @ApiProperty({
    description: 'User that created the store',
    type: GetCreatedByDto,
    isArray: false,
  })
  @Type(() => GetCreatedByDto)
  @ValidateNested()
  createdBy?: GetCreatedByDto;

  @ApiProperty({
    description: 'List of users assigned to the store',
    type: GetRelatedUserDto,
    isArray: true,
  })
  @Type(() => GetRelatedUserDto)
  @ValidateNested({ each: true })
  users?: GetRelatedUserDto[];

  constructor(
    id: UUID,
    createdAt: Date,
    updatedAt: Date,
    name: string,
    code: string,
    viewCode: string,
    createdBy: GetCreatedByDto,
    users: GetRelatedUserDto[],
  ) {
    super(id, createdAt, updatedAt, name, code, viewCode);
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.name = name;
    this.code = code;
    this.viewCode = viewCode;
    this.createdBy = createdBy;
    this.users = users;
  }
}

/**
 * DTO for paginated response when retrieving a list of STOREs, including metadata about pagination and an array of STORE details.
 * This class extends the PaginatedResponseDto to include a list of StoreResponseDto objects, providing both the pagination information and the detailed data for each STORE in the response.
 * It is used in API endpoints that return a list of STOREs, allowing clients to easily navigate through paginated results while also accessing comprehensive information about each STORE.
 * The constructor initializes the pagination metadata and the array of STORE details, ensuring that the response is structured correctly for client consumption.
 */
export class StoreListResponseDto extends PaginatedResponseDto {
  @ApiProperty({
    type: StoreResponseDto,
    isArray: true,
    description: 'List of stores',
  })
  @Type(() => StoreResponseDto)
  @ValidateNested({ each: true })
  stores: StoreResponseDto[];

  constructor(
    total: number,
    page: number,
    limit: number,
    totalPages: number,
    stores: StoreResponseDto[],
  ) {
    super(total, page, limit, totalPages);
    this.stores = stores;
  }
}

/**
 * DTO for updating an existing STORE, extending the base DTO with partial fields to allow for updates to any subset of the STORE's properties.
 * This class is used in API endpoints that handle the updating of STOREs, allowing clients to provide only the fields they wish to update while still benefiting from the validation rules defined in StoreBaseDto.
 * By using PartialType, all fields from StoreBaseDto become optional in UpdateStoreDto, enabling flexible updates without requiring clients to resend unchanged data.
 * This design promotes efficient data transfer and simplifies the update process for clients, while maintaining the integrity of the data through validation.
 */
export class UpdateStoreDto extends PartialType(CreateStoreDto) {}
