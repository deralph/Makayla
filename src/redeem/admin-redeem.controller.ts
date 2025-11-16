import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { RedeemService } from './redeem.service';
import { CreateCodeDto } from './dto/create-code.dto';
import { AdminAuthGuard } from '../auth/guards/admin-auth.guard';
import { ConfirmCodeDto } from './dto/confirm-code.dto';
import { Request } from 'express';

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

  @Post('confirm')
  @ApiOperation({ summary: 'Confirm a redeem code on behalf of a user' })
  async confirmCode(@Body() confirmCodeDto: ConfirmCodeDto, @Req() req: Request) {
    const admin = req.user as { username: string };
    return this.redeemService.confirmCode(
      admin?.username || 'unknown_admin',
      confirmCodeDto,
    );
  }
}
