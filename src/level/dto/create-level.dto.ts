// create-level.dto.ts
import {
  IsString,
  IsNumber,
  IsArray,
  IsOptional,
  IsNotEmpty,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateLevelDto {
  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  levelNumber: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  levelName: string;

  @ApiProperty()
  @IsNumber()
  @IsNotEmpty()
  price: number;

  @ApiProperty({ required: false })
  @IsArray()
  @IsOptional()
  perks?: string[];

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  requiredRank?: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  requiredRankPoints?: number;
}

// upgrade-level.dto.ts
export class UpgradeLevelDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  targetLevelId: string; // The ID of the level the user wants to upgrade to
}
