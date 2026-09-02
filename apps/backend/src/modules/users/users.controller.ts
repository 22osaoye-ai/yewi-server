import { Body, Controller, Delete, Get, Patch, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { UsersService } from './users.service';

@ApiTags('Users (Usuarios & Perfil de Cliente)')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'Obtener información del usuario autenticado' })
  @ApiResponse({
    status: 200,
    description: 'Datos del usuario, perfil, perfil pro y balance',
  })
  async getMe(@CurrentUser('id') userId: string) {
    return this.usersService.getMe(userId);
  }

  @Patch('me/profile')
  @ApiOperation({ summary: 'Actualizar perfil del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil actualizado con éxito' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    return this.usersService.updateProfile(userId, dto);
  }

  @Delete('me')
  @ApiOperation({
    summary: 'Eliminar cuenta y datos personales (cumplimiento Apple & Google Play)',
  })
  @ApiResponse({ status: 200, description: 'Cuenta eliminada con éxito' })
  async deleteAccount(@CurrentUser('id') userId: string) {
    return this.usersService.deleteAccount(userId);
  }
}
