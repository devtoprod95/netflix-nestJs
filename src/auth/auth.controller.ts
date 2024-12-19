import { ClassSerializerInterceptor, Controller, Get, Headers, Post, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './strategy/local.strategy';
import { JwtAuthGuard } from './strategy/jwt.strategy';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  registerUser(@Headers('authorization') token: string){
    return this.authService.register(token);
  }

  @Post('login')
  loginUser(@Headers('authorization') token: string){
    return this.authService.login(token);
  }

  @Post('token/access')
  async retateAccessToken(@Request() req){
    const accessToken = await this.authService.issueToken(req.user, false);

    return {
      accessToken
    }
  }

  @UseGuards(LocalAuthGuard)
  @Post('login/passport-local')
  async loginUserPassportLocal(@Request() req){
    return {
      user: req.user.userInfo,
      refreshToken: req.user.refreshToken,
      accessToken: req.user.accessToken,
    }
  }

  @UseGuards(JwtAuthGuard)
  @Get('login/passport-jwt')
  async private(@Request() req){
    return req.user;
  }
}
