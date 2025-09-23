import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateInviteDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  deviceId?: string;
}
