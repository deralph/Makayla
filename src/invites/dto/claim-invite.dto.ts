import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ClaimInviteDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  inviteCode: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  opId: string;
}
