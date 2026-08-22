import {
  Body,
  Controller,
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
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateQuoteProposalDto } from './dto/create-quote-proposal.dto';
import { CreateServiceRequestDto } from './dto/create-service-request.dto';
import { FilterLeadsDto } from './dto/filter-leads.dto';
import { LeadsService } from './leads.service';

@ApiTags(
  'Leads & Service Requests (Solicitudes ProntoPro, Matching & Presupuestos)',
)
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('leads')
export class LeadsController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post('requests')
  @ApiOperation({
    summary: 'Publicar una nueva solicitud de servicio / proyecto (Cliente)',
  })
  @ApiResponse({
    status: 201,
    description: 'Solicitud creada y lista para matching',
  })
  async createRequest(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateServiceRequestDto,
  ) {
    return this.leadsService.createRequest(userId, dto);
  }

  @Get('my-requests')
  @ApiOperation({
    summary:
      'Ver mis solicitudes publicadas con presupuestos recibidos (Cliente)',
  })
  async getMyRequests(@CurrentUser('id') userId: string) {
    return this.leadsService.getMyRequests(userId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Get('opportunities')
  @ApiOperation({
    summary:
      'Explorar solicitudes de trabajo para profesionales con cálculo de distancia',
  })
  @ApiResponse({
    status: 200,
    description:
      'Lista de oportunidades (datos sensibles ocultos hasta desbloquear)',
  })
  async findOpportunitiesForPro(
    @CurrentUser('id') userId: string,
    @Query() filter: FilterLeadsDto,
  ) {
    return this.leadsService.findOpportunitiesForPro(userId, filter);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Post('requests/:id/unlock')
  @ApiOperation({
    summary:
      'Desbloquear datos de contacto de una solicitud usando créditos (Máx. 5 profesionales)',
  })
  @ApiResponse({
    status: 200,
    description: 'Datos de contacto completos del cliente y saldo actualizado',
  })
  async unlockLead(
    @CurrentUser('id') userId: string,
    @Param('id') requestId: string,
  ) {
    return this.leadsService.unlockLead(userId, requestId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.PROFESSIONAL)
  @Post('requests/:id/proposals')
  @ApiOperation({
    summary:
      'Enviar presupuesto a una solicitud previamente desbloqueada (Profesional)',
  })
  @ApiResponse({ status: 201, description: 'Presupuesto enviado al cliente' })
  async sendQuoteProposal(
    @CurrentUser('id') userId: string,
    @Param('id') requestId: string,
    @Body() dto: CreateQuoteProposalDto,
  ) {
    return this.leadsService.sendQuoteProposal(userId, requestId, dto);
  }

  @Post('proposals/:id/accept')
  @ApiOperation({
    summary: 'Aceptar un presupuesto y formalizar pedido con Escrow (Cliente)',
  })
  @ApiResponse({
    status: 200,
    description: 'Presupuesto aceptado y pedido en progreso creado',
  })
  async acceptProposal(
    @CurrentUser('id') userId: string,
    @Param('id') proposalId: string,
  ) {
    return this.leadsService.acceptProposal(userId, proposalId);
  }
}
