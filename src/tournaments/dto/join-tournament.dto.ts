import { IsOptional, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class JoinTournamentDto {
  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  opId?: string;
}
