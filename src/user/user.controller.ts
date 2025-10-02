import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  UseGuards, 
  UseInterceptors, 
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  BadRequestException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { DeviceAuthGuard } from '../auth/guards/device-auth.guard';
import { Device } from '../common/decorators/device.decorator';
import { SyncUserStateDto } from './dto/sync-user-state.dto';
import { UpdateUserStateDto } from './dto/update-user-state.dto';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiConsumes,ApiBody
} from '@nestjs/swagger';

@ApiTags('users')
@ApiBearerAuth()
@Controller('api/user')
@UseGuards(DeviceAuthGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get('state')
  @ApiOperation({ summary: 'Get full user state' })
  @ApiResponse({ status: 200, description: 'User state retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getFullState(@Device() device: any) {
    return this.userService.getFullState(device.deviceId);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Sync user state' })
  @ApiResponse({ status: 200, description: 'State synced successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async syncState(@Device() device: any, @Body() syncUserStateDto: SyncUserStateDto) {
    return this.userService.syncState(device.deviceId, syncUserStateDto);
  }

  @Get('minimal')
  @ApiOperation({ summary: 'Get minimal user state' })
  @ApiResponse({ status: 200, description: 'Minimal state retrieved successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getMinimalState(@Device() device: any) {
    return this.userService.getMinimalState(device.deviceId);
  }

  // New profile picture endpoints
  @Post('profile-picture')
  @ApiOperation({ summary: 'Upload profile picture' })
  @ApiConsumes('multipart/form-data')
  @ApiResponse({ status: 201, description: 'Profile picture uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid file type or size' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBody({
  schema: {
    type: 'object',
    properties: {
      file: { // This name must match the parameter in @UploadedFile() and FileInterceptor
        type: 'string',
        format: 'binary',
        description: 'Profile picture image file',
      },
    },
    required: ['file']
  },
})
  @UseInterceptors(FileInterceptor('file'))
  async uploadProfilePicture(
    @Device() device: any,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 5 * 1024 * 1024 }), // 5MB
          new FileTypeValidator({ fileType: 'image/*' }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.userService.uploadProfilePicture(device.deviceId, file);
  }

  @Delete('profile-picture')
  @ApiOperation({ summary: 'Remove profile picture' })
  @ApiResponse({ status: 200, description: 'Profile picture removed successfully' })
  @ApiResponse({ status: 400, description: 'No profile picture to remove' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async removeProfilePicture(@Device() device: any) {
    return this.userService.removeProfilePicture(device.deviceId);
  }

  @Put('profile')
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async updateProfile(@Device() device: any, @Body() updateData: any) {
    return this.userService.updateProfile(device.deviceId, updateData);
  }
}