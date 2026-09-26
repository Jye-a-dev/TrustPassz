import {
  Body,
  Controller,
  Delete,
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
import { ProductsService } from './products.service';
import {
  CreateProductDto,
  QueryProductDto,
  UpdateProductDto,
} from './dto/product.dto';

@ApiTags('Marketplace Products & Inventory')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Post()
  @ApiOperation({
    summary: 'Create marketplace product listing',
    description: 'Lists digital or physical product with escrow inspection and bargain settings.',
  })
  @ApiResponse({ status: 201, description: 'Product created successfully.' })
  @ApiResponse({ status: 404, description: 'Seller or Storefront not found.' })
  async create(@Body() dto: CreateProductDto) {
    return this.productsService.create(dto);
  }

  @Get()
  @ApiOperation({
    summary: 'List products with filters, search, and pagination',
    description: 'Filter by category, status, seller ID, and title/category search terms.',
  })
  @ApiResponse({ status: 200, description: 'Paginated product list.' })
  async findAll(@Query() query: QueryProductDto) {
    return this.productsService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get product details by UUID',
    description: 'Fetches detailed specification, storefront linkage, and seller credentials.',
  })
  @ApiParam({ name: 'id', description: 'Product UUID v4' })
  @ApiResponse({ status: 200, description: 'Product details.' })
  @ApiResponse({ status: 404, description: 'Product not found.' })
  async findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update product properties or pricing',
    description: 'Updates base price, floor price, rules, or specification attributes.',
  })
  @ApiParam({ name: 'id', description: 'Product UUID v4' })
  @ApiResponse({ status: 200, description: 'Product updated successfully.' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateProductDto,
  ) {
    return this.productsService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({
    summary: 'Archive product listing',
    description: 'Soft-deletes product by transitioning status to ARCHIVED.',
  })
  @ApiParam({ name: 'id', description: 'Product UUID v4' })
  @ApiResponse({ status: 200, description: 'Product archived.' })
  async remove(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.productsService.remove(id);
  }
}
