import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PrismaService } from 'src/common/prisma.sevice';
import { InjectModel } from '@nestjs/mongoose';
import { Director } from './schema/director.schema';
import { Model } from 'mongoose';

@Injectable()
export class DirectorService {
  constructor(
    // @InjectRepository(Director)
    // private readonly directorRepository: Repository<Director>,
    // private readonly prisma: PrismaService
    @InjectModel(Director.name)
    private readonly directorModel: Model<Director>
  ){}

  async create(createDirectorDto: CreateDirectorDto) {
    return await this.directorModel.create(createDirectorDto);
    // return await this.prisma.director.create({
    //   data: {...createDirectorDto}
    // });
    // return await this.directorRepository.save(createDirectorDto);
  }

  async findAll() {
    return await this.directorModel.find().exec();
    // return await this.prisma.director.findMany();
    // return await this.directorRepository.find();
  }

  async findOne(id: number) {
    return await this.directorModel.findById(id).exec();
    // return await this.prisma.director.findUnique({
    //   where: {id}
    // });
    // return await this.directorRepository.findOne({
    //   where: {id}
    // });
  }

  async update(id: number, updateDirectorDto: UpdateDirectorDto) {
    // const obj = await this.directorRepository.findOne({
    //   where: {id}
    // });
    const obj = await this.directorModel.findById(id).exec();
    // const obj = await this.prisma.director.findUnique({
    //   where: {id}
    // });

    if(!obj) {
      throw new NotFoundException("존재하지 않는 ID입니다.");
    }

    // await this.directorRepository.update(
    //   {id},
    //   updateDirectorDto,
    // );
    await this.directorModel.findByIdAndUpdate(id, updateDirectorDto).exec();
    // await this.prisma.director.update({
    //   where: { id },
    //   data: { ...updateDirectorDto }
    // });

    // const newObj = await this.directorRepository.findOne({
    //   where: {id}
    // });
    const newObj = await this.directorModel.findById(id).exec();
    // const newObj = await this.prisma.director.findUnique({
    //   where: { id }
    // });

    return newObj;
  }

  async remove(id: number) {
    // const obj = await this.directorRepository.findOne({
    //   where: {id}
    // });
    const obj = await this.directorModel.findById(id).exec();
    // const obj = await this.prisma.director.findUnique({
    //   where: { id }
    // });
    if(!obj) {
      throw new NotFoundException("존재하지 않는 ID입니다.");
    }

    // await this.directorRepository.delete(id);
    await this.directorModel.findByIdAndDelete(id);
    // await this.prisma.director.delete({
    //   where: { id }
    // });

    return id;
  }
}
