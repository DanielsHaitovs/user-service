import { JWTPayload } from '@/auth/interfaces/req.interface';
import { BaseController } from '@/base/base.controller';
import { DeleteResponseDto } from '@/base/dto/response.dto';
import { ApiOkList } from '@/common/decorators/api.decorator';
import { TraceController } from '@/common/decorators/trace.decorator';
import { CurrentUser } from '@/common/decorators/user.decorator';
import { AuthenticationGuard } from '@/common/guards/auth.guard';
import { PermissionsGuard } from '@/common/guards/permission.guard';
import { ParseUUIDArrayPipe } from '@/common/pipes/uuidArray.pipe';
import {
  CreateDepartmentDto,
  DepartmentListResponseDto,
  DepartmentResponseDto,
  UpdateDepartmentDto,
} from '@/department/dto/department.dto';
import {
  DepartmentSearchRequestDto,
  FilterDepartmentsQueryDto,
  GetDepartmentsByIdsRequestDto,
} from '@/department/dto/query.dto';
import { DepartmentService } from '@/department/services/department.service';
import { QueryService } from '@/department/services/query.service';
import {
  CREATE_DEPARTMENT,
  DELETE_DEPARTMENT,
  DEPARTMENT_API_OK_RESPONSE_MSG,
  DEPARTMENT_FULL_OPERATION_BAD_REQUEST_MSG,
  DEPARTMENT_GENERIC_BAD_REQUEST_MSG,
  DEPARTMENT_MIN_API_OK_LIST,
  DEPARTMENT_NAME_EXISTS_MSG,
  EXAMPLE_DEPARTMENT_ID,
  EXAMPLE_DEPARTMENT_NAME,
  READ_DEPARTMENT,
  UPDATE_DEPARTMENT,
} from '@/lib/const/department.const';
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';

import { UUID } from 'crypto';

@ApiTags('Departments')
@Controller('departments')
@TraceController()
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthenticationGuard, PermissionsGuard)
export class DepartmentController extends BaseController<
  CreateDepartmentDto,
  GetDepartmentsByIdsRequestDto,
  DepartmentSearchRequestDto,
  UpdateDepartmentDto,
  DepartmentResponseDto,
  DepartmentListResponseDto
> {
  constructor(
    private readonly departmentService: DepartmentService,
    private readonly queryService: QueryService,
  ) {
    super();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOkList({
    permissions: [CREATE_DEPARTMENT, READ_DEPARTMENT],
    operation: {
      summary: 'Create a new department',
      description: 'Creates a new department with the provided information.',
    },
    notFound: {
      description: 'Related entities not found',
    },
    createdResponse: {
      description: 'Departments successfully created',
      type: DepartmentResponseDto,
    },
    conflictMessage: {
      description: DEPARTMENT_NAME_EXISTS_MSG,
    },
    badRequestMessages: {
      examples: DEPARTMENT_GENERIC_BAD_REQUEST_MSG,
    },
    body: {
      type: CreateDepartmentDto,
      description: 'Departments creation data',
    },
  })
  async create(
    @Body() createDepartmentDto: CreateDepartmentDto,
    @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<DepartmentResponseDto> {
    const { id, hasAccessToUsers } = this.extractAccess(requestedByUser);

    return await this.departmentService.create({
      createDepartmentDto,
      createdBy: id,
      hasAccessToUsers,
    });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkList({
    permissions: [READ_DEPARTMENT],
    operation: {
      summary: 'Searches for departments by ID',
      description: 'Searches for departments by their unique identifiers',
    },
    notFound: {
      description: 'Departments not found',
      example: `Departments with id ${EXAMPLE_DEPARTMENT_ID} not found`,
    },
    ...DEPARTMENT_MIN_API_OK_LIST,
  })
  async findByIds(
    @Query() query: GetDepartmentsByIdsRequestDto,
    @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<DepartmentListResponseDto> {
    const { hasAccessToUsers } = this.extractAccess(requestedByUser);

    const { ids, ...control } = query;

    return await this.departmentService.findByIds({
      ids,
      hasAccessToUsers,
      control,
    });
  }

  @Get('search/:value')
  @HttpCode(HttpStatus.OK)
  @ApiParam({
    name: 'value',
    type: String,
    required: true,
    description: 'Search value for department (name or ID)',
    example: EXAMPLE_DEPARTMENT_NAME,
  })
  @ApiOkList({
    permissions: [READ_DEPARTMENT],
    operation: {
      summary: 'Search for departments',
      description: 'Searches for department by name, id',
    },
    ...DEPARTMENT_MIN_API_OK_LIST,
  })
  async search(
    @Param('value') value: string,
    @Query() control: DepartmentSearchRequestDto,
  ): Promise<DepartmentListResponseDto> {
    return await this.departmentService.searchFor({
      value,
      control,
    });
  }

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOkList({
    permissions: [UPDATE_DEPARTMENT, READ_DEPARTMENT],
    operation: {
      summary: 'Update department',
      description: 'Updates a department with the provided information.',
    },
    body: {
      description: 'Departments update data',
      type: UpdateDepartmentDto,
    },
    notFound: {
      description: 'Departments with id department-id-1 not found',
    },
    okOperation: {
      description: 'Departments successfully updated',
      type: DepartmentResponseDto,
      isArray: false,
    },
    conflictMessage: {
      description: DEPARTMENT_NAME_EXISTS_MSG,
    },
    badRequestMessages: {
      examples: DEPARTMENT_GENERIC_BAD_REQUEST_MSG,
    },
  })
  async updateById(
    @Param('id') id: UUID,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<DepartmentResponseDto> {
    return await this.departmentService.update({ id, updateDepartmentDto });
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiQuery({
    name: 'ids',
    type: String,
    isArray: true,
    format: 'uuid',
    required: true,
    description: 'Departments unique identifiers',
  })
  @ApiOkList({
    permissions: [DELETE_DEPARTMENT, READ_DEPARTMENT],
    operation: {
      summary: 'Delete departments by IDs',
      description: 'Deletes multiple departments by their unique identifiers.',
    },
    badRequestMessages: {
      examples: ['Each id must be a valid UUIDv4'],
    },
    notFound: {
      description: 'One or more departments not found',
      example:
        'Departments with IDs [department-id-1, department-id-2] not found',
    },
    okOperation: {
      description: 'Departments deleted successfully',
      type: DeleteResponseDto,
      isArray: false,
    },
    noContent: {
      description: 'No departments to delete (empty IDs list)',
    },
  })
  async delete(
    @Query('ids', ParseUUIDArrayPipe) ids: UUID[],
  ): Promise<DeleteResponseDto> {
    return await this.departmentService.deleteByIds(ids);
  }

  @Get('query')
  @ApiOkList({
    permissions: [READ_DEPARTMENT],
    operation: {
      summary: 'Filter and retrieve users',
      description:
        'Filters users based on various criteria and returns a paginated list of users.',
    },
    badRequestMessages: {
      examples: DEPARTMENT_FULL_OPERATION_BAD_REQUEST_MSG,
    },
    okOperation: {
      description: DEPARTMENT_API_OK_RESPONSE_MSG,
      type: DepartmentListResponseDto,
      isArray: false,
    },
  })
  async filter(
    @Query() filters: FilterDepartmentsQueryDto,
    @CurrentUser() requestedByUser: JWTPayload,
  ): Promise<DepartmentListResponseDto> {
    const { hasAccessToUsers } = this.extractAccess(requestedByUser);

    return await this.queryService.getDepartements({
      filters,
      hasAccessToUsers,
      requestedByUserId: requestedByUser.id,
    });
  }
}
