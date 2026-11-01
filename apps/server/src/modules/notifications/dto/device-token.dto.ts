import { IsNotEmpty, IsString, IsIn, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RegisterDeviceTokenDto {
  @ApiProperty({ description: 'FCM Registration Token' })
  @IsString()
  @IsNotEmpty()
  token!: string;

  @ApiProperty({ description: 'Target user UUID' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ enum: ['android', 'ios'], description: 'Client OS platform' })
  @IsIn(['android', 'ios'])
  platform!: 'android' | 'ios';

  @ApiPropertyOptional({ description: 'Device model descriptor' })
  @IsOptional()
  @IsString()
  deviceModel?: string;

  @ApiPropertyOptional({ description: 'Client app version' })
  @IsOptional()
  @IsString()
  appVersion?: string;
}

export class UnregisterDeviceTokenDto {
  @ApiProperty({ description: 'User UUID' })
  @IsString()
  @IsNotEmpty()
  userId!: string;

  @ApiProperty({ description: 'FCM Registration Token to revoke' })
  @IsString()
  @IsNotEmpty()
  token!: string;
}

