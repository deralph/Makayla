import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

class GiftDetailsDto {
  @ApiProperty()
  @IsNumber()
  amount: number;

  @ApiProperty({ default: 'coins' })
  @IsString()
  reason: string;
}

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

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  assignedToDeviceId?: string;

  @ApiProperty({ required: false, type: GiftDetailsDto })
  @ValidateNested()
  @Type(() => GiftDetailsDto)
  @IsOptional()
  gift?: GiftDetailsDto;

  @ApiProperty({ required: false, default: false })
  @IsBoolean()
  @IsOptional()
  requiresAdminConfirmation?: boolean;
}
