import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { RawResponse } from '../../common/decorators/raw-response.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreatePromotionDto } from './dto/create-promotion.dto';
import { PromotionsService } from './promotions.service';

@ApiTags('Promotions & Discounts (Promociones y Descuentos de Sellers)')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotionsService: PromotionsService) {}

  @Get()
  @RawResponse()
  @ApiOperation({
    summary: 'Listar promociones activas y vigentes (Público / Clientes)',
  })
  @ApiResponse({
    status: 200,
    description: 'Lista de promociones activas con datos del profesional',
  })
  async getActivePromotions(@Query('category') category?: string) {
    return this.promotionsService.getActivePromotions(category);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @ApiBearerAuth()
  @Post()
  @RawResponse()
  @ApiOperation({
    summary: 'Crear una promoción por tiempo limitado (Solo profesionales / Sellers)',
  })
  @ApiResponse({
    status: 201,
    description: 'Promoción creada exitosamente',
  })
  async createPromotion(
    @CurrentUser('id') userId: string,
    @Body() dto: CreatePromotionDto,
  ) {
    return this.promotionsService.createPromotion(userId, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @ApiBearerAuth()
  @Get('my-promotions')
  @RawResponse()
  @ApiOperation({
    summary: 'Ver todas mis promociones creadas (Profesional / Seller)',
  })
  async getMyPromotions(@CurrentUser('id') userId: string) {
    return this.promotionsService.getMyPromotions(userId);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @ApiBearerAuth()
  @Delete(':id')
  @RawResponse()
  @ApiOperation({
    summary: 'Eliminar una promoción propia (Profesional / Seller)',
  })
  async deletePromotion(
    @CurrentUser('id') userId: string,
    @Param('id') promotionId: string,
  ) {
    return this.promotionsService.deletePromotion(userId, promotionId);
  }
}
