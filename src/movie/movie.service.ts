import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Like, QueryRunner, Repository } from 'typeorm';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';

@Injectable()
export class MovieService {

  constructor(
    @InjectRepository(Movie)
    private readonly movieRepository: Repository<Movie>,
    @InjectRepository(MovieDetail)
    private readonly movieDetailRepository: Repository<MovieDetail>,
    @InjectRepository(Director)
    private readonly directorRepository: Repository<Director>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
  ){}

  async findAll(dto: GetMoviesDto) {
    // const {title, take, page} = dto;
    const {title} = dto;

    const qb = await this.movieRepository.createQueryBuilder('movie')
    .leftJoinAndSelect('movie.detail', 'detail')
    .leftJoinAndSelect('movie.director', 'director')
    .leftJoinAndSelect('movie.genres', 'genres');

    if(title){
      qb.where('movie.title LIKE :title', {title: `%${title}%`});
    }

    // if( take && page ){
    //   this.commonService.applyPagePaginationParamsToQb(qb, dto);
    // }
    const {nextCursor}  = await this.commonService.applyCursorPaginationParamsToQb(qb, dto);
    const [data, count] = await qb.getManyAndCount();

    return {
      data,
      nextCursor,
      count
    }
  }

  async findOne(id: number) {
    const movie = await this.movieRepository.createQueryBuilder('movie')
    .leftJoinAndSelect('movie.detail', 'detail')
    .leftJoinAndSelect('movie.director', 'director')
    .leftJoinAndSelect('movie.genres', 'genres')
    .where('movie.id = :id', {id})
    .getOne();

    if(!movie) {
      throw new NotFoundException("존재하지 않는 ID 값의 영화입니다.");
    }

    return movie;
  }

  async create(createMovieDto: CreateMovieDto, qr: QueryRunner){
    const director = await qr.manager.findOne(Director, {
      where: {
        id: createMovieDto.directorId
      }
    });
    if( !director ){
      throw new NotFoundException("존재하지 않는 감독 ID입니다.");
    }

    const genres = await qr.manager.find(Genre, {
      where: {
        id: In(createMovieDto.genreIds)
      }
    });
    if( genres.length !== createMovieDto.genreIds.length ){
      throw new NotFoundException(`존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map(genre => genre.id).join(',')}`);
    }

    const movieDetail = await qr.manager.createQueryBuilder()
    .insert()
    .into(MovieDetail)
    .values({
      description: createMovieDto.description
    })
    .execute();
    const movieDetailId: number = movieDetail.identifiers[0].id;

    const haveMovie = await qr.manager.findOne(Movie, {
      where: {
        title: createMovieDto.title
      }
    });
    if( haveMovie ){
      throw new ConflictException('이미 존재하는 영화가 있습니다.');
    }

    const movie = await qr.manager.createQueryBuilder()
    .insert()
    .into(Movie)
    .values({
      title: createMovieDto.title,
      detail: {
        id: movieDetailId
      },
      director: director,
    })
    .execute();
    const movieId: number = movie.identifiers[0].id;

    await qr.manager.createQueryBuilder()
    .relation(Movie, 'genres')
    .of(movieId)
    .add(genres.map(genre => genre.id));

    return qr.manager.findOne(Movie, {
      where: {
        id: movieId
      },
      relations: ['detail', 'director', 'genres']
    });
  }

  async update(id: number, updateMovieDto: UpdateMovieDto) {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();

    try {
      const movie = await qr.manager.findOne(Movie, {
        where: {id},
        relations: ['detail', 'genres']
      });
      if(!movie) {
        throw new NotFoundException("존재하지 않는 ID 값의 영화입니다.");
      }
  
      const {description, directorId, genreIds, ...movieRest} = updateMovieDto;
  
      let newDirector;
      if( directorId ){
        const director = await qr.manager.findOne(MovieDetail, {
          where: {
            id: directorId
          }
        });
    
        if( !director ){
          throw new NotFoundException("존재하지 않는 감독 ID입니다.");
        }
  
        newDirector = director;
      }
  
      let newGenres;
      if(genreIds){
        const genres = await qr.manager.find(Genre, {
          where: {
            id: In(updateMovieDto.genreIds)
          }
        });
        if( genres.length !== updateMovieDto.genreIds.length ){
          throw new NotFoundException(`존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map(genre => genre.id).join(',')}`);
        }
  
        newGenres = genres;
      }
  
      const movieUpdaetFields = {
        ...movieRest,
        ...(newDirector && { director: newDirector })
      };
      await qr.manager.createQueryBuilder()
      .update(Movie)
      .set(movieUpdaetFields)
      .where('id = :id', { id })
      .execute()
  
      if(description) {
        await qr.manager.createQueryBuilder()
        .update(MovieDetail)
        .set({
          description: description
        })
        .where('id = :id', {id: movie.detail.id})
        .execute();
      }

      if(newGenres) {
        await qr.manager.createQueryBuilder()
          .relation(Movie, 'genres')
          .of(id)
          .addAndRemove(newGenres.map(genre => genre.id), movie.genres.map(genre => genre.id));
      }
      await qr.commitTransaction();

      return this.movieRepository.findOne({
        where: {id},
        relations: ['detail', 'director', 'genres']
      });
    } catch (e) {
      await qr.rollbackTransaction();
      throw e;
    } finally {
      await qr.release();
    }

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
