import { ApiOkList } from '@/commonDecorators/api.decorator';
import { Permissions } from '@/commonDecorators/permission.decorator';
import { Public } from '@/commonDecorators/public.decorator';
import { TraceController } from '@/commonDecorators/trace.decorator';
import { UPDATE_USER_ENDPOINT_PERMISSION } from '@/system/const/user.const';
import { AuthPipelineService } from '@/user/auth.pipeline';
import {
  ResetPasswordDto,
  ResetTwoFactorAuthenticationDto,
  UpdateTwoFactorAuthenticationStatusDto,
} from '@/userDto/auth.dto';
import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Version,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

/**
 * REST API controller for comprehensive user management operations.
 *
 * Implements standardized CRUD operations with advanced querying capabilities,
 * comprehensive error handling, and detailed OpenAPI documentation. Follows
 * RESTful conventions while providing both ID-based and email-based access patterns
 * for flexible client integration.
 */
@ApiTags('Users Authorizarion')
@Controller({
  path: 'user/authorization',
  version: ['1'],
})
@TraceController()
@ApiBearerAuth('JWT-auth')
export class UserAuthController {
  constructor(protected readonly pipelineService: AuthPipelineService) {}

  @Patch('reset-password')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Public()
  @Permissions({
    required: UPDATE_USER_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
    operation: {
      summary: 'Resets a user password',
      description:
        "Resets a user password using the provided reset token and new password. The reset token is typically sent to the user's email address and must be valid and not expired.",
    },
    body: {
      type: ResetPasswordDto,
      description: 'Data required to reset a user password',
    },
    badRequestMessages: {
      examples: [
        'email must be an email',
        'password must be longer than or equal to 8 characters',
        'resetToken must be a valid UUID',
      ],
    },
  })
  async resetPassword(@Body() data: ResetPasswordDto): Promise<void> {
    await this.pipelineService.resetPassword(data);
  }

  @Patch('reset-two-factor-authentication')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions({
    required: UPDATE_USER_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
    operation: {
      summary: 'Resets a user two-factor authentication',
      description:
        "Resets a user's two-factor authentication settings, including the secret key. This is typically used when a user loses access to their two-factor authentication device or needs to reconfigure their two-factor settings.",
    },
    body: {
      type: ResetTwoFactorAuthenticationDto,
      description:
        'Data required to reset a user two-factor authentication settings',
    },
    badRequestMessages: {
      examples: [
        'userId must be a valid UUID',
        'twoFactorSecret must be a string',
      ],
    },
  })
  async resetTwoFactorAuthentication(
    @Body() data: ResetTwoFactorAuthenticationDto,
  ): Promise<void> {
    await this.pipelineService.resetTwoFactorAuthentication(data);
  }

  @Patch('update-two-factor-authentication-status')
  @Version('1')
  @HttpCode(HttpStatus.NO_CONTENT)
  @Permissions({
    required: UPDATE_USER_ENDPOINT_PERMISSION,
  })
  @ApiOkList({
    operation: {
      summary: 'Updates a user two-factor authentication status',
      description:
        "Updates a user's two-factor authentication status, enabling or disabling two-factor authentication for the user. This is typically used when a user wants to turn on or off two-factor authentication for their account.",
    },
    body: {
      type: UpdateTwoFactorAuthenticationStatusDto,
      description:
        'Data required to update a user two-factor authentication status',
    },
    badRequestMessages: {
      examples: [
        'userId must be a valid UUID',
        'enabled must be a boolean value',
      ],
    },
  })
  async updateTwoFactorAuthenticationStatus(
    @Body() data: UpdateTwoFactorAuthenticationStatusDto,
  ): Promise<void> {
    await this.pipelineService.updateTwoFactorAuthenticationStatus(data);
  }
}
