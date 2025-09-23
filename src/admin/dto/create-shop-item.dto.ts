import { IsNotEmpty, IsString, IsNumber, IsOptional, IsObject, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateShopItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  cost: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  type: string; // 'multitap', 'energy', 'card', 'booster', 'character'

  @ApiProperty({ type: Object, required: false })
  @IsObject()
  @IsOptional()
  meta?: Record<string, any>;

  @ApiProperty({ required: false, default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  maxPurchases?: number; // 0 = unlimited

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  requiredLevel?: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  category?: string; // 'upgrades', 'boosters', 'characters'
}