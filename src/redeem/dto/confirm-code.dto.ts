import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmCodeDto {
  @ApiProperty({ description: 'Redeem code to confirm' })
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ description: 'Device ID of the user receiving the reward' })
  @IsString()
  @IsNotEmpty()
  deviceId: string;
}
