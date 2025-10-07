import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Level, LevelDocument } from './schema/level.schema';
import { CreateLevelDto } from './dto/create-level.dto';

@Injectable()
export class LevelService {
  constructor(
    @InjectModel(Level.name) private levelModel: Model<LevelDocument>,
  ) {}

  async create(createLevelDto: CreateLevelDto): Promise<LevelDocument> {
    const createdLevel = new this.levelModel(createLevelDto);
    return createdLevel.save();
  }

  async findAll(): Promise<LevelDocument[]> {
    return this.levelModel.find().exec();
  }

  async findOne(id: string): Promise<LevelDocument> {
    const level = await this.levelModel.findById(id).exec();
    if (!level) {
      throw new NotFoundException(`Level with ID ${id} not found`);
    }
    return level;
  }

  async update(
    id: string,
    updateLevelDto: CreateLevelDto,
  ): Promise<LevelDocument> {
    const updatedLevel = await this.levelModel
      .findByIdAndUpdate(id, updateLevelDto, { new: true }) // { new: true } returns the updated document
      .exec();
    if (!updatedLevel) {
      throw new NotFoundException(`Level with ID ${id} not found`);
    }
    return updatedLevel;
  }
}
