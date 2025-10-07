import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';
import { LevelService } from './level.service';
import { CreateLevelDto } from './dto/create-level.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
// import { AdminAuthGuard } from '../auth/guards/admin-auth.guard'; // Uncomment if you have an admin guard

@ApiTags('levels')
@ApiBearerAuth()
@Controller('levels')
// @UseGuards(AdminAuthGuard) // Protect these endpoints as admin-only
export class LevelController {
  constructor(private readonly levelService: LevelService) {}

  @Post()
  create(@Body() createLevelDto: CreateLevelDto) {
    return this.levelService.create(createLevelDto);
  }

  @Get()
  findAll() {
    return this.levelService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.levelService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateLevelDto: CreateLevelDto) {
    return this.levelService.update(id, updateLevelDto);
  }
}
