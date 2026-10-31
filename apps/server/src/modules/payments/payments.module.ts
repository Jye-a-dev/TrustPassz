import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { PaymentsController } from './payments.controller';
import { WebhookController } from './webhook.controller';
import { PaymentsService } from './payments.service';
import { VietQrService } from './services/vietqr.service';
import { SolanaDepositService } from './services/solana-deposit.service';

@Module({
  imports: [AuthModule],
  controllers: [PaymentsController, WebhookController],
  providers: [PaymentsService, VietQrService, SolanaDepositService],
  exports: [PaymentsService, VietQrService, SolanaDepositService],
})
export class PaymentsModule {}
