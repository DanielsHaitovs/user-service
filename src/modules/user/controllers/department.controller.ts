import { ApiOkList } from '@/common/decorators/api.decorator';
import { TraceController } from '@/common/decorators/trace.decorator';
import { AuthenticationGuard } from '@/common/guards/auth.guard';
import { PermissionsGuard } from '@/common/guards/permission.guard';
import { ASSIGN_USER_DEPARTMENT } from '@/lib/const/user.const';
import {
  AssignDepartmentsDto,
  UserDepartmentResponseDto,
} from '@/user/dto/departments.dto';
import { UserDepartmentsService } from '@/user/services/departments/user-departments.service';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
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

  /**
   * Creates a new user account.
   *
   * Validates input data, checks for email uniqueness, and associates
   * the creator's information. Returns the created user entity.
   * @param createDto - Data for the new user
   * @param createdByUser - JWT payload of the user creating the account
   * @returns The created user entity
   * @throws ConflictException if the email already exists
   * @throws BadRequestException for validation errors
   * @throws EntityNotFoundError if the creator user does not exist
   * @throws EntityNotFoundError if the provided department or role IDs do not exist
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOkList({
    permissions: [ASSIGN_USER_DEPARTMENT],
    operation: {
      summary: 'Create a new user',
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
}
