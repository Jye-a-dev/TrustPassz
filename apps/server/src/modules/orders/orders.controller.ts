import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  QueryOrderDto,
  UpdateOrderStatusDto,
} from './dto/order.dto';

@ApiTags('Orders & Escrow Fulfillment')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @ApiOperation({
    summary: 'Create purchase order and initialize escrow deal',
    description: 'Atomically creates an order record linked to product and underlying escrow deal.',
  })
  @ApiResponse({ status: 201, description: 'Order created successfully.' })
  @ApiResponse({ status: 400, description: 'Product not active or seller self-purchase.' })
  @ApiResponse({ status: 404, description: 'Product or buyer not found.' })
  async create(@Body() dto: CreateOrderDto) {
    return this.ordersService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List user orders with pagination and filtering',
    description: 'Filter orders by status, buyer ID, or seller ID.',
  })
  @ApiResponse({ status: 200, description: 'Paginated list of orders.' })
  async findAll(@Query() query: QueryOrderDto) {
    return this.ordersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get order details by UUID',
    description: 'Includes associated product, deal state, and fulfillment information.',
  })
  @ApiParam({ name: 'id', description: 'Order UUID v4' })
  @ApiResponse({ status: 200, description: 'Order details.' })
  @ApiResponse({ status: 404, description: 'Order not found.' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({
    summary: 'Update order lifecycle status or shipping information',
    description: 'Transitions status (e.g. PROCESSING, SHIPPING, COMPLETED) and updates tracking.',
  })
  @ApiParam({ name: 'id', description: 'Order UUID v4' })
  @ApiResponse({ status: 200, description: 'Order status updated.' })
  async updateStatus(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateStatus(id, dto);
  }
}
