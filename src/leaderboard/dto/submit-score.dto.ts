import { IsNotEmpty, IsString, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SubmitScoreDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  metric: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  value: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  opId: string;
} 