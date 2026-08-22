import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { AdminService } from './admin.service';
import { ResolveDisputeDto, ReviewKycDto } from './dto/review-kyc.dto';

@ApiTags('Admin (Panel de Control, Métricas GMV, KYC & Disputas)')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/stats')
  @ApiOperation({
    summary:
      'Obtener métricas globales de la plataforma (GMV, ingresos por comisiones, órdenes activas)',
  })
  @ApiResponse({
    status: 200,
    description: 'Estadísticas del panel de administración',
  })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('kyc/pending')
  @ApiOperation({
    summary:
      'Listar verificaciones KYC de profesionales pendientes de revisión',
  })
  async getPendingKyc() {
    return this.adminService.getPendingKyc();
  }

  @Post('kyc/:id/review')
  @ApiOperation({
    summary: 'Aprobar o rechazar verificación KYC de un profesional',
  })
  async reviewKyc(@Param('id') proId: string, @Body() dto: ReviewKycDto) {
    return this.adminService.reviewKyc(proId, dto);
  }

  @Get('disputes')
  @ApiOperation({ summary: 'Listar disputas de pedidos abiertas' })
  async getDisputes() {
    return this.adminService.getDisputes();
  }

  @Post('disputes/:id/resolve')
  @ApiOperation({
    summary: 'Arbitrar y resolver disputa con reparto de fondos de Escrow',
  })
  async resolveDispute(
    @CurrentUser('id') adminUserId: string,
    @Param('id') disputeId: string,
    @Body() dto: ResolveDisputeDto,
  ) {
    return this.adminService.resolveDispute(adminUserId, disputeId, dto);
  }
}
