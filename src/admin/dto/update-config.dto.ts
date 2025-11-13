import { IsOptional, IsObject } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateConfigDto {
  @ApiProperty({ required: false, type: Object })
  @IsObject()
  @IsOptional()
  gameSettings?: Record<string, any>;

  @ApiProperty({ required: false, type: Object })
  @IsObject()
  @IsOptional()
  economySettings?: Record<string, any>;
}
