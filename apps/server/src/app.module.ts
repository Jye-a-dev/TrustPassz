import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { SupabaseModule } from './integrations/supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProductsModule } from './modules/products/products.module';
import { DealsModule } from './modules/deals/deals.module';
import { OrdersModule } from './modules/orders/orders.module';
import { BargainsModule } from './modules/bargains/bargains.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { OracleRelayerModule } from './oracle-relayer/oracle-relayer.module';
import { HealthModule } from './health/health.module';
import { throttlerAsyncOptions } from './config/throttle.config';

@Module({
  imports: [
    ThrottlerModule.forRoot(throttlerAsyncOptions),
    DatabaseModule,
    SupabaseModule,
    HealthModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    DealsModule,
    OrdersModule,
    BargainsModule,
    DisputesModule,
    PaymentsModule,
    OracleRelayerModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
