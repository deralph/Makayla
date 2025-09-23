import { IsNotEmpty, IsString, IsOptional, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClaimMissionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  missionId: string;

  @ApiProperty({ required: false })
  @IsNumber()
  @IsOptional()
  dayIndex?: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  opId: string;
}
