import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateGigDto } from './dto/create-gig.dto';
import { FilterGigsDto, UpdateGigDto } from './dto/filter-gigs.dto';
import { GigsService } from './gigs.service';

@ApiTags('Gigs (Servicios Embalados Estilo Fiverr)')
@Controller('gigs')
export class GigsController {
  constructor(private readonly gigsService: GigsService) {}

  @Public()
  @Get()
  @ApiOperation({
    summary:
      'Explorar catálogo de Gigs con filtros de búsqueda, categoría, precio y entrega',
  })
  @ApiResponse({ status: 200, description: 'Lista paginada de gigs' })
  async findAll(@Query() filter: FilterGigsDto) {
    return this.gigsService.findAll(filter);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @ApiBearerAuth()
  @Get('my-gigs')
  @ApiOperation({ summary: 'Listar mis gigs publicados como profesional' })
  async getMyGigs(@CurrentUser('id') userId: string) {
    return this.gigsService.getMyGigs(userId);
  }

  @Public()
  @Get(':slugOrId')
  @ApiOperation({
    summary:
      'Ver detalle de un Gig (paquetes Básico/Estándar/Premium, extras, reseñas)',
  })
  @ApiResponse({ status: 200, description: 'Detalle del gig' })
  async findBySlug(@Param('slugOrId') slugOrId: string) {
    return this.gigsService.findBySlug(slugOrId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({
    summary: 'Crear nuevo Gig con paquetes multinivel y extras (Profesionales)',
  })
  @ApiResponse({ status: 201, description: 'Gig publicado con éxito' })
  async create(@CurrentUser('id') userId: string, @Body() dto: CreateGigDto) {
    return this.gigsService.create(userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar Gig existente y sus paquetes' })
  async update(
    @CurrentUser('id') userId: string,
    @Param('id') gigId: string,
    @Body() dto: UpdateGigDto,
  ) {
    return this.gigsService.update(userId, gigId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar (desactivar) Gig' })
  async delete(@CurrentUser('id') userId: string, @Param('id') gigId: string) {
    return this.gigsService.delete(userId, gigId);
  }
}
