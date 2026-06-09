import { AuthenticateDto, AuthenticateResponseDto } from '@/auth/auth.dto';
import { AuthService } from '@/auth/auth.service';
import { Public } from '@/commonDecorators/public.decorator';
import { TraceController } from '@/commonDecorators/trace.decorator';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiResponse, ApiTags } from '@nestjs/swagger';

@Controller({
  path: 'auth',
  version: ['1'],
})
@ApiTags('Auth')
@ApiBearerAuth('JWT-auth')
@TraceController()
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('login')
  @Public()
  @ApiBody({
    type: AuthenticateDto,
    required: true,
    description: 'The credentials of the user to authenticate',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The JWT token for authenticated user',
    type: AuthenticateResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - Invalid credentials',
  })
  async signIn(
    @Body() signInDto: AuthenticateDto,
  ): Promise<AuthenticateResponseDto> {
    return this.authService.signIn(signInDto);
  }
}
