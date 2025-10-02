import { IsNotEmpty, IsString,IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClaimMediaDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  videoId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  watchReceipt: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  reward: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  opId: string;
}
