import { ApiOkList } from '@/commonDecorators/api.decorator';
import { TraceController } from '@/commonDecorators/trace.decorator';
import { AuthenticationGuard } from '@/commonGuards/auth.guard';
import { PermissionsGuard } from '@/commonGuards/permission.guard';
import { ASSIGN_USER_ROLE } from '@/libConst/user.const';
import {
  AssignRolesDto,
  UnAssignRolesDto,
  UserRoleResponseDto,
} from '@/userDto/roles.dto';
import { UnassignFromUserResponseDto } from '@/userDto/user.dto';
import { UserRole } from '@/userEntities/userRoles.entity';
import { UserRoleService } from '@/userRoleService/user-role.service';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@ApiTags('Users Roles')
@Controller('user-roles')
@TraceController()
@ApiBearerAuth('JWT-auth')
@UseGuards(AuthenticationGuard, PermissionsGuard)
export class UserRolesController {
  constructor(private readonly userService: UserRoleService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOkList({
    permissions: [ASSIGN_USER_ROLE],
    operation: {
      summary: 'Create a new user',
      description: 'Assigns roles to a user with the provided information.',
    },
    body: {
      type: AssignRolesDto,
      description: 'Data for assigning roles to a user',
    },
    createdResponse: {
      description: 'Role(s) successfully assigned to user',
      type: UserRoleResponseDto,
    },
    badRequestMessages: {
      examples: [
        'One or more provided role IDs do not exist.',
        'User ID does not exist.',
        'AssignedBy user ID does not exist.',
      ],
    },
    notFound: {
      description: 'Related entities not found',
      example: 'One or more provided role IDs do not exist.',
    },
  })
  async assignRole(@Body() assignRoles: AssignRolesDto): Promise<UserRole[]> {
    return await this.userService.assignRolesToUser(assignRoles);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOkList({
    permissions: [ASSIGN_USER_ROLE],
    operation: {
      summary: 'Create a new user',
      description: 'Unassigns roles from a user with the provided information.',
    },
    body: {
      type: UnAssignRolesDto,
      description: 'Data for unassigning roles from a user',
    },
    createdResponse: {
      description: 'Role(s) successfully unassigned from user',
      type: UserRoleResponseDto,
    },
    badRequestMessages: {
      examples: [
        'One or more provided roles IDs do not exist.',
        'User ID does not exist.',
        'AssignedBy user ID does not exist.',
      ],
    },
    notFound: {
      description: 'Related entities not found',
      example: 'One or more provided roles IDs do not exist.',
    },
  })
  async unAssignRole(
    @Body() unAssignRoles: UnAssignRolesDto,
  ): Promise<UnassignFromUserResponseDto> {
    return await this.userService.unassignRolesFromUsers(unAssignRoles);
  }
}
