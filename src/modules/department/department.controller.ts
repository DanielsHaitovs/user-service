import { hasPermissions } from '@/auth/helper/permission.helper';
import { Permissions } from '@/common/decorators/permission.decorator';
import { TraceController } from '@/common/decorators/trace.decorator';
import {
  CurrentUser,
  CurrentUserPermissions,
} from '@/common/decorators/user.decorator';
import { AuthenticationGuard } from '@/common/guards/auth.guard';
import { PermissionsGuard } from '@/common/guards/permission.guard';
import { ParseUUIDArrayPipe } from '@/common/pipes/uuidArray.pipe';
import {
  CreateDepartmentDto,
  DepartmentListResponseDto,
  DepartmentResponseDto,
  UpdateDepartmentDto,
} from '@/department/dto/department.dto';
import { Departments } from '@/department/entities/department.entity';
import {
  getDepartmentGenericSelectableFields,
  getDepartmentSelectableFields,
} from '@/department/helper/department-fields.util';
import { DepartmentService } from '@/department/services/department.service';
import { QueryService } from '@/department/services/query.service';
import { COUNTRIES } from '@/lib/const/countries.const';
import {
  CREATE_DEPARTMENT,
  DELETE_DEPARTMENT,
  DEPARTMENT_NAME_EXISTS_MSG,
  DEPARTMENT_QUERY_ALIAS,
  EXAMPLE_DEPARTMENT_COUNTRY,
  EXAMPLE_DEPARTMENT_ID,
  EXAMPLE_DEPARTMENT_NAME,
  READ_DEPARTMENT,
  UPDATE_DEPARTMENT,
} from '@/lib/const/department.const';
import { READ_USER, USER_QUERY_ALIAS } from '@/lib/const/user.const';
import { DateFilterParam } from '@/lib/enum/query/filter.enum';
import {
  getCreatedByGenericSelectableFields,
  getUserGenericSelectableFields,
} from '@/user/helper/user-fields.util';
import {
  BadRequestException,
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  Param,
  ParseArrayPipe,
  ParseBoolPipe,
  ParseDatePipe,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiInternalServerErrorResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { UUID } from 'crypto';

import { JWTPayload } from '../../auth/interfaces/req.interface';

@ApiTags('Departments')
@Controller('departments')
@TraceController()
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthenticationGuard, PermissionsGuard)
export class DepartmentController {
  constructor(
    private readonly departmentService: DepartmentService,
    private readonly queryService: QueryService,
  ) {}
  @Post()
  @Permissions(CREATE_DEPARTMENT, READ_DEPARTMENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new department',
    description: 'Creates a new department with the provided information.',
  })
  @ApiBody({
    description: 'Departments creation data',
    type: CreateDepartmentDto,
    required: true,
    examples: {
      'new-department': {
        summary: 'Create a new department',
        description: 'Creates a new department with the provided information.',
        value: {
          name: EXAMPLE_DEPARTMENT_NAME,
          country: EXAMPLE_DEPARTMENT_COUNTRY,
        },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Departments successfully created',
    type: DepartmentResponseDto,
  })
  @ApiBadRequestResponse({
    description: 'Invalid input data provided',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 400 },
        message: {
          type: 'array',
          items: { type: 'string' },
          example: ['name should not be empty', 'country should not be empty'],
        },
        error: { type: 'string', example: BadRequestException.name },
      },
    },
  })
  @ApiConflictResponse({
    description: DEPARTMENT_NAME_EXISTS_MSG,
    example: {
      statusCode: 409,
      message: DEPARTMENT_NAME_EXISTS_MSG,
      error: ConflictException.name,
    },
  })
  @ApiInternalServerErrorResponse({
    description: InternalServerErrorException.name,
    example: {
      statusCode: 500,
      message: InternalServerErrorException.name,
      error: InternalServerErrorException.name,
    },
  })
  async createDepartment(
    @Body() createDepartmentDto: CreateDepartmentDto,
    @CurrentUser() createdByUser: JWTPayload,
  ): Promise<Departments> {
    const { permissions: userPermissions, id: createdBy } = createdByUser;

    const hasAccessToUser = hasPermissions({
      userPermissions,
      requestedPermissions: [READ_USER],
    });

    return await this.departmentService.create({
      createDepartmentDto,
      createdBy,
      hasAccessToUser,
    });
  }

  @Get()
  @Permissions(READ_DEPARTMENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get department by ID',
    description: 'Retrieves a department by its unique identifier.',
  })
  @ApiQuery({
    name: 'ids',
    type: String,
    isArray: true,
    required: true,
    description: 'Departments unique identifier',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: true,
    description: 'Filter departments by page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: true,
    description: 'Filter departments by limit of results per page',
    example: 10,
    maximum: 500,
  })
  @ApiQuery({
    name: 'sortField',
    type: String,
    required: false,
    description: 'Sort departments by sort field',
    enum: getDepartmentGenericSelectableFields({}),
    example: 'name',
  })
  @ApiQuery({
    name: 'sortOrder',
    type: String,
    required: false,
    description: 'Order departments by sort order',
    enum: ['ASC', 'DESC'],
  })
  @ApiQuery({
    name: 'select',
    type: String,
    required: false,
    description: 'Sort departments by sort field',
    isArray: true,
    enum: getDepartmentSelectableFields({}),
    example: ['department.name'],
  })
  @ApiOkResponse({
    description: 'Departments found and returned successfully',
    example: {
      id: EXAMPLE_DEPARTMENT_ID,
      name: EXAMPLE_DEPARTMENT_NAME,
      country: EXAMPLE_DEPARTMENT_COUNTRY,
    },
  })
  @ApiNotFoundResponse({
    description: 'Departments not found',
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 404 },
        message: {
          type: 'string',
          example: `Departments with id ${EXAMPLE_DEPARTMENT_ID} not found`,
        },
        error: { type: 'string', example: NotFoundException.name },
      },
    },
  })
  async getDepartmentById(
    @Query('ids', ParseUUIDArrayPipe) ids: UUID[],
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('sortField') sortField: string,
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC',
    @Query('select', new ParseArrayPipe({ optional: true })) select: string[],
    @CurrentUserPermissions() userPermissions: string[],
  ): Promise<Departments[]> {
    if (page < 1 || limit < 1) {
      throw new BadRequestException(
        'Pagination parameters must be greater than 0',
      );
    }

    const hasAccessToUser = hasPermissions({
      userPermissions,
      requestedPermissions: [READ_USER],
    });

    return await this.departmentService.findByIds({
      ids,
      pagination: { page, limit },
      select,
      sort: { sortField, sortOrder },
      hasAccessToUser,
    });
  }

  @Get('search/:value')
  @Permissions(READ_DEPARTMENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    description: 'Searches for department by name, country, id',
  })
  @ApiParam({
    name: 'value',
    type: String,
    required: true,
    description: 'Search value for department (name or ID)',
    example: EXAMPLE_DEPARTMENT_NAME,
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: true,
    description: 'Filter departments by page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: true,
    description: 'Filter departments by limit of results per page',
    example: 10,
    maximum: 500,
  })
  @ApiQuery({
    name: 'sortField',
    type: String,
    required: false,
    description: 'Sort departments by sort field',
    enum: getDepartmentGenericSelectableFields({}),
    example: 'name',
  })
  @ApiQuery({
    name: 'sortOrder',
    type: String,
    required: false,
    description: 'Order departments by sort order',
    enum: ['ASC', 'DESC'],
  })
  @ApiQuery({
    name: 'select',
    type: String,
    required: false,
    description: 'Sort departments by sort field',
    isArray: true,
    enum: getDepartmentSelectableFields({}),
    example: ['department.name'],
  })
  @ApiOkResponse({
    description: 'Departments found and returned successfully',
    example: {
      total: 1,
      page: 1,
      limit: 10,
      departments: [
        {
          id: EXAMPLE_DEPARTMENT_ID,
          name: EXAMPLE_DEPARTMENT_NAME,
          country: COUNTRIES.US,
        },
      ],
    },
  })
  @ApiInternalServerErrorResponse({
    description: InternalServerErrorException.name,
    schema: {
      type: 'object',
      properties: {
        statusCode: { type: 'number', example: 500 },
        message: { type: 'string', example: InternalServerErrorException.name },
        error: { type: 'string', example: InternalServerErrorException.name },
      },
    },
  })
  async searchForDepartments(
    @Param('value') value: string,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('sortField') sortField: string,
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC',
    @Query('select', new ParseArrayPipe({ optional: true })) select: string[],
  ): Promise<DepartmentListResponseDto> {
    if (!sortField || sortField === '') {
      sortField = `${DEPARTMENT_QUERY_ALIAS}.name`;
    }

    return await this.departmentService.searchFor({
      value,
      pagination: {
        page,
        limit,
      },
      sort: {
        sortField,
        sortOrder,
      },
      select,
    });
  }

  @Patch(':id')
  @Permissions(UPDATE_DEPARTMENT, READ_DEPARTMENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update department',
    description: 'Updates a department with the provided information.',
  })
  @ApiBody({
    description: 'Departments update data',
    type: UpdateDepartmentDto,
    required: true,
  })
  @ApiOkResponse({
    description: 'Departments successfully updated',
    example: {
      id: EXAMPLE_DEPARTMENT_ID,
      name: 'Updated Departments Name',
    },
  })
  @ApiNotFoundResponse({
    description: 'Departments not found',
    example: {
      statusCode: 404,
      message: 'Departments with id department-id-1 not found',
      error: 'NotFoundException',
    },
  })
  async updateDepartment(
    @Param('id') id: UUID,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<Departments> {
    return await this.departmentService.update({ id, updateDepartmentDto });
  }

  @Delete()
  @Permissions(DELETE_DEPARTMENT, READ_DEPARTMENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete departments by IDs',
    description: 'Deletes departments with the provided IDs.',
  })
  @ApiQuery({
    name: 'ids',
    type: String,
    isArray: true,
    format: 'uuid',
    required: true,
    description: 'Departments unique identifiers',
  })
  @ApiOkResponse({
    description: 'Departments successfully deleted',
    example: {
      deletedIds: [EXAMPLE_DEPARTMENT_ID, 'department-id-2'],
    },
  })
  @ApiNoContentResponse({
    description: 'No departments to delete (empty IDs list)',
  })
  @ApiNotFoundResponse({
    description: 'One or more departments not found',
    example: {
      statusCode: 404,
      message:
        'Departments with IDs [department-id-1, department-id-2] not found',
      error: 'NotFoundException',
    },
  })
  async deleteDepartments(
    @Query('ids', ParseUUIDArrayPipe) ids: UUID[],
  ): Promise<{ deleted: number }> {
    return await this.departmentService.deleteByIds(ids);
  }

  @Get('query')
  @Permissions(READ_DEPARTMENT)
  @ApiQuery({
    name: 'ids',
    type: String,
    isArray: true,
    required: false,
    description: 'Filter users by ID',
  })
  @ApiQuery({
    name: 'names',
    type: String,
    isArray: true,
    required: false,
    description: 'Filter departments by name',
  })
  @ApiQuery({
    name: 'countries',
    type: String,
    enum: COUNTRIES,
    isArray: true,
    required: false,
    description: 'Filter departments by countries',
  })
  @ApiQuery({
    name: 'userIds',
    type: String,
    isArray: true,
    required: false,
    description: 'Filter departments by users ID',
  })
  @ApiQuery({
    name: 'createdByUserIds',
    type: String,
    isArray: true,
    required: false,
    description: 'Filter by users id that created a departments',
  })
  @ApiQuery({
    name: 'includeUsers',
    type: Boolean,
    required: false,
    description: 'Add Users information to the response',
  })
  @ApiQuery({
    name: 'includeCreatedBy',
    type: Boolean,
    required: false,
    description: 'Add CreatedBy information to the response',
  })
  @ApiQuery({
    name: 'dateFrom',
    type: Date,
    required: false,
    description: 'Filter results created from this date',
    example: '2023-01-01T00:00:00.000Z',
  })
  @ApiQuery({
    name: 'dateTo',
    type: Date,
    required: false,
    description: 'Filter results created up to this date',
    example: '2023-12-31T23:59:59.999Z',
  })
  @ApiQuery({
    name: 'dateFilterParam',
    enum: DateFilterParam,
    required: false,
    description: 'Additional date filter parameter for custom filtering logic',
    example: DateFilterParam.CREATED_AT,
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: true,
    description: 'Filter users by page number',
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: true,
    description: 'Filter users by limit of results per page',
    example: 10,
    maximum: 500,
  })
  @ApiQuery({
    name: 'sortField',
    type: String,
    required: false,
    description: 'Filter users by sort order',
    enum: getDepartmentSelectableFields({ userAlias: USER_QUERY_ALIAS }),
  })
  @ApiQuery({
    name: 'sortOrder',
    type: String,
    required: false,
    description: 'Filter users by sort order',
    enum: ['ASC', 'DESC'],
  })
  @ApiQuery({
    name: 'selectUserFields',
    type: String,
    isArray: true,
    required: false,
    description: 'Select users fields',
    enum: getUserGenericSelectableFields({ alias: USER_QUERY_ALIAS }),
  })
  @ApiQuery({
    name: 'selectDepartmentFields',
    type: String,
    isArray: true,
    required: false,
    description: 'Select department fields',
    enum: getDepartmentGenericSelectableFields({}),
  })
  @ApiQuery({
    name: 'selectUserCreatedByFields',
    type: String,
    isArray: true,
    required: false,
    description: 'Select users created by fields',
    enum: getCreatedByGenericSelectableFields(),
  })
  async filterDepartments(
    @Query('ids', new ParseArrayPipe({ optional: true })) ids: UUID[],
    @Query('names', new ParseArrayPipe({ optional: true })) names: string[],
    @Query('countries', new ParseArrayPipe({ optional: true }))
    countries: string[],
    @Query('selectDepartmentFields', new ParseArrayPipe({ optional: true }))
    selectDepartmentFields: string[],
    @Query('userIds', new ParseArrayPipe({ optional: true }))
    userIds: UUID[],
    @Query('includeUsers', new ParseBoolPipe({ optional: true }))
    includeUsers: boolean,
    @Query('selectUserFields', new ParseArrayPipe({ optional: true }))
    selectUserFields: string[],
    @Query('createdByUserIds', new ParseArrayPipe({ optional: true }))
    createdByUserIds: UUID[],
    @Query('includeCreatedBy', new ParseBoolPipe({ optional: true }))
    includeCreatedBy: boolean,
    @Query('selectUserCreatedByFields', new ParseArrayPipe({ optional: true }))
    selectUserCreatedByFields: string[],
    @Query('dateFrom', new ParseDatePipe({ optional: true }))
    dateFrom: Date | undefined,
    @Query('dateTo', new ParseDatePipe({ optional: true }))
    dateTo: Date | undefined,
    @Query(
      'dateFilterParam',
      new ParseEnumPipe(DateFilterParam, { optional: true }),
    )
    dateFilterParam: DateFilterParam | undefined,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('sortField') sortField: string,
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC',
    @CurrentUserPermissions() userPermissions: string[],
  ): Promise<DepartmentListResponseDto> {
    const hasAccessToUser = hasPermissions({
      userPermissions,
      requestedPermissions: [READ_USER],
    });

    return await this.queryService.getDepartements(
      {
        query: {
          ids,
          names,
          countries,
          userIds,
          createdByUserIds,
        },
        includeCreatedBy,
        includeUsers,
        dateFrom,
        dateTo,
        dateFilterParam,
        pagination: {
          page,
          limit,
        },
        sort: {
          sortField,
          sortOrder,
        },
        selectUserFields,
        selectDepartmentFields,
        selectUserCreatedByFields,
      },
      hasAccessToUser,
    );
  }
}
