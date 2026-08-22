import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateReviewDto, ReplyReviewDto } from './dto/create-review.dto';
import { ReviewsService } from './reviews.service';

@ApiTags('Reviews (Calificaciones, Reseñas Verificadas & Reputación)')
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post()
  @ApiOperation({
    summary:
      'Dejar una valoración multicriterio sobre un pedido completado (Comprador)',
  })
  @ApiResponse({
    status: 201,
    description: 'Reseña registrada y puntuación promedio actualizada',
  })
  async createReview(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewsService.createReview(userId, dto);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Post(':id/reply')
  @ApiOperation({
    summary: 'Responder públicamente a una reseña recibida (Vendedor)',
  })
  async replyToReview(
    @CurrentUser('id') userId: string,
    @Param('id') reviewId: string,
    @Body() dto: ReplyReviewDto,
  ) {
    return this.reviewsService.replyToReview(userId, reviewId, dto);
  }

  @Public()
  @Get('user/:userId')
  @ApiOperation({
    summary: 'Ver todas las reseñas recibidas por un usuario o profesional',
  })
  async getReviewsByUser(@Param('userId') targetUserId: string) {
    return this.reviewsService.getReviewsByTargetUser(targetUserId);
  }
}
