import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Sse,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { DeleteDeviceTokenDto } from './dto/delete-device-token.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { RegisterDeviceTokenDto } from './dto/register-device-token.dto';
import {
  AdminNotificationItem,
  NotificationsService,
} from './notifications.service';
import {
  MarkAllReadResponse,
  MarkReadResponse,
  UserNotificationsListResponse,
} from './notifications.types';

@ApiTags('Notifications')
@Controller('api/v1/notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Lấy danh sách thông báo của người dùng hiện tại (phân trang + unreadCount)',
  })
  @ApiResponse({
    status: 200,
    description: 'Danh sách thông báo và số lượng chưa đọc',
  })
  async getUserNotifications(
    @CurrentUser('id') userId: string,
    @Query() query: QueryNotificationsDto,
  ): Promise<UserNotificationsListResponse> {
    return this.notificationsService.getUserNotifications(
      userId,
      query.limit,
      query.offset,
    );
  }

  @Patch('mark-all-read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Đánh dấu toàn bộ thông báo của người dùng hiện tại là đã đọc',
  })
  @ApiResponse({
    status: 200,
    description: 'Đã cập nhật toàn bộ thông báo thành đã đọc',
  })
  async markAllAsRead(
    @CurrentUser('id') userId: string,
  ): Promise<MarkAllReadResponse> {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Patch(':id/read')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.OK)
  @ApiParam({ name: 'id', type: String, description: 'UUID của thông báo' })
  @ApiOperation({
    summary: 'Đánh dấu một thông báo cụ thể đã đọc',
  })
  @ApiResponse({
    status: 200,
    description: 'Đã đánh dấu thông báo đã đọc',
  })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy thông báo thuộc người dùng hiện tại',
  })
  async markAsRead(
    @CurrentUser('id') userId: string,
    @Param('id', new ParseUUIDPipe()) id: string,
  ): Promise<MarkReadResponse> {
    return this.notificationsService.markAsRead(userId, id);
  }

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
