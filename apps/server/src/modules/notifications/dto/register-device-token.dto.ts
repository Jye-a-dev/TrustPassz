import { Transform } from 'class-transformer';
import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Payload for registering or refreshing an FCM device token for the authenticated user.
 */
export class RegisterDeviceTokenDto {
  @ApiProperty({
    description: 'FCM Registration Token retrieved from firebase_messaging',
    example: 'fcm_token_example_android_or_ios',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  token!: string;

  @ApiProperty({
    enum: ['android', 'ios'],
    description: 'Client OS platform',
    example: 'android',
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsIn(['android', 'ios'])
  platform!: 'android' | 'ios';

  @ApiPropertyOptional({
    description: 'Device hardware / OS version descriptor',
    example: 'Pixel 8 Pro / Android 15',
  })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  deviceModel?: string;

  @ApiPropertyOptional({
    description: 'Client mobile application version',
    example: '1.0.0',
  })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  appVersion?: string;

  @ApiPropertyOptional({
    description:
      'Optional legacy userId field (ignored on server; user identity is enforced from verified JWT)',
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
