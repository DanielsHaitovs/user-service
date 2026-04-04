// import { PaginationDto } from '@/baseDto/pagination.dto';
// import { ToArray } from '@/commonDecorators/array.decorator';
// import { ToBoolean } from '@/commonDecorators/boolean.decorator';
// import {
//   EXAMPLE_PERMISSION_CODE,
//   EXAMPLE_PERMISSION_ID,
//   EXAMPLE_PERMISSION_NAME,
// } from '@/libConst/permission.const';
// import {
//   getPermissionsGenericSelectableFields,
//   getRoleGenericSelectableFields,
// } from '@/roleHelper/role-fields.util';
// import { getCreatedByGenericSelectableFields } from '@/userHelper/user-fields.util';
// import {
//   ApiProperty,
//   ApiPropertyOptional,
//   IntersectionType,
// } from '@nestjs/swagger';

// import {
//   IsArray,
//   IsBoolean,
//   IsEnum,
//   IsNotEmpty,
//   IsOptional,
//   IsString,
//   IsUUID,
// } from 'class-validator';
// import { UUID } from 'crypto';

// export class PermissionQueryParametersDto {
//   @ApiPropertyOptional({
//     description: 'Filter by specific permissions UUIDs for bulk operations',
//     type: String,
//     isArray: true,
//     example: [EXAMPLE_PERMISSION_ID],
//     format: 'uuid',
//     uniqueItems: true,
//   })
//   @IsArray()
//   @IsUUID('4', { each: true })
//   permissionIds?: UUID[];

//   @ApiPropertyOptional({
//     description:
//       'Filter by permission names - supports partial matching across multiple names',
//     example: [EXAMPLE_PERMISSION_NAME],
//     type: String,
//     isArray: true,
//     maxItems: 100,
//   })
//   @IsString({ each: true })
//   @IsArray()
//   permissionNames?: string[];

//   @ApiPropertyOptional({
//     description:
//       'Filter by permission codes - supports partial matching across multiple codes',
//     example: [EXAMPLE_PERMISSION_CODE],
//     type: String,
//     isArray: true,
//     maxItems: 100,
//   })
//   @IsString({ each: true })
//   @IsArray()
//   permissionCodes?: string[];

//   constructor(
//     permissionIds?: UUID[],
//     permissionNames?: string[],
//     permissionCodes?: string[],
//   ) {
//     this.permissionIds = permissionIds ?? [];
//     this.permissionNames = permissionNames ?? [];
//     this.permissionCodes = permissionCodes ?? [];
//   }
// }

// export class PermissionSortDto {
//   @ApiPropertyOptional({
//     description: 'Entity field name to sort results by',
//     enum: getPermissionsGenericSelectableFields({}),
//     type: String,
//     required: false,
//   })
//   @IsEnum(getPermissionsGenericSelectableFields({}), {
//     each: true,
//     message: 'sortField must be a valid permission field',
//   })
//   @IsOptional()
//   sortField: string | undefined;

//   @ApiPropertyOptional({
//     description: 'Sort direction for result ordering',
//     example: 'ASC',
//     enum: ['ASC', 'DESC'],
//     type: String,
//     default: 'ASC',
//   })
//   @IsEnum(['ASC', 'DESC'], {
//     message: 'sortOrder must be either ASC or DESC',
//     each: true,
//   })
//   sortOrder: 'ASC' | 'DESC';

//   constructor(
//     sortField: string | undefined,
//     sortOrder: 'ASC' | 'DESC' | undefined,
//   ) {
//     this.sortField = sortField;
//     this.sortOrder = sortOrder ?? 'ASC';
//   }
// }

// export class PermissionSelectDto {
//   @ApiProperty({
//     description:
//       'Specific permission fields to return - optimizes payload size and performance',
//     enum: getPermissionsGenericSelectableFields({}),
//     type: String,
//     isArray: true,
//     required: false,
//     example: getPermissionsGenericSelectableFields({}),
//   })
//   @IsEnum(getPermissionsGenericSelectableFields({}), { each: true })
//   @IsOptional()
//   @ToArray()
//   selectPermissionFields: string[];

//   constructor(selectPermissionFields: string[] | undefined) {
//     this.selectPermissionFields = selectPermissionFields ?? [];
//   }
// }

// export class PermissionRelationSelectDto extends PermissionSelectDto {
//   @ApiPropertyOptional({
//     description:
//       'Specific user fields to return - optimizes payload size and performance',
//     enum: getCreatedByGenericSelectableFields(),
//     type: String,
//     isArray: true,
//     required: false,
//     example: getCreatedByGenericSelectableFields(['id', 'email']),
//   })
//   @ToArray()
//   @IsEnum(getCreatedByGenericSelectableFields(), {
//     each: true,
//     message: 'Each selectUserField must be a valid user field',
//   })
//   @IsOptional()
//   selectCreatedByFields: string[];

//   @ApiPropertyOptional({
//     description:
//       'Specific role fields to return - optimizes payload size and performance',
//     enum: getRoleGenericSelectableFields({}),
//     type: String,
//     isArray: true,
//     required: false,
//     example: getRoleGenericSelectableFields({}),
//   })
//   @IsOptional()
//   @ToArray()
//   @IsEnum(getRoleGenericSelectableFields({}), { each: true })
//   selectRoleFields: string[];

//   constructor(
//     selectPermissionFields: string[] | undefined,
//     selectCreatedByFields: string[] | undefined,
//     selectRoleFields: string[] | undefined,
//   ) {
//     super(selectPermissionFields);
//     this.selectCreatedByFields = selectCreatedByFields ?? [];
//     this.selectRoleFields = selectRoleFields ?? [];
//   }
// }

// export class PermissionQueryResponseControlDto extends PermissionRelationSelectDto {
//   @ApiPropertyOptional({
//     type: Boolean,
//     description: 'Include Created By in the response',
//     default: false,
//     required: false,
//   })
//   @IsOptional()
//   @ToBoolean()
//   @IsBoolean()
//   includeCreatedBy: boolean;

//   @ApiPropertyOptional({
//     type: Boolean,
//     description: 'Include Roles in the response',
//     default: false,
//     required: false,
//   })
//   @IsOptional()
//   @ToBoolean()
//   @IsBoolean()
//   includeRoles: boolean;

//   constructor(
//     selectPermissionFields: string[] | undefined,
//     selectCreatedByFields: string[] | undefined,
//     selectRoleFields: string[] | undefined,
//     includeCreatedBy: boolean | undefined,
//     includeRoles: boolean | undefined,
//   ) {
//     super(selectPermissionFields, selectCreatedByFields, selectRoleFields);
//     this.includeCreatedBy = includeCreatedBy ?? false;
//     this.includeRoles = includeRoles ?? false;
//   }
// }

// export class PermissionRequestDto extends IntersectionType(
//   PermissionSortDto,
//   PaginationDto,
//   PermissionQueryResponseControlDto,
// ) {}

// export class GetPermissionsByIdsQueryDto extends PermissionRequestDto {
//   @ApiProperty({
//     description: 'Filter by specific permission UUIDs for bulk operations',
//     type: String,
//     isArray: true,
//     format: 'uuid',
//     uniqueItems: true,
//     nullable: false,
//   })
//   @ToArray()
//   @IsNotEmpty()
//   @IsUUID('4', { each: true, message: 'Each id must be a valid UUIDv4' })
//   ids: UUID[];

//   constructor(ids: UUID[]) {
//     super();
//     this.ids = ids;
//   }
// }

// export class GetPermissionsByCodesQueryDto extends PermissionRequestDto {
//   @ApiProperty({
//     description: 'Filter by specific permission UUIDs for bulk operations',
//     type: String,
//     isArray: true,
//     format: 'uuid',
//     uniqueItems: true,
//     nullable: false,
//   })
//   @ToArray()
//   @IsNotEmpty()
//   @IsString({ each: true, message: 'Each code must be a valid string' })
//   codes: string[];

//   constructor(codes: string[]) {
//     super();
//     this.codes = codes;
//   }
// }

// export class PermissionSearchRequestDto extends IntersectionType(
//   PaginationDto,
//   PermissionSortDto,
//   PermissionSelectDto,
// ) {}
