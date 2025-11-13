import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendGiftDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  recipientDeviceId: string;

  @ApiProperty()
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  opId?: string;
}
