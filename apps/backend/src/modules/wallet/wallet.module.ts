import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsModule } from '../payments/payments.module';
import { WalletController } from './wallet.controller';
import { WalletService } from './wallet.service';

@Module({
  imports: [PaymentsModule, ConfigModule],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService],
})
export class WalletModule {}
