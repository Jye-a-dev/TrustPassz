import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class CreateOrderDto {
  @ApiProperty({ example: '22222222-2222-4222-a222-222222222222', description: 'Buyer User UUID' })
  @IsUUID()
  @IsNotEmpty()
  buyerId: string;

  @ApiProperty({ example: '44444444-4444-4444-a444-444444444444', description: 'Product UUID' })
  @IsUUID()
  @IsNotEmpty()
  productId: string;

  @ApiPropertyOptional({ example: 'd0000000-0000-4000-a000-000000000001', description: 'Existing Deal UUID if pre-negotiated' })
  @IsOptional()
  @IsUUID()
  dealId?: string;

  @ApiPropertyOptional({
    example: {
      is_physical: false,
      recipient_email: 'buyer@trustpassz.io',
      shipping_address: null,
      carrier_name: null,
      shipping_fee: 0,
    },
    description: 'Physical shipment or digital fulfillment details',
  })
  @IsOptional()
  @IsObject()
  shippingInfo?: Record<string, unknown>;
}

export class UpdateOrderStatusDto {
  @ApiProperty({ enum: OrderStatus, example: 'SHIPPING' })
  @IsEnum(OrderStatus)
  @IsNotEmpty()
  status: OrderStatus;

  @ApiPropertyOptional({
    example: { carrier_tracking_code: 'VNPOST123456789', carrier_name: 'VNPost' },
  })
  @IsOptional()
  @IsObject()
  shippingInfo?: Record<string, unknown>;

  @ApiPropertyOptional()
  @IsOptional()
  @IsObject()
  paymentMetadata?: Record<string, unknown>;
}

export class QueryOrderDto {
  @ApiPropertyOptional({ example: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 10, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ enum: OrderStatus })
  @IsOptional()
  @IsEnum(OrderStatus)
  status?: OrderStatus;

  @ApiPropertyOptional({ example: '22222222-2222-4222-a222-222222222222' })
  @IsOptional()
  @IsUUID()
  buyerId?: string;

  @ApiPropertyOptional({ example: '11111111-1111-4111-a111-111111111111' })
  @IsOptional()
  @IsUUID()
  sellerId?: string;
}
