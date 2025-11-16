import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitScoreDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  coinsGenerated: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  opId?: string;
}
