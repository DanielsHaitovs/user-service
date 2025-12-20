import { ApiOkList } from '@/commonDecorators/api.decorator';
import { TraceController } from '@/commonDecorators/trace.decorator';
import { AuthenticationGuard } from '@/commonGuards/auth.guard';
import { PermissionsGuard } from '@/commonGuards/permission.guard';
import {
  READ_DEPARTMENT,
  READ_USER_DEPARTMENT,
} from '@/departmentConst/department.const';
import { ASSIGN_USER_DEPARTMENT, READ_USER } from '@/userConst/user.const';
import { UserDepartmentsService } from '@/userDepartmentService/user-departments.service';
import {
  AssignDepartmentsDto,
  UnAssignDepartmentsDto,
  UserDepartmentListResponseDto,
  UserDepartmentResponseDto,
} from '@/userDto/departments.dto';
import { UnassignFromUserResponseDto } from '@/userDto/user.dto';
import { GetUserDepartmentByIdsRequestDto } from '@/userQueryDto/departments.dto';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Users Departments')
@Controller('user-departments')
@TraceController()
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthenticationGuard, PermissionsGuard)
export class UserDepartmentsController {
  constructor(private readonly userService: UserDepartmentsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOkList({
    permissions: [READ_DEPARTMENT, READ_USER, READ_USER_DEPARTMENT],
    operation: {
      summary: 'Get user departments',
      description:
        'Retrieves a list of departments assigned to users based on the provided filters.',
    },
    okOperation: {
      description: 'List of user departments retrieved successfully',
      type: UserDepartmentListResponseDto,
      isArray: false,
    },
  })
  async GetUserDepartments(
    @Query() filters: GetUserDepartmentByIdsRequestDto,
  ): Promise<UserDepartmentListResponseDto> {
    return await this.userService.getUserDepartments(filters);
  }

  @Post('assign')
  @HttpCode(HttpStatus.CREATED)
  @ApiOkList({
    permissions: [ASSIGN_USER_DEPARTMENT],
    operation: {
      summary: 'Assign departments to a user',
      description:
        'Assigns departments to a user with the provided information.',
    },
    body: {
      type: AssignDepartmentsDto,
      description: 'Data for assigning departments to a user',
    },
    createdResponse: {
      description: 'Department(s) successfully assigned to user',
      type: UserDepartmentResponseDto,
    },
    badRequestMessages: {
      examples: [
        'One or more provided department IDs do not exist.',
        'User ID does not exist.',
        'AssignedBy user ID does not exist.',
      ],
    },
    notFound: {
      description: 'Related entities not found',
      example: 'One or more provided department IDs do not exist.',
    },
  })
  async assignDepartment(
    @Body() assignDepartments: AssignDepartmentsDto,
  ): Promise<UserDepartmentResponseDto[]> {
    return await this.userService.assignDepartmentsToUser(assignDepartments);
  }

  @Post('unassign')
  @HttpCode(HttpStatus.CREATED)
  @ApiOkList({
    permissions: [ASSIGN_USER_DEPARTMENT],
    operation: {
      summary: 'Unassign departments from a user',
      description:
        'Unassigns departments from a user with the provided information.',
    },
    body: {
      type: UnAssignDepartmentsDto,
      description: 'Data for unassigning departments from a user',
    },
    createdResponse: {
      description: 'Department(s) successfully unassigned from user',
      type: UserDepartmentResponseDto,
    },
    badRequestMessages: {
      examples: [
        'One or more provided department IDs do not exist.',
        'User ID does not exist.',
        'AssignedBy user ID does not exist.',
      ],
    },
    notFound: {
      description: 'Related entities not found',
      example: 'One or more provided department IDs do not exist.',
    },
  })
  async unAssignDepartment(
    @Body() unAssignDepartments: UnAssignDepartmentsDto,
  ): Promise<UnassignFromUserResponseDto> {
    return await this.userService.unassignDepartmentsFromUser(
      unAssignDepartments,
    );
  }
}
