import { IsNotEmpty, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CompleteMissionDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  missionId: string;

  @ApiProperty({ required: false })
  @IsObject()
  @IsOptional()
  evidence?: Record<string, any>;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  opId: string;
}
