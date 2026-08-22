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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import {
  CreateGigOrderDto,
  OpenDisputeDto,
  RequestRevisionDto,
  SubmitDeliveryDto,
  SubmitRequirementsDto,
} from './dto/create-gig-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders (Gestión de Pedidos, Entregas, Revisiones & Escrow)')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post('gig')
  @ApiOperation({
    summary: 'Comprar un paquete de Gig y retener fondos en Escrow (Cliente)',
  })
  @ApiResponse({
    status: 201,
    description: 'Pedido creado exitosamente con fondos en Escrow',
  })
  async createGigOrder(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateGigOrderDto,
  ) {
    return this.ordersService.createGigOrder(userId, dto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar mis pedidos (como cliente o profesional)' })
  @ApiQuery({ name: 'role', enum: ['client', 'pro'], required: false })
  async getMyOrders(
    @CurrentUser('id') userId: string,
    @Query('role') role?: 'client' | 'pro',
  ) {
    return this.ordersService.getMyOrders(userId, role);
  }

  @Get(':id')
  @ApiOperation({
    summary:
      'Ver detalle completo del pedido, entregas, chat y estado de Escrow',
  })
  async getOrderById(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
  ) {
    return this.ordersService.getOrderById(userId, orderId);
  }

  @Post(':id/requirements')
  @ApiOperation({
    summary: 'Enviar requerimientos para iniciar el pedido (Cliente)',
  })
  async submitRequirements(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
    @Body() dto: SubmitRequirementsDto,
  ) {
    return this.ordersService.submitRequirements(userId, orderId, dto);
  }

  @Post(':id/deliveries')
  @ApiOperation({
    summary: 'Entregar trabajo final con archivos adjuntos (Profesional)',
  })
  async submitDelivery(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
    @Body() dto: SubmitDeliveryDto,
  ) {
    return this.ordersService.submitDelivery(userId, orderId, dto);
  }

  @Post(':id/revisions')
  @ApiOperation({
    summary: 'Solicitar cambios/revisión sobre una entrega (Cliente)',
  })
  async requestRevision(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
    @Body() dto: RequestRevisionDto,
  ) {
    return this.ordersService.requestRevision(userId, orderId, dto);
  }

  @Post(':id/approve')
  @ApiOperation({
    summary:
      'Aprobar entrega, completar pedido y liberar fondos de Escrow al profesional (Cliente)',
  })
  async approveDelivery(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
  ) {
    return this.ordersService.approveDelivery(userId, orderId);
  }

  @Post(':id/dispute')
  @ApiOperation({ summary: 'Abrir disputa en el centro de resolución' })
  async openDispute(
    @CurrentUser('id') userId: string,
    @Param('id') orderId: string,
    @Body() dto: OpenDisputeDto,
  ) {
    return this.ordersService.openDispute(userId, orderId, dto);
  }
}
