import { Injectable, BadRequestException } from '@nestjs/common';
import { ClaimMediaDto } from './dto/claim-media.dto';
import { UserService } from '../user/user.service';
import { CoinsService } from '../coins/coins.service';

@Injectable()
export class MediaService {
  constructor(
    private readonly userService: UserService,
    private readonly coinsService: CoinsService,
  ) {}

  async claimMedia(deviceId: string, claimMediaDto: ClaimMediaDto) {
    const user = await this.userService.findByDeviceId(deviceId);
    if (!user) {
      throw new Error('User not found');
    }

    // Verify the media claim (in a real implementation, this would verify with ad networks)
    const isValid = await this.verifyMediaClaim(claimMediaDto);

    if (!isValid) {
      throw new BadRequestException('Invalid media claim');
    }


    await this.coinsService.updateCoins(deviceId, {
      delta: claimMediaDto.reward,
      reason: `media_${claimMediaDto.videoId}_reward`,
      opId: claimMediaDto.opId,
    });

    return {
      success: true,
      reward: claimMediaDto.reward,
      newBalance: user.coins + claimMediaDto.reward,
    };
  }

  private async verifyMediaClaim(
    claimMediaDto: ClaimMediaDto,
  ): Promise<boolean> {
    // In a real implementation, this would verify with ad networks or media providers
    // For now, i will just return true for demonstration
    return true;
  }
}
