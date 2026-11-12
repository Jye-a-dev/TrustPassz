import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { AuthGuard } from '../../common/guards/auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role, Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  RequestUser,
} from '../../common/decorators/current-user.decorator';
import { EmergencyAlertAdminService } from './emergency-alert-admin.service';
import {
  CreateEmergencyEmailDto,
  DeleteEmergencyEmailDto,
  QueryEmergencyLogsDto,
  TestSendAlertDto,
  UpdateEmergencyEmailDto,
} from './dto/emergency-mailing-list.dto';

@ApiTags('Admin Emergency Alerts')
@ApiBearerAuth()
@Controller('api/v1/admin/emergency-alert')
@UseGuards(AuthGuard, RolesGuard)
export class EmergencyAlertAdminController {
  constructor(
    private readonly adminAlertService: EmergencyAlertAdminService,
  ) {}

  /**
   * GET /api/v1/admin/emergency-alert/emails
   */
  @Get('emails')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, 'ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Lấy danh sách các email quản trị viên nhận cảnh báo khẩn cấp',
    description:
      'Trả về danh sách email cứu hộ đang hoạt động và cấu hình nhãn định danh.',
  })
  @ApiOkResponse({ description: 'Danh sách email cứu hộ' })
  @ApiUnauthorizedResponse({ description: 'Chưa xác thực JWT' })
  @ApiForbiddenResponse({ description: 'Không đủ thẩm quyền' })
  async getEmails() {
    const list = await this.adminAlertService.getMailingList();
    return {
      success: true,
      data: list,
    };
  }

  /**
   * POST /api/v1/admin/emergency-alert/emails
   */
  @Post('emails')
  @Roles(Role.SUPER_ADMIN, 'SUPER_ADMIN')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Thêm email mới vào danh sách nhận cảnh báo khẩn cấp (Yêu cầu 2FA PIN)',
    description:
      'Bắt buộc quyền SUPER_ADMIN và mã PIN 2FA (6 chữ số) để thêm người nhận.',
  })
  @ApiOkResponse({ description: 'Thêm email thành công' })
  @ApiConflictResponse({ description: 'Email đã tồn tại trong danh sách' })
  @ApiForbiddenResponse({ description: 'Sai mã PIN 2FA hoặc không phải Super Admin' })
  async addEmail(
    @Body() dto: CreateEmergencyEmailDto,
    @CurrentUser() adminUser: RequestUser,
  ) {
    const created = await this.adminAlertService.addEmail(dto, adminUser);
    return {
      success: true,
      data: created,
      message: `Đã thêm ${created.email} vào danh sách nhận cảnh báo`,
    };
  }

  /**
   * PATCH /api/v1/admin/emergency-alert/emails/:id
   */
  @Patch('emails/:id')
  @Roles(Role.SUPER_ADMIN, 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Cập nhật nhãn hoặc trạng thái kích hoạt của email cứu hộ',
    description: 'Yêu cầu quyền SUPER_ADMIN và mã PIN 2FA 6 chữ số.',
  })
  @ApiOkResponse({ description: 'Cập nhật thành công' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy ID' })
  async updateEmail(
    @Param('id') id: string,
    @Body() dto: UpdateEmergencyEmailDto,
    @CurrentUser() adminUser: RequestUser,
  ) {
    const updated = await this.adminAlertService.updateEmail(
      id,
      dto,
      adminUser,
    );
    return {
      success: true,
      data: updated,
      message: 'Cập nhật thông tin email thành công',
    };
  }

  /**
   * DELETE /api/v1/admin/emergency-alert/emails/:id
   */
  @Delete('emails/:id')
  @Roles(Role.SUPER_ADMIN, 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Xóa email khỏi danh sách nhận cảnh báo (Yêu cầu 2FA PIN)',
    description: 'Yêu cầu quyền SUPER_ADMIN và mã PIN 2FA 6 chữ số.',
  })
  @ApiOkResponse({ description: 'Xóa thành công' })
  @ApiNotFoundResponse({ description: 'Không tìm thấy ID email' })
  async deleteEmail(
    @Param('id') id: string,
    @Body() bodyDto?: DeleteEmergencyEmailDto,
    @Query('pin') queryPin?: string,
    @Headers('x-2fa-pin') headerPin?: string,
  ) {
    const pin = bodyDto?.pin2FA || queryPin || headerPin || '';
    const result = await this.adminAlertService.deleteEmail(id, pin);
    return result;
  }

  /**
   * POST /api/v1/admin/emergency-alert/test-send
   */
  @Post('test-send')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, 'ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Kiểm tra đường truyền SMTP và gửi mail mẫu tức thì (SLA < 2s)',
    description:
      'Gửi email thử nghiệm chuẩn Cyber-Alert đến danh sách cứu hộ, benchmark latency và lưu log.',
  })
  @ApiOkResponse({ description: 'Kết quả test dispatch SMTP' })
  async testSend(
    @Body() dto: TestSendAlertDto,
    @CurrentUser() adminUser?: RequestUser,
  ) {
    const result = await this.adminAlertService.testSendEmergencyAlert(
      dto,
      adminUser,
    );
    return result;
  }

  /**
   * GET /api/v1/admin/emergency-alert/logs
   */
  @Get('logs')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN, 'ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Truy vấn lịch sử nhật ký dispatch email cảnh báo khẩn cấp',
    description:
      'Hỗ trợ phân trang và lọc theo trạng thái SENT/FAILED và alertType.',
  })
  @ApiOkResponse({ description: 'Danh sách audit logs phân trang' })
  async getLogs(@Query() query: QueryEmergencyLogsDto) {
    return this.adminAlertService.getDispatchLogs(query);
  }
}

