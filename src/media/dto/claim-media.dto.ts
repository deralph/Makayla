import { IsNotEmpty, IsString } from 'class-validator';
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
  @IsString()
  @IsNotEmpty()
  opId: string;
}
