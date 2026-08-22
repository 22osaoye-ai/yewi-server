import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CreatePortfolioItemDto,
  SubmitKycDto,
  UpdateProfessionalProfileDto,
} from './dto/update-professional-profile.dto';
import { ProfessionalsService } from './professionals.service';

@ApiTags('Professionals (Perfiles Pro, Portafolio, Ubicación & KYC)')
@Controller('professionals')
export class ProfessionalsController {
  constructor(private readonly professionalsService: ProfessionalsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('me')
  @ApiOperation({ summary: 'Obtener mi perfil profesional' })
  @ApiResponse({
    status: 200,
    description: 'Perfil profesional con categorías y portafolio',
  })
  async getMyProfile(@CurrentUser('id') userId: string) {
    return this.professionalsService.getMyProfile(userId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Put('me')
  @ApiOperation({
    summary:
      'Crear o actualizar mi perfil profesional (radio de servicio, ubicación, tarifas)',
  })
  @ApiResponse({
    status: 200,
    description: 'Perfil profesional guardado exitosamente',
  })
  async updateMyProfile(
    @CurrentUser('id') userId: string,
    @Body() dto: UpdateProfessionalProfileDto,
  ) {
    return this.professionalsService.updateMyProfile(userId, dto);
  }

  @Public()
  @Get('nearby')
  @ApiOperation({
    summary: 'Buscar profesionales cercanos por coordenadas geográficas',
  })
  @ApiQuery({ name: 'lat', required: true, type: Number, example: 40.4168 })
  @ApiQuery({ name: 'lon', required: true, type: Number, example: -3.7038 })
  @ApiQuery({ name: 'categoryId', required: false, type: String })
  @ApiQuery({ name: 'skill', required: false, type: String })
  async findNearby(
    @Query('lat') lat: string,
    @Query('lon') lon: string,
    @Query('categoryId') categoryId?: string,
    @Query('skill') skill?: string,
  ) {
    return this.professionalsService.findNearby(
      parseFloat(lat),
      parseFloat(lon),
      categoryId,
      skill,
    );
  }

  @Public()
  @Get(':id')
  @ApiOperation({ summary: 'Ver perfil público de un profesional' })
  @ApiResponse({
    status: 200,
    description: 'Perfil público, gigs activos, valoraciones y portafolio',
  })
  async getPublicProfile(@Param('id') id: string) {
    return this.professionalsService.getPublicProfile(id);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('me/portfolio')
  @ApiOperation({ summary: 'Añadir un proyecto al portafolio' })
  @ApiResponse({ status: 201, description: 'Proyecto añadido al portafolio' })
  async addPortfolioItem(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePortfolioItemDto,
  ) {
    return this.professionalsService.addPortfolioItem(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Delete('me/portfolio/:id')
  @ApiOperation({ summary: 'Eliminar un proyecto del portafolio' })
  async deletePortfolioItem(
    @CurrentUser('id') userId: string,
    @Param('id') itemId: string,
  ) {
    return this.professionalsService.deletePortfolioItem(userId, itemId);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post('me/kyc')
  @ApiOperation({
    summary: 'Subir documento para verificación KYC de identidad',
  })
  @ApiResponse({ status: 200, description: 'Documento enviado a revisión' })
  async submitKyc(
    @CurrentUser('id') userId: string,
    @Body() dto: SubmitKycDto,
  ) {
    return this.professionalsService.submitKyc(userId, dto);
  }
}
