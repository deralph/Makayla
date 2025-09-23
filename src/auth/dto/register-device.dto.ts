import { IsNotEmpty, IsObject, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class DeviceInfoDto {
  @ApiProperty()
  @IsNotEmpty()
  model: string;

  @ApiProperty()
  @IsNotEmpty()
  osVersion: string;

  @ApiProperty()
  @IsNotEmpty()
  appVersion: string;
}

export class RegisterDeviceDto {
  @ApiProperty()
  @IsNotEmpty()
  deviceId: string;

  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo: DeviceInfoDto;
}
