import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { SendPhoneOtpDto, VerifyPhoneOtpDto } from './dto/phone-auth.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { GoogleAuthGuard } from './guards/google-auth/google-auth.guard';

@ApiTags('Auth (Autenticación & Seguridad con Passport)')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Registrar nuevo usuario (Cliente o Profesional)' })
  @ApiResponse({
    status: 201,
    description: 'Usuario registrado exitosamente con tokens de acceso',
  })
  @ApiResponse({ status: 409, description: 'El correo electrónico ya existe' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión y obtener tokens JWT de Passport' })
  @ApiResponse({ status: 200, description: 'Inicio de sesión exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google')
  @ApiOperation({
    summary: 'Iniciar flujo OAuth2 con Google (Redirige a accounts.google.com)',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirección automática hacia Google Accounts',
  })
  async googleAuth() {
    // Passport inicia la redirección a Google automáticamente
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/login')
  @ApiOperation({
    summary:
      'Alias de inicio OAuth2 con Google (Redirige a accounts.google.com)',
  })
  async loginWithGoogle() {
    // Passport inicia la redirección a Google automáticamente
  }

  @Public()
  @UseGuards(GoogleAuthGuard)
  @Get('google/callback')
  @ApiOperation({
    summary:
      'Callback de Google OAuth2 (Procesa el perfil y entrega tokens JWT)',
  })
  @ApiResponse({
    status: 200,
    description: 'Sesión oficial NestJS generada con Google',
  })
  async googleAuthCallback(@Req() req: Request & { user: any }) {
    return this.authService.loginWithGoogleOAuthUser(req.user);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('google')
  @ApiOperation({
    summary: 'Autenticación directa con Google (App Móvil / ID Token / DTO)',
  })
  @ApiResponse({
    status: 200,
    description: 'Inicio de sesión con Google exitoso y generación de JWT',
  })
  async loginWithGoogleDto(@Body() dto: GoogleAuthDto) {
    return this.authService.loginWithGoogle(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('phone/send-otp')
  @ApiOperation({ summary: 'Enviar código de verificación SMS' })
  @ApiResponse({ status: 200, description: 'Código SMS enviado' })
  async sendPhoneOtp(@Body() dto: SendPhoneOtpDto) {
    return this.authService.sendPhoneOtp(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('phone/verify-otp')
  @ApiOperation({ summary: 'Verificar código SMS OTP y generar tokens JWT' })
  @ApiResponse({
    status: 200,
    description: 'Teléfono verificado e inicio de sesión exitoso',
  })
  async verifyPhoneOtp(@Body() dto: VerifyPhoneOtpDto) {
    return this.authService.verifyPhoneOtp(dto);
  }

  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('refresh')
  @ApiOperation({ summary: 'Refrescar token de acceso con rotación' })
  @ApiResponse({ status: 200, description: 'Nuevo par de tokens generado' })
  @ApiResponse({ status: 401, description: 'Refresh token inválido' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @Post('logout')
  @ApiOperation({ summary: 'Cerrar sesión e invalidar refresh token' })
  @ApiResponse({ status: 200, description: 'Sesión cerrada con éxito' })
  async logout(@CurrentUser('id') userId: string) {
    return this.authService.logout(userId);
  }
}
