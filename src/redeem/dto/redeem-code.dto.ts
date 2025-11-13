import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RedeemCodeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;
}
