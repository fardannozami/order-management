import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service.js';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login dan mendapatkan access token' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['email', 'password'],
      properties: {
        email: { type: 'string', format: 'email', example: 'admin@azatech.id' },
        password: { type: 'string', format: 'password', example: 'ChangeMe123!' },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Login berhasil, access token dikembalikan' })
  @ApiResponse({ status: 401, description: 'Email atau password salah' })
  @ApiResponse({ status: 422, description: 'Validasi gagal' })
  @HttpCode(HttpStatus.OK)
  login(@Body() body: { email?: unknown; password?: unknown }) {
    return this.authService.login(body);
  }
}
