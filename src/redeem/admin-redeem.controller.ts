import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RedeemService } from './redeem.service';
import { CreateCodeDto } from './dto/create-code.dto';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';

@ApiTags('admin-redeem')
@ApiBearerAuth()
@Controller('admin/redeem')
@UseGuards(AdminAuthGuard)
export class AdminRedeemController {
  constructor(private readonly redeemService: RedeemService) {}

  @Post()
  @ApiOperation({ summary: 'Create a redeemable code' })
  async createCode(@Body() createCodeDto: CreateCodeDto) {
    return this.redeemService.createCode(createCodeDto);
  }

  @Get()
  @ApiOperation({ summary: 'List redeem codes' })
  async listCodes() {
    return this.redeemService.listCodes();
  }
}
