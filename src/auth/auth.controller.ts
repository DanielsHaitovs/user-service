import { AuthenticateDto, AuthenticateResponseDto } from '@/auth/auth.dto';
import { AuthService } from '@/auth/auth.service';
import { Public } from '@/commonDecorators/public.decorator';
import { TraceController } from '@/commonDecorators/trace.decorator';
import { Body, Controller, Post } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

@Controller({
  path: 'auth',
  version: ['1'],
})
@ApiTags('Auth')
@ApiBearerAuth('JWT-auth')
@TraceController()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @ApiBody({
    type: AuthenticateDto,
    required: true,
    description: 'The credentials of the user to authenticate',
  })
  @ApiOkResponse({
    description: 'The JWT token for authenticated user',
    type: AuthenticateResponseDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Invalid credentials',
  })
  async signIn(
    @Body() signInDto: AuthenticateDto,
  ): Promise<AuthenticateResponseDto> {
    return this.authService.signIn(signInDto);
  }
}
