import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

/**
 * DTO for creating a new emergency alert recipient.
 */
export class CreateEmergencyEmailDto {
  @ApiProperty({
    example: 'devops-lead@trustpassz.io',
    description: 'Email đích nhận cảnh báo sự cố khẩn cấp',
  })
  @IsEmail({}, { message: 'Định dạng email nhận cảnh báo không hợp lệ' })
  @IsNotEmpty({ message: 'Email không được để trống' })
  email: string;

  @ApiProperty({
    example: 'Lead DevOps / Cloud SecOps',
    description: 'Nhãn định danh người nhận hoặc vai trò trực ban',
  })
  @IsString()
  @IsNotEmpty({ message: 'Nhãn mô tả không được để trống' })
  @MaxLength(100, { message: 'Nhãn không được vượt quá 100 ký tự' })
  label: string;

  @ApiProperty({
    example: '888999',
    description: 'Mã PIN xác thực 2FA 6 chữ số của Super Admin',
  })
  @IsString()
  @Matches(/^\d{6}$/, {
    message: 'Mã PIN 2FA phải bao gồm chính xác 6 chữ số thập phân',
  })
  pin2FA: string;
}

/**
 * DTO for updating an existing emergency alert recipient.
 */
export class UpdateEmergencyEmailDto {
  @ApiPropertyOptional({
    example: 'DevOps Lead (Backup)',
    description: 'Cập nhật nhãn định danh người nhận',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: 'Nhãn không được vượt quá 100 ký tự' })
  label?: string;

  @ApiPropertyOptional({
    example: false,
    description: 'Bật hoặc tắt trạng thái nhận thông báo',
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiProperty({
    example: '888999',
    description: 'Mã PIN xác thực 2FA 6 chữ số của Super Admin',
  })
  @IsString()
  @Matches(/^\d{6}$/, {
    message: 'Mã PIN 2FA phải bao gồm chính xác 6 chữ số thập phân',
  })
  pin2FA: string;
}

/**
 * DTO for validating 2FA PIN when deleting an emergency alert email.
 */
export class DeleteEmergencyEmailDto {
  @ApiProperty({
    example: '888999',
    description: 'Mã PIN xác thực 2FA 6 chữ số của Super Admin',
  })
  @IsString()
  @Matches(/^\d{6}$/, {
    message: 'Mã PIN 2FA phải bao gồm chính xác 6 chữ số thập phân',
  })
  pin2FA: string;
}

/**
 * DTO for initiating immediate SMTP connection test.
 */
export class TestSendAlertDto {
  @ApiPropertyOptional({
    example: 'admin-test@trustpassz.io',
    description: 'Email nhận cụ thể để kiểm tra (mặc định gửi toàn bộ danh sách active)',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Email kiểm tra không đúng định dạng' })
  targetEmail?: string;

  @ApiPropertyOptional({
    example: 'Kiểm tra độ trễ định kỳ kết nối Google Workspace SMTP Pool',
    description: 'Ghi chú lý do thực hiện test gửi cảnh báo',
  })
  @IsOptional()
  @IsString()
  customMessage?: string;
}

/**
 * Query DTO for retrieving emergency dispatch logs with pagination and filters.
 */
export class QueryEmergencyLogsDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 10, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    enum: ['SENT', 'FAILED'],
    description: 'Lọc theo trạng thái dispatch',
  })
  @IsOptional()
  @IsIn(['SENT', 'FAILED'])
  status?: string;

  @ApiPropertyOptional({
    example: 'CRITICAL',
    description: 'Lọc theo Alert Type (CRITICAL, TEST, RELAYER_GAS, ONCHAIN_REVERT, DB_FAILOVER)',
  })
  @IsOptional()
  @IsString()
  alertType?: string;
}

