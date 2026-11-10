import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Payload for revoking an FCM device token on user logout.
 */
export class DeleteDeviceTokenDto {
  @ApiProperty({
    description: 'FCM Registration Token to revoke from active notifications',
    example: 'fcm_token_example_android_or_ios',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(512)
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  token!: string;

  @ApiPropertyOptional({
    description:
      'Optional legacy userId field (ignored on server; user identity is enforced from verified JWT)',
  })
  @IsOptional()
  @IsString()
  userId?: string;
}
