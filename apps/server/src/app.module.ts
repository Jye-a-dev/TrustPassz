import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ScheduleModule } from '@nestjs/schedule';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AppThrottlerGuard } from './common/guards/app-throttler.guard';
import { getThrottlerOptions } from './config/throttle.config';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { SupabaseModule } from './integrations/supabase/supabase.module';
import { KeepAliveModule } from './keep-alive/keep-alive.module';
import { AuthModule } from './modules/auth/auth.module';
import { BargainsModule } from './modules/bargains/bargains.module';
import { DealsModule } from './modules/deals/deals.module';
import { DisputesModule } from './modules/disputes/disputes.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ProductsModule } from './modules/products/products.module';
import { UsersModule } from './modules/users/users.module';
import { BalanceMonitorModule } from './modules/balance-monitor/balance-monitor.module';
import { RelayerFundingModule } from './modules/relayer-funding/relayer-funding.module';
import { OracleRelayerModule } from './oracle-relayer/oracle-relayer.module';
import { RelayerModule } from './relayer/relayer.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { AuditLogModule } from './modules/audit-log/audit-log.module';
import { FiatOnrampModule } from './modules/fiat-onramp/fiat-onramp.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) =>
        getThrottlerOptions(configService),
    }),
    DatabaseModule,
    SupabaseModule,
    HealthModule,
    KeepAliveModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    DealsModule,
    OrdersModule,
    BargainsModule,
    DisputesModule,
    PaymentsModule,
    BalanceMonitorModule,
    RelayerFundingModule,
    OracleRelayerModule,
    RelayerModule,
    NotificationsModule,
    AnalyticsModule,
    AuditLogModule,
    FiatOnrampModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: AppThrottlerGuard,
    },
  ],
})
export class AppModule {}
