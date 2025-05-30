import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Genre } from './entity/genre.entity';
import { Repository } from 'typeorm';
import { PrismaService } from 'src/common/prisma.sevice';

@Injectable()
export class GenreService {
  constructor(
    // @InjectRepository(Genre)
    // private readonly genreRepository: Repository<Genre>,
    private readonly prisma: PrismaService,
  ){}

  async findAll(title: string) {
    return await this.prisma.genre.findMany();
    // return await this.genreRepository.find();
  }

  async findOne(id: number) {
    return await this.prisma.genre.findUnique({
      where: {
        id
      }
    });
    // return await this.genreRepository.findOne({
    //   where: {
    //     id
    //   }
    // });
  }

  async create(createGenreDto: CreateGenreDto) {
    // const genre = await this.genreRepository.findOne({
    //   where: {
    //     name: createGenreDto.name 
    //   }
    // });

    const genre = await this.prisma.genre.findFirst({
      where: {
        name: createGenreDto.name
      }
    });
    if( genre ){
      throw new NotFoundException(`이미 존재하는 장르입니다.`);
    }

    return this.prisma.genre.create({
      data: createGenreDto
    });

    // return await this.genreRepository.save(createGenreDto);
  }

  async update(id: number, updateGenreDto: UpdateGenreDto) {
    // const genre = await this.genreRepository.findOne({
    //   where: {
    //     id
    //   }
    // });

    const genre = await this.prisma.genre.findUnique({
      where: {
        id
      }
    });
    if( !genre ){
      throw new NotFoundException("존재하지 않는 ID 값의 장르입니다.");
    }

    // await this.genreRepository.update({id},{
    //   ...updateGenreDto
    // });
    await this.prisma.genre.update({
      where: {id},
      data: {...updateGenreDto}
    });
    // const newGenre = await this.genreRepository.findOne({
    //   where: {
    //     id
    //   }
    // });
    const newGenre = await this.prisma.genre.findUnique({
      where: {id}
    });
    return newGenre;
  }

  async remove(id: number) {
    // const genre = await this.genreRepository.findOne({
    //   where: {
    //     id
    //   }
    // });
    const genre = await this.prisma.genre.findUnique({
      where: {id}
    });

    if( !genre ){
      throw new NotFoundException("존재하지 않는 ID 값의 장르입니다.");
    }

    // await this.genreRepository.delete(id);
    await this.prisma.genre.delete({
      where: {id}
    });

    return id;
  }
}
