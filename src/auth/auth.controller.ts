import { AuthenticateDto } from '@/auth/auth.dto';
import { AuthService } from '@/auth/auth.service';
import { Public } from '@/commonDecorators/public.decorator';
import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody } from '@nestjs/swagger';

@Controller('auth')
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
  async signIn(@Body() signInDto: AuthenticateDto): Promise<string> {
    return this.authService.signIn(signInDto);
  }
}
