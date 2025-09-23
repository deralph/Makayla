import { Controller, Post, Body, Get, UseGuards } from '@nestjs/common';
import { InvitesService } from './invites.service';
import { GenerateInviteDto } from './dto/generate-invite.dto';
import { ClaimInviteDto } from './dto/claim-invite.dto';
import { DeviceAuthGuard } from '../auth/guards/device-auth.guard';
import { Device } from '../common/decorators/device.decorator';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('invites')
@ApiBearerAuth()
@Controller('api/invite')
@UseGuards(DeviceAuthGuard)
export class InvitesController {
  constructor(private readonly invitesService: InvitesService) {}

  @Post('generate')
  @ApiOperation({ summary: 'Generate invite code' })
  @ApiResponse({
    status: 200,
    description: 'Invite code generated successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async generateInvite(
    @Device() device: any,
    @Body() generateInviteDto: GenerateInviteDto,
  ) {
    return this.invitesService.generateInvite(
      device.deviceId,
      generateInviteDto,
    );
  }

  @Post('claim')
  @ApiOperation({ summary: 'Claim invite reward' })
  @ApiResponse({
    status: 200,
    description: 'Invite reward claimed successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 400, description: 'Invalid invite code' })
  async claimInvite(
    @Device() device: any,
    @Body() claimInviteDto: ClaimInviteDto,
  ) {
    return this.invitesService.claimInvite(device.deviceId, claimInviteDto);
  }

  @Get('status')
  @ApiOperation({ summary: 'Get invite status' })
  @ApiResponse({
    status: 200,
    description: 'Invite status retrieved successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getInviteStatus(@Device() device: any) {
    return this.invitesService.getInviteStatus(device.deviceId);
  }
}
