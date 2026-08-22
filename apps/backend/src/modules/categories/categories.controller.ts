import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CategoriesService } from './categories.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
} from './dto/create-category.dto';

@ApiTags('Categories (Categorías & Cuestionarios Dinámicos)')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Public()
  @Get('tree')
  @ApiOperation({
    summary: 'Obtener árbol completo de categorías y subcategorías',
  })
  @ApiResponse({ status: 200, description: 'Árbol jerárquico de categorías' })
  async getCategoryTree() {
    return this.categoriesService.getCategoryTree();
  }

  @Public()
  @Get(':identifier')
  @ApiOperation({
    summary: 'Obtener categoría por ID o Slug (incluye schema de cuestionario)',
  })
  @ApiResponse({
    status: 200,
    description: 'Detalle de categoría con subcategorías y formSchema',
  })
  async getBySlugOrId(@Param('identifier') identifier: string) {
    return this.categoriesService.getBySlugOrId(identifier);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({ summary: 'Crear nueva categoría (Solo Administrador)' })
  @ApiResponse({ status: 201, description: 'Categoría creada con éxito' })
  async create(@Body() dto: CreateCategoryDto) {
    return this.categoriesService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Patch(':id')
  @ApiOperation({
    summary: 'Actualizar categoría existente (Solo Administrador)',
  })
  async update(@Param('id') id: string, @Body() dto: UpdateCategoryDto) {
    return this.categoriesService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar categoría (Solo Administrador)' })
  async delete(@Param('id') id: string) {
    return this.categoriesService.delete(id);
  }
}
