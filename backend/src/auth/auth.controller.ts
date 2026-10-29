import { Body, Controller, Get, HttpCode, HttpStatus, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';
import { Public } from './auth.decorator.js';
import type { AuthenticatedRequest } from './auth.guard.js';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Public()
  @ApiOperation({
    summary: 'Login dan mendapatkan access serta refresh token',
    security: [],
  })
  @ApiBody({
    schema: {
      type: 'object', required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'admin@azatech.id' },
        password: { type: 'string', format: 'password', example: 'ChangeMe123!' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Login berhasil; access token berlaku 1 jam dan refresh token dapat digunakan untuk memperbarui sesi' })
  @ApiResponse({ status: 401, description: 'Email atau password salah' })
  @ApiResponse({ status: 422, description: 'Validasi gagal' })
  @HttpCode(HttpStatus.OK)
  login(@Body() body: { email?: unknown; password?: unknown }) {
    return this.authService.login(body);
  }

  @Post('refresh')
  @Public()
  @ApiOperation({
    summary: 'Rotasi refresh token dan mendapatkan access token baru',
    security: [],
  })
  @ApiBody({ schema: { type: 'object', required: ['refresh_token'], properties: { refresh_token: { type: 'string' } } } })
  @ApiResponse({ status: 200, description: 'Token berhasil diperbarui; refresh token lama tidak dapat digunakan kembali' })
  @ApiResponse({ status: 401, description: 'Refresh token tidak valid, kedaluwarsa, atau telah digunakan' })
  @HttpCode(HttpStatus.OK)
  refresh(@Body() body: { refresh_token?: unknown }) {
    return this.authService.refresh(body);
  }

  @Post('logout')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout dan mencabut refresh token sesi ini' })
  @ApiResponse({ status: 204, description: 'Sesi berhasil dicabut' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(@Req() request: AuthenticatedRequest): Promise<void> {
    await this.authService.logout(request.auth.sessionId);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Melihat profil user yang sedang login' })
  @ApiResponse({ status: 200, description: 'Profil user yang login' })
  me(@Req() request: AuthenticatedRequest) {
    return this.authService.profile(request.auth.userId);
  }
}
