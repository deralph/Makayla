import { IsNumber, IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserStateDto {
  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  coins?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  energy?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  profitPerHour?: number;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  level?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  rank?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  rankPoints?: number;
}
