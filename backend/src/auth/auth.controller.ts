import { Controller, Post, UseGuards, Request, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Admin/Staff Log In' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        email: { type: 'string', example: 'admin@easycafe.com' },
        password: { type: 'string', example: 'AdminPassword123!' },
      },
      required: ['email', 'password'],
    },
  })
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh Access Token using Refresh Token' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refresh_token: { type: 'string' },
      },
      required: ['refresh_token'],
    },
  })
  async refresh(@Body('refresh_token') refreshToken: string) {
    return this.authService.refresh(refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Log Out (Invalidates Refresh Token)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refresh_token: { type: 'string' },
      },
      required: ['refresh_token'],
    },
  })
  async logout(@Body('refresh_token') refreshToken: string) {
    return this.authService.logout(refreshToken);
  }
}
