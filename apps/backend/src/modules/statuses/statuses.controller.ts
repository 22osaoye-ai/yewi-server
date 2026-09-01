import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
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
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StatusesService } from './statuses.service';
import { CreateStatusDto } from './dto/create-status.dto';
import { CreateStatusCommentDto } from './dto/create-comment.dto';
import { ReactStatusDto } from './dto/react-status.dto';

@ApiTags('Estados & Stories (Yewi Pro)')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('statuses')
export class StatusesController {
  constructor(private readonly statusesService: StatusesService) {}

  @Get('feed')
  @ApiOperation({ summary: 'Obtener el feed de historias/estados activos de profesionales' })
  @ApiResponse({ status: 200, description: 'Feed de estados agrupados por profesional' })
  async getFeed(@CurrentUser('id') userId: string) {
    return this.statusesService.getFeed(userId);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publicar un nuevo estado (Solo profesionales con Yewi Pro)' })
  @ApiResponse({ status: 201, description: 'Estado publicado exitosamente' })
  @ApiResponse({ status: 403, description: 'Requiere suscripción Yewi Pro activa' })
  async createStatus(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateStatusDto,
  ) {
    return this.statusesService.createStatus(userId, dto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Ver detalle de un estado' })
  @ApiResponse({ status: 200, description: 'Detalle del estado con comentarios' })
  async getStatusById(
    @Param('id') statusId: string,
    @CurrentUser('id') userId?: string,
  ) {
    return this.statusesService.getStatusById(statusId, userId);
  }

  @Post(':id/comments')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Comentar un estado de un profesional' })
  @ApiResponse({ status: 201, description: 'Comentario añadido exitosamente' })
  async addComment(
    @CurrentUser('id') userId: string,
    @Param('id') statusId: string,
    @Body() dto: CreateStatusCommentDto,
  ) {
    return this.statusesService.addComment(userId, statusId, dto);
  }

  @Post(':id/react')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Reaccionar / dar like a un estado' })
  @ApiResponse({ status: 200, description: 'Reacción registrada o alternada' })
  async reactToStatus(
    @CurrentUser('id') userId: string,
    @Param('id') statusId: string,
    @Body() dto: ReactStatusDto,
  ) {
    return this.statusesService.reactToStatus(userId, statusId, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Eliminar estado propio' })
  @ApiResponse({ status: 200, description: 'Estado eliminado' })
  async deleteStatus(
    @CurrentUser('id') userId: string,
    @Param('id') statusId: string,
  ) {
    return this.statusesService.deleteStatus(userId, statusId);
  }
}
