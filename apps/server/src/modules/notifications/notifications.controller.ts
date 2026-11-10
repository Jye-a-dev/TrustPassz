import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Sse,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DeleteDeviceTokenDto } from './dto/delete-device-token.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import {
  AdminNotificationItem,
  NotificationsService,
} from './notifications.service';

@ApiTags('Notifications')
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get('admin/recent')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy danh sách thông báo quản trị viên thực tế từ database',
  })
  @ApiResponse({ status: 200, description: 'Danh sách thông báo gần đây' })
  async getRecentNotifications(): Promise<{
    success: boolean;
    data: AdminNotificationItem[];
  }> {
    const data = await this.notificationsService.getRecentNotifications();
    return {
      success: true,
      data,
    };
  }

  @Sse('admin/stream')
  @ApiOperation({
    summary: 'Kênh SSE truyền sự kiện thông báo realtime cho Admin',
  })
  streamAdminNotifications(): Observable<{ data: AdminNotificationItem }> {
    return this.notificationsService.getAdminNotificationStream();
  }

  @Post('device-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Register or refresh authenticated user FCM device token',
  })
  @ApiResponse({
    status: 200,
    description: 'Device token registered successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Valid Bearer JWT required.',
  })
  async registerToken(
    @CurrentUser('id') userId: string,
    @Body() dto: RegisterDeviceTokenDto,
  ): Promise<{ success: boolean; registeredAt: string; platform: string }> {
    return this.notificationsService.registerDeviceToken(userId, dto);
  }

  @Delete('device-token')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Revoke authenticated user FCM device token on logout',
  })
  @ApiResponse({
    status: 200,
    description: 'Device token revoked successfully.',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized: Valid Bearer JWT required.',
  })
  async deleteToken(
    @CurrentUser('id') userId: string,
    @Body() dto: DeleteDeviceTokenDto,
  ): Promise<{ success: boolean; revokedCount: number }> {
    return this.notificationsService.deleteDeviceToken(userId, dto);
  }
}
