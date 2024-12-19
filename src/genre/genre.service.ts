import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Genre } from './entity/genre.entity';
import { Repository } from 'typeorm';

@Injectable()
export class GenreService {
  constructor(
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
  ){}

  async findAll(title: string): Promise<Genre[]> {
    return await this.genreRepository.find();
  }

  async findOne(id: number): Promise<Genre> {
    return await this.genreRepository.findOne({
      where: {
        id
      }
    });
  }

  async create(createGenreDto: CreateGenreDto): Promise<Genre> {
    const genre = await this.genreRepository.findOne({
      where: {
        name: createGenreDto.name 
      }
    });
    if( genre ){
      throw new NotFoundException(`이미 존재하는 장르입니다.`);
    }

    const saveGenre = await this.genreRepository.save(createGenreDto);

    return saveGenre;
  }

  async update(id: number, updateGenreDto: UpdateGenreDto) {
    const genre = await this.genreRepository.findOne({
      where: {
        id
      }
    });

    if( !genre ){
      throw new Error("존재하지 않는 ID 값의 장르입니다.");
    }

    await this.genreRepository.update({id},{
      ...updateGenreDto
    });

    const newGenre = await this.genreRepository.findOne({
      where: {
        id
      }
    });

    return newGenre;
  }

  async remove(id: number) {
    const genre = await this.genreRepository.findOne({
      where: {
        id
      }
    });

    if( !genre ){
      throw new Error("존재하지 않는 ID 값의 장르입니다.");
    }

    await this.genreRepository.delete(id);

    return id;
  }
}
