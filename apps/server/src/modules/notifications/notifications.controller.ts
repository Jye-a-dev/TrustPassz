import { Controller, Post, Delete, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { RegisterDeviceTokenDto, UnregisterDeviceTokenDto } from './dto/device-token.dto';

@ApiTags('Notifications')
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post('device-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Register/Sync client FCM device token' })
  @ApiResponse({ status: 200, description: 'Token registered successfully.' })
  async registerToken(@Body() dto: RegisterDeviceTokenDto) {
    return this.notificationsService.registerDeviceToken(dto);
  }

  @Delete('device-token')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Revoke client FCM device token on logout' })
  @ApiResponse({ status: 200, description: 'Token revoked successfully.' })
  async unregisterToken(@Body() dto: UnregisterDeviceTokenDto) {
    return this.notificationsService.unregisterDeviceToken(dto);
  }
}

