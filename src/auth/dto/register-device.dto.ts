import { IsNotEmpty, IsObject, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class DeviceInfoDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  model: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  osVersion: string;

  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  appVersion: string;
}

export class RegisterDeviceDto {
  @ApiProperty()
  @IsNotEmpty()
  @IsString()
  deviceId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  userFullname: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  deviceName: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  imei: string;

  @ApiProperty()
  @IsObject()
  @ValidateNested()
  @Type(() => DeviceInfoDto)
  deviceInfo: DeviceInfoDto;
}