/**
 * emergency-alert.module.ts
 *
 * Global module providing EmergencyAlertService across TrustPassz backend.
 */

import { Global, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmergencyAlertService } from './emergency-alert.service';
import { EmergencyAlertAdminService } from './emergency-alert-admin.service';
import { EmergencyAlertAdminController } from './emergency-alert-admin.controller';

@Global()
@Module({
  imports: [ConfigModule],
  controllers: [EmergencyAlertAdminController],
  providers: [EmergencyAlertService, EmergencyAlertAdminService],
  exports: [EmergencyAlertService, EmergencyAlertAdminService],
})
export class EmergencyAlertModule {}

