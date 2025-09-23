import { IsNotEmpty, IsString, IsNumber, IsOptional, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateMissionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string; // 'daily', 'social', 'special', 'tutorial'

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  reward: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ type: Object, required: false })
  @IsObject()
  @IsOptional()
  conditions?: Record<string, any>;

  @ApiProperty({ type: Object, required: false })
  @IsObject()
  @IsOptional()
  meta?: Record<string, any>;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  order?: number;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  category?: string; // 'beginner', 'advanced', 'social'

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  requiredLevel?: number;
}