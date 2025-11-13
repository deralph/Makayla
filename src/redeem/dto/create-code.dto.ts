import {
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCodeDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty({ type: [Object] })
  @IsArray()
  rewards: Array<Record<string, any>>;

  @ApiProperty({ required: false, default: 1 })
  @IsNumber()
  @IsOptional()
  maxUses?: number;

  @ApiProperty({ required: false })
  @IsDateString()
  @IsOptional()
  expiresAt?: string;
}
