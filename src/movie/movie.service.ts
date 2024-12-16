import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';

@Injectable()
export class MovieService {

  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
  ){}

  async findAll(title: string) {

    if(!title){
      return await this.movieRepository.find({
        relations: ['detail', 'director']
      });  
    }

    return await this.movieRepository.find({
      where: {
        title: Like(`%${title}%`)
      },
      relations: ['detail', 'director']
    });
  }

  async findOne(id: number) {
    const movie = await this.movieRepository.findOne({
      where: {id},
      relations: ['detail', 'director']
    });

    if(!movie) {
      throw new NotFoundException("존재하지 않는 ID 값의 영화입니다.");
    }

    return movie;
  }

  async create(createMovieDto: CreateMovieDto){
    const director = await this.directorRepository.findOne({
      where: {
        id: createMovieDto.directorId
      }
    });

    if( !director ){
      throw new NotFoundException("존재하지 않는 감독 ID입니다.");
    }

    const movie = await this.movieRepository.save({
      title: createMovieDto.title,
      genre: createMovieDto.genre,
      detail: {
        description: createMovieDto.description
      },
      director: director
    });

    return movie;
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const movie = await this.movieRepository.findOne({
      where: {id},
      relations: ['detail']
    });

    if(!movie) {
      throw new NotFoundException("존재하지 않는 ID 값의 영화입니다.");
    }

    const {description, directorId, ...movieRest} = updateMovieDto;

    let newDirector;

    if( directorId ){
      const director = await this.directorRepository.findOne({
        where: {
          id: directorId
        }
      });
  
      if( !director ){
        throw new NotFoundException("존재하지 않는 감독 ID입니다.");
      }

      newDirector = director;
    }

    const moveUpdaetFields = {
      ...movieRest,
      ...(newDirector && { director: newDirector })
    };
    await this.movieRepository.update(
      {id},
      moveUpdaetFields,
    );

    if(description){
      await this.movieDetailRepository.update(
        {
          id: movie.detail.id
        },
        {
          description
        }
      );
    }

    const newMovie = await this.movieRepository.findOne({
      where: {id},
      relations: ['detail', 'director']
    });

    return newMovie;
  }

  async remove(id: number) {
    const movie = await this.movieRepository.findOne({
      where: {id},
      relations: ['detail']
    });
    if(!movie) {
      throw new NotFoundException("존재하지 않는 ID 값의 영화입니다.");
    }

    
    await this.movieRepository.delete(id);
    if(movie.detail) {
      await this.movieDetailRepository.delete(movie.detail.id);
    }

    return id;
  }
}
