import {
  IsString,
  IsNotEmpty,
  IsDateString,
  IsOptional,
  IsNumber,
  IsObject,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTournamentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiProperty({ required: false, default: 0 })
  @IsNumber()
  @IsOptional()
  entryFee?: number;

  @ApiProperty({ required: false, type: Object })
  @IsObject()
  @IsOptional()
  rewards?: {
    coins?: number;
    boosterType?: string;
    boosterAmount?: number;
  };
}
