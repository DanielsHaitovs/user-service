import { Permissions } from '@/common/decorators/permission.decorator';
import { PermissionsGuard } from '@/common/guards/permission.guard';
import {
  CreateDepartmentDto,
  DepartmentListResponseDto,
  UpdateDepartmentDto,
} from '@/department/dto/department.dto';
import { Department } from '@/department/entities/department.entity';
import { DepartmentService } from '@/department/services/department.service';
import {
  CREATE_DEPARTMENT,
  DELETE_DEPARTMENT,
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
  InternalServerErrorException,
  Param,
  ParseArrayPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import {
  ApiBearerAuth,
  ApiBody,
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

import { getDepartmentSelectableFields } from './helper/department-fields.util';

@ApiTags('Departments')
@Controller('departments')
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthGuard('jwt'), PermissionsGuard)
export class DepartmentController {
  constructor(private readonly departmentService: DepartmentService) {}

  @Post()
  @Permissions(CREATE_DEPARTMENT, READ_DEPARTMENT)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new department',
    description: 'Creates a new department with the provided information.',
  })
  @ApiBody({
    description: 'Department creation data',
    type: CreateDepartmentDto,
    required: true,
  })
  @ApiCreatedResponse({
    description: 'Department successfully created',
    example: {
      id: EXAMPLE_DEPARTMENT_ID,
      name: EXAMPLE_DEPARTMENT_NAME,
    },
  })
  async createDepartment(
    @Body() createDepartmentDto: CreateDepartmentDto,
  ): Promise<Department> {
    return await this.departmentService.create(createDepartmentDto);
  }

  @Get(':id')
  @Permissions(READ_DEPARTMENT)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get department by ID',
    description: 'Retrieves a department by its unique identifier.',
  })
  @ApiQuery({
    name: 'id',
    type: String,
    format: 'uuid',
    required: true,
    description: 'Department unique identifier',
  })
  @ApiOkResponse({
    description: 'Department found and returned successfully',
    example: {
      id: EXAMPLE_DEPARTMENT_ID,
      name: EXAMPLE_DEPARTMENT_NAME,
    },
  })
  @ApiNotFoundResponse({
    description: 'Department not found',
    example: {
      statusCode: 404,
      message: 'Department with id department-id-1 not found',
      error: 'NotFoundException',
    },
  })
  async getDepartmentById(@Param('id') id: UUID): Promise<Department[]> {
    return await this.departmentService.findByIds([id]);
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
    description: 'Search value for department (name, country, or ID)',
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
    enum: getDepartmentSelectableFields(),
    example: 'name',
  })
  @ApiQuery({
    name: 'sortOrder',
    type: String,
    required: false,
    description: 'Order departments by sort order',
    enum: ['ASC', 'DESC'],
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
          country: 'US',
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
  async searchForRoles(
    @Param('value') value: string,
    @Query('page', ParseIntPipe) page: number,
    @Query('limit', ParseIntPipe) limit: number,
    @Query('sortField') sortField: string,
    @Query('sortOrder') sortOrder: 'ASC' | 'DESC',
  ): Promise<DepartmentListResponseDto> {
    if (!sortField || sortField === '') {
      sortField = 'name';
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
    description: 'Department update data',
    type: UpdateDepartmentDto,
    required: true,
  })
  @ApiOkResponse({
    description: 'Department successfully updated',
    example: {
      id: EXAMPLE_DEPARTMENT_ID,
      name: 'Updated Department Name',
    },
  })
  @ApiNotFoundResponse({
    description: 'Department not found',
    example: {
      statusCode: 404,
      message: 'Department with id department-id-1 not found',
      error: 'NotFoundException',
    },
  })
  async updateDepartment(
    @Param('id') id: UUID,
    @Body() updateDepartmentDto: UpdateDepartmentDto,
  ): Promise<Department> {
    return await this.departmentService.update(id, updateDepartmentDto);
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
    description: 'Department unique identifiers',
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
    @Query('ids', new ParseArrayPipe({ items: String })) ids: UUID[],
  ): Promise<{ deleted: number }> {
    return await this.departmentService.deleteByIds(ids);
  }
}
