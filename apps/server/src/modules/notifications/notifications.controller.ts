import { Controller, Post, Delete, Get, Sse, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { NotificationsService, AdminNotificationItem } from './notifications.service';
import { RegisterDeviceTokenDto, UnregisterDeviceTokenDto } from './dto/device-token.dto';

@ApiTags('Notifications')
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('admin/recent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lấy danh sách thông báo quản trị viên thực tế từ database' })
  @ApiResponse({ status: 200, description: 'Danh sách thông báo gần đây' })
  async getRecentNotifications(): Promise<{ success: boolean; data: AdminNotificationItem[] }> {
    const data = await this.notificationsService.getRecentNotifications();
    return {
      success: true,
      data,
    };
  }

  @Sse('admin/stream')
  @ApiOperation({ summary: 'Kênh SSE truyền sự kiện thông báo realtime cho Admin' })
  streamAdminNotifications(): Observable<{ data: AdminNotificationItem }> {
    return this.notificationsService.getAdminNotificationStream();
  }

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
