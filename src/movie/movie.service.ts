import { BadRequestException, ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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
import { join } from 'path';
import { rename } from 'fs/promises';
import { User } from 'src/user/entity/user.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { envVariableKeys } from 'src/common/const/env.const';

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
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(MovieUserLike)
    private readonly movieUserLikeRepository: Repository<MovieUserLike>,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
  ){}

  async findRecent() {
    const cacheData = await this.cacheManager.get('MOVIE_RECENT');

    if(cacheData){
      return cacheData;
    }

    const data = await this.movieRepository.find({
      order: {
        createdAt: 'DESC'
      },
      take: 10
    });

    await this.cacheManager.set('MOVIE_RECENT', data);

    return data;
  }

  /* istanbul ignore next */
  async getMovies() {
    return this.movieRepository.createQueryBuilder('movie')
    .leftJoinAndSelect('movie.detail', 'detail')
    .leftJoinAndSelect('movie.director', 'director')
    .leftJoinAndSelect('movie.genres', 'genres')
    .leftJoinAndSelect('movie.creator', 'creator');
  }

  /* istanbul ignore next */
  async getLikedMovies(movieIds: number[], userId: number) {
    return this.movieUserLikeRepository.createQueryBuilder('mul')
      .leftJoinAndSelect('mul.user', 'user')
      .leftJoinAndSelect('mul.movie', 'movie')
      .where('movie.id IN (:...movieIds)', {movieIds})
      .andWhere('user.id = :userId', {userId})
      .getMany();
  }

  async findAll(dto: GetMoviesDto, userId?: number) {
    // const {title, take, page} = dto;
    const {title} = dto;

    const qb = await this.getMovies();

    if(title){
      qb.where('movie.title LIKE :title', {title: `%${title}%`});
    }

    // if( take && page ){
    //   this.commonService.applyPagePaginationParamsToQb(qb, dto);
    // }

    const {nextCursor} = await this.commonService.applyCursorPaginationParamsToQb(qb, dto);
    let [data, count]  = await qb.getManyAndCount();

    const movieIds    = data.map(movie => movie.id);
    const likedMovies = movieIds.length < 1 || !userId ? [] : await this.getLikedMovies(movieIds, userId);

    const likedMovieMap = likedMovies.reduce((acc, next) => ({
      ...acc,
      [next.movie.id]: next.isLike
    }), {});

    if( userId ){
      data = data.map((e) => ({
        ...e,
        isLike: e.id in likedMovieMap ? likedMovieMap[e.id] : null
      }));
    }

    return {
      data,
      nextCursor,
      count
    }
  }

  /* istanbul ignore next */
  async findMovieDetail(id: number) {
    return this.movieRepository.createQueryBuilder('movie')
    .leftJoinAndSelect('movie.detail', 'detail')
    .leftJoinAndSelect('movie.director', 'director')
    .leftJoinAndSelect('movie.genres', 'genres')
    .leftJoinAndSelect('movie.creator', 'creator')
    .where('movie.id = :id', {id})
    .getOne();
  }

  async findOne(id: number) {
    const movie = await this.findMovieDetail(id);

    if(!movie) {
      throw new NotFoundException("존재하지 않는 ID 값의 영화입니다.");
    }

    return movie;
  }

  /* istanbul ignore next */
  async createMovie(qr: QueryRunner, createMovieDto: CreateMovieDto, director: Director, movieDetailId: number, userId: number, thumbnailPath: string){
    return qr.manager.createQueryBuilder()
    .insert()
    .into(Movie)
    .values({
      title: createMovieDto.title,
      detail: {
        id: movieDetailId
      },
      director: director,
      creator: {
        id: userId
      },
      thumbnail: join(thumbnailPath, createMovieDto.thumbnail)
    })
    .execute();
  }

  /* istanbul ignore next */
  async createMovieDetail(qr: QueryRunner, createMovieDto: CreateMovieDto){
    return qr.manager.createQueryBuilder()
    .insert()
    .into(MovieDetail)
    .values({
      description: createMovieDto.description
    })
    .execute();
  }

  /* istanbul ignore next */
  async createMovieGenreRelation(qr: QueryRunner, movieId: number, genres: Genre[]){
    return qr.manager.createQueryBuilder()
    .relation(Movie, 'genres')
    .of(movieId)
    .add(genres.map(genre => genre.id));
  }

  /* istanbul ignore next */
  async renameMovieThumbnail(tempFolder: string, thumbnailPath: string, createMovieDto: CreateMovieDto){
    if( this.configService.get<string>(envVariableKeys.ENV) === 'prod' ){
      return this.commonService.saveMovieToPermanentStoage(createMovieDto.thumbnail);
    } else {
      return rename(
        join(process.cwd(), tempFolder, createMovieDto.thumbnail),
        join(process.cwd(), thumbnailPath, createMovieDto.thumbnail),
      )
    }
  }

  async create(createMovieDto: CreateMovieDto, userId: number, qr: QueryRunner){
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

    const movieDetail = await this.createMovieDetail(qr, createMovieDto);
    const movieDetailId: number = movieDetail.identifiers[0].id;

    const haveMovie = await qr.manager.findOne(Movie, {
      where: {
        title: createMovieDto.title
      }
    });
    if( haveMovie ){
      throw new ConflictException('이미 존재하는 영화가 있습니다.');
    }

    const thumbnailPath = join('public', 'movie');
    const tempFolder    = join('public', 'temp');

    const movie = await this.createMovie(qr, createMovieDto, director, movieDetailId, userId, thumbnailPath);
    const movieId: number = movie.identifiers[0].id;

    await this.createMovieGenreRelation(qr, movieId, genres);
    await this.renameMovieThumbnail(tempFolder, thumbnailPath, createMovieDto);

    return qr.manager.findOne(Movie, {
      where: {
        id: movieId
      },
      relations: ['detail', 'director', 'genres']
    });
  }

  /* istanbul ignore next */
  async updateMovie(qr: QueryRunner, movieUpdateFields: UpdateMovieDto, id: number){
    return qr.manager.createQueryBuilder()
      .update(Movie)
      .set(movieUpdateFields)
      .where('id = :id', { id })
      .execute();
  }

  /* istanbul ignore next */
  async updateMovieDetail(qr: QueryRunner, description: string, movie: Movie){
    return qr.manager.createQueryBuilder()
      .update(MovieDetail)
      .set({
        description: description
      })
      .where('id = :id', {id: movie.detail.id})
      .execute();
  }

  /* istanbul ignore next */
  async updateMovieGenreRelation(qr: QueryRunner, newGenres: Genre[], movie: Movie, id: number){
    return qr.manager.createQueryBuilder()
      .relation(Movie, 'genres')
      .of(id)
      .addAndRemove(newGenres.map(genre => genre.id), movie.genres.map(genre => genre.id));
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
        const director = await qr.manager.findOne(Director, {
          where: {
            id: directorId
          }
        });
    
        if( !director ){
          throw new NotFoundException(`존재하지 않는 감독 ID입니다. ${directorId}`);
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
  
      const movieUpdateFields = {
        ...movieRest,
        ...(newDirector && { director: newDirector })
      };
      await this.updateMovie(qr, movieUpdateFields, id);
  
      if(description) {
        await this.updateMovieDetail(qr, description, movie);
      }

      if(newGenres) {
        await this.updateMovieGenreRelation(qr, newGenres, movie, id);
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

  /* istanbul ignore next */
  async insertMovieUserLike(qr: QueryRunner, movieId: number, userId: number, isLike: boolean){
    return qr.manager.createQueryBuilder()
      .insert()
      .into(MovieUserLike)
      .values({
        movieId, userId, isLike
      })
      .execute();
  }

  async toggleMovieLike(movieId: number, userId: number, isLike: boolean, qr: QueryRunner) {
    const movie = await this.movieRepository.findOne({
      where: {
        id: movieId
      }
    });
    if( !movie ){
      throw new BadRequestException('존재하지 않는 영화입니다.')
    }
    
    const user = await this.userRepository.findOne({
      where: {
        id: userId
      }
    });
    if( !user ){
      throw new UnauthorizedException('존재하지 않는 회원입니다.')
    }
    
    const likeRecord = await this.movieUserLikeRepository.findOne({
      where: {
        movieId,
        userId
      }
    });

    if( likeRecord ){
      if(isLike === likeRecord.isLike){
        await qr.manager.delete(MovieUserLike, {
          movieId,
          userId
        });
      } else {
        await qr.manager.update(MovieUserLike, {
          movieId,
          userId
        },{
          isLike
        });
      }
    } else {
      await this.insertMovieUserLike(qr, movieId, userId, isLike);
    }

    const result = await qr.manager.findOne(MovieUserLike, {
      where: {
        movieId,
        userId
      }
    });
    return {
      isLike: result && result.isLike
    };
  }
}
