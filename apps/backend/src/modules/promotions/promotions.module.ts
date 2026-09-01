import { Module } from '@nestjs/common';
import { PrismaModule } from '../../database/prisma.module';
import { RealtimeModule } from '../../common/realtime/realtime.module';
import { PromotionsController } from './promotions.controller';
import { PromotionsService } from './promotions.service';

@Module({
  imports: [PrismaModule, RealtimeModule],
  controllers: [PromotionsController],
  providers: [PromotionsService],
  exports: [PromotionsService],
})
export class PromotionsModule {}
