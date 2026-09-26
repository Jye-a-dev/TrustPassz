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
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { CreateStorefrontDto, UpdateStorefrontDto } from './dto/storefront.dto';
import { UserRole } from '@prisma/client';

@ApiTags('Users & Social Storefronts')
@ApiBearerAuth('JWT-auth')
@Controller('api/v1/users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({
    summary: 'List registered users with optional role filtering',
    description: 'Retrieves user list ordered by registration timestamp.',
  })
  @ApiQuery({
    name: 'role',
    required: false,
    enum: UserRole,
    description: 'Filter users by platform permission role',
  })
  @ApiResponse({ status: 200, description: 'List of registered users.' })
  async findAll(@Query('role') role?: UserRole) {
    return this.usersService.findAll(role);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get user profile by UUID',
    description: 'Retrieves user profile, storefront reference, and activity counts.',
  })
  @ApiParam({ name: 'id', description: 'User UUID v4' })
  @ApiResponse({ status: 200, description: 'User profile retrieved successfully.' })
  @ApiResponse({ status: 404, description: 'User not found.' })
  async findById(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.usersService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update user profile attributes',
    description: 'Updates display name, avatar, contact email/phone, or wallet address.',
  })
  @ApiParam({ name: 'id', description: 'User UUID v4' })
  @ApiResponse({ status: 200, description: 'User profile updated successfully.' })
  @ApiResponse({ status: 409, description: 'Conflict: Identifier already in use.' })
  async update(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto);
  }

  @Post('storefront')
  @ApiOperation({
    summary: 'Create custom storefront for seller',
    description: 'Initializes social-commerce storefront slug and layout configurations.',
  })
  @ApiResponse({ status: 201, description: 'Storefront created successfully.' })
  @ApiResponse({ status: 409, description: 'Storefront slug taken or seller already has store.' })
  async createStorefront(@Body() dto: CreateStorefrontDto) {
    return this.usersService.createStorefront(dto);
  }

  @Get('storefront/:slug')
  @ApiOperation({
    summary: 'Get public storefront by slug',
    description: 'Fetches storefront metadata, theme configuration, and active products.',
  })
  @ApiParam({ name: 'slug', description: 'Storefront alphanumeric slug' })
  @ApiResponse({ status: 200, description: 'Storefront details retrieved.' })
  @ApiResponse({ status: 404, description: 'Storefront not found.' })
  async getStorefrontBySlug(@Param('slug') slug: string) {
    return this.usersService.getStorefrontBySlug(slug);
  }

  @Patch('storefront/:id')
  @ApiOperation({
    summary: 'Update storefront configuration or bio',
    description: 'Updates shop name, bio, theme, and canvas layout settings.',
  })
  @ApiParam({ name: 'id', description: 'Storefront UUID' })
  @ApiResponse({ status: 200, description: 'Storefront updated.' })
  async updateStorefront(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body() dto: UpdateStorefrontDto,
  ) {
    return this.usersService.updateStorefront(id, dto);
  }
}
