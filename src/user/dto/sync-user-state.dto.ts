import { IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class SyncOperationDto {
  @ApiProperty()
  type: string;

  @ApiProperty()
  @IsOptional()
  amount?: number;

  @ApiProperty()
  @IsOptional()
  item?: string;

  @ApiProperty()
  @IsOptional()
  cost?: number;

  @ApiProperty()
  clientTimestamp: Date;

  @ApiProperty()
  opId: string;
}

export class SyncUserStateDto {
  @ApiProperty({ type: [SyncOperationDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SyncOperationDto)
  ops: SyncOperationDto[];
}
