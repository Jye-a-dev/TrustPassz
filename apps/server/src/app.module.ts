import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';
import { SupabaseModule } from './integrations/supabase/supabase.module';
import { AuthModule } from './modules/auth/auth.module';
import { DealsModule } from './modules/deals/deals.module';

@Module({
  imports: [DatabaseModule, SupabaseModule, AuthModule, DealsModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
