import { Module } from '@nestjs/common';
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

@Module({
  imports: [
    DatabaseModule,
    SupabaseModule,
    AuthModule,
    UsersModule,
    ProductsModule,
    DealsModule,
    OrdersModule,
    BargainsModule,
    DisputesModule,
    PaymentsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
