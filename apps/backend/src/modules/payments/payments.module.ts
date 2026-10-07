import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { OrdersModule } from '../orders/orders.module';
import { WalletModule } from '../wallet/wallet.module';
import { LeadsModule } from '../leads/leads.module';

@Module({
  imports: [
    ConfigModule,
    forwardRef(() => OrdersModule),
    forwardRef(() => WalletModule),
    forwardRef(() => LeadsModule),
  ],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}

