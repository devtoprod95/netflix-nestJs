import { Body, ClassSerializerInterceptor, Controller, Get, Headers, Post, Request, UseGuards, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './strategy/local.strategy';
import { JwtAuthGuard } from './strategy/jwt.strategy';
import { Public } from './decorator/public.decorator';
import { ApiBasicAuth, ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Authorization } from './decorator/authorization.decorator';

@Controller('auth')
@ApiTags('Auth')
@ApiBearerAuth()
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @ApiBasicAuth()
  @Post('register')
  registerUser(@Authorization() token: string){
    return this.authService.register(token);
  }

  @Public()
  @ApiBasicAuth()
  @Post('login')
  loginUser(@Authorization() token: string){
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

  @Public()
  @Post('token/block')
  blockToken(
    @Body('token') token: string
  ){
    return this.authService.tokenBlock(token);
  }
}
