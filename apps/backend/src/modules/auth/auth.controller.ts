import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { LoginDto, RefreshTokenDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Auth (Autenticación & Seguridad)')
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
  @ApiOperation({ summary: 'Iniciar sesión y obtener tokens JWT' })
  @ApiResponse({ status: 200, description: 'Inicio de sesión exitoso' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas' })
  async login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
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
