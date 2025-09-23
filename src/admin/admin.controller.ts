import { Controller, Get, Post, Body, Param, UseGuards, Query, Put, Delete } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdjustBalanceDto } from './dto/adjust-balance.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import { CreateMissionDto } from './dto/create-mission.dto';
import { CreateShopItemDto } from './dto/create-shop-item.dto';
import { UpdateMissionDto } from './dto/update-mission.dto';
import { UpdateShopItemDto } from './dto/update-shop-item.dto';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('admin')
@ApiBearerAuth()
@Controller('admin')
@UseGuards(AdminAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @ApiOperation({ summary: 'Get users list' })
  @ApiResponse({ status: 200, description: 'Users list retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUsers(
    @Query('limit') limit: number = 50,
    @Query('after') after?: string,
  ) {
    return this.adminService.getUsers(limit, after);
  }

  @Get('users/:deviceId')
  @ApiOperation({ summary: 'Get user details' })
  @ApiResponse({ status: 200, description: 'User details retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getUser(@Param('deviceId') deviceId: string) {
    return this.adminService.getUser(deviceId);
  }

  @Post('users/:deviceId/adjust-balance')
  @ApiOperation({ summary: 'Adjust user balance' })
  @ApiResponse({ status: 200, description: 'Balance adjusted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async adjustBalance(
    @Param('deviceId') deviceId: string,
    @Body() adjustBalanceDto: AdjustBalanceDto,
  ) {
    return this.adminService.adjustBalance(deviceId, adjustBalanceDto);
  }


  @Post('users/:deviceId/ban')
  @ApiOperation({ summary: 'Ban user' })
  @ApiResponse({ status: 200, description: 'User banned successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async banUser(
    @Param('deviceId') deviceId: string,
    @Body() banUserDto: BanUserDto,
  ) {
    return this.adminService.banUser(deviceId, banUserDto);
  }

  // === MISSION MANAGEMENT ===
  @Post('missions')
  @ApiOperation({ summary: 'Create a new mission' })
  async createMission(@Body() createMissionDto: CreateMissionDto) {
    return this.adminService.createMission(createMissionDto);
  }

  @Get('missions')
  @ApiOperation({ summary: 'Get all missions' })
  async getMissions() {
    return this.adminService.getMissions();
  }

  @Get('missions/:id')
  @ApiOperation({ summary: 'Get mission by ID' })
  async getMission(@Param('id') id: string) {
    return this.adminService.getMission(id);
  }

  @Put('missions/:id')
  @ApiOperation({ summary: 'Update mission' })
  async updateMission(
    @Param('id') id: string,
    @Body() updateMissionDto: UpdateMissionDto,
  ) {
    return this.adminService.updateMission(id, updateMissionDto);
  }

  @Delete('missions/:id')
  @ApiOperation({ summary: 'Delete mission' })
  async deleteMission(@Param('id') id: string) {
    return this.adminService.deleteMission(id);
  }

  @Post('missions/:id/activate')
  @ApiOperation({ summary: 'Activate mission' })
  async activateMission(@Param('id') id: string) {
    return this.adminService.activateMission(id);
  }

  @Post('missions/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate mission' })
  async deactivateMission(@Param('id') id: string) {
    return this.adminService.deactivateMission(id);
  }

  // === SHOP ITEM MANAGEMENT ===
  @Post('shop/items')
  @ApiOperation({ summary: 'Create a new shop item' })
  async createShopItem(@Body() createShopItemDto: CreateShopItemDto) {
    return this.adminService.createShopItem(createShopItemDto);
  }

  @Get('shop/items')
  @ApiOperation({ summary: 'Get all shop items' })
  async getShopItems() {
    return this.adminService.getShopItems();
  }

  @Get('shop/items/:id')
  @ApiOperation({ summary: 'Get shop item by ID' })
  async getShopItem(@Param('id') id: string) {
    return this.adminService.getShopItem(id);
  }

  @Put('shop/items/:id')
  @ApiOperation({ summary: 'Update shop item' })
  async updateShopItem(
    @Param('id') id: string,
    @Body() updateShopItemDto: UpdateShopItemDto,
  ) {
    return this.adminService.updateShopItem(id, updateShopItemDto);
  }

  @Delete('shop/items/:id')
  @ApiOperation({ summary: 'Delete shop item' })
  async deleteShopItem(@Param('id') id: string) {
    return this.adminService.deleteShopItem(id);
  }

  @Post('shop/items/:id/activate')
  @ApiOperation({ summary: 'Activate shop item' })
  async activateShopItem(@Param('id') id: string) {
    return this.adminService.activateShopItem(id);
  }

  @Post('shop/items/:id/deactivate')
  @ApiOperation({ summary: 'Deactivate shop item' })
  async deactivateShopItem(@Param('id') id: string) {
    return this.adminService.deactivateShopItem(id);
  }

  // === GAME CONFIGURATION ===
  @Get('config')
  @ApiOperation({ summary: 'Get game configuration' })
  async getConfig() {
    return this.adminService.getConfig();
  }

  @Post('config')
  @ApiOperation({ summary: 'Update game configuration' })
  async updateConfig(@Body() config: any) {
    return this.adminService.updateConfig(config);
  }

  // === ANALYTICS ===
  @Get('analytics/overview')
  @ApiOperation({ summary: 'Get game analytics overview' })
  async getAnalytics() {
    return this.adminService.getAnalytics();
  }

  @Get('analytics/daily-stats')
  @ApiOperation({ summary: 'Get daily statistics' })
  async getDailyStats(@Query('date') date?: string) {
    return this.adminService.getDailyStats(date);
  }

@Post('register')
@ApiOperation({ summary: 'Register new admin' })
@ApiResponse({ status: 201, description: 'Admin registered successfully' })
@ApiResponse({ status: 409, description: 'Admin username already exists' })
async registerAdmin(@Body() createAdminDto: CreateAdminDto) {
  return this.adminService.registerAdmin(createAdminDto);
}
}