import { BadRequestException, ConflictException, Inject, Injectable, InternalServerErrorException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Like, QueryRunner, Repository } from 'typeorm';
import { GetMoviesDto } from './dto/get-movies.dto';
import { CommonService } from 'src/common/common.service';
import { join } from 'path';
import { rename } from 'fs/promises';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { envVariableKeys } from 'src/common/const/env.const';
import { PrismaService } from 'src/common/prisma.sevice';
import { contains } from 'class-validator';
import { Prisma } from '@prisma/client';
import { InjectModel } from '@nestjs/mongoose';
import { Movie } from './schema/movie.schema';
import { Document, Model, Types } from 'mongoose';
import { MovieDetail } from './schema/movie-detail.schema';
import { Director } from 'src/director/schema/director.schema';
import { Genre } from 'src/genre/schema/genre.schema';
import { User } from 'src/user/schema/user.schema';
import { MovieUserLike } from './schema/movie-user-like.schema';
import { UserId } from 'src/user/decorator/user-id.decorator';

@Injectable()
export class MovieService {

  constructor(
    // @InjectRepository(Movie)
    // private readonly movieRepository: Repository<Movie>,
    // @InjectRepository(MovieDetail)
    // private readonly movieDetailRepository: Repository<MovieDetail>,
    // @InjectRepository(Director)
    // private readonly directorRepository: Repository<Director>,
    // @InjectRepository(Genre)
    // private readonly genreRepository: Repository<Genre>,
    // @InjectRepository(User)
    // private readonly userRepository: Repository<User>,
    // @InjectRepository(MovieUserLike)
    // private readonly movieUserLikeRepository: Repository<MovieUserLike>,
    private readonly dataSource: DataSource,
    private readonly commonService: CommonService,
    @Inject(CACHE_MANAGER)
    private readonly cacheManager: Cache,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    @InjectModel(Movie.name)
    private readonly movieModel: Model<Movie>,
    @InjectModel(MovieDetail.name)
    private readonly movieDetailModel: Model<MovieDetail>,
    @InjectModel(Director.name)
    private readonly directorModel: Model<Director>,
    @InjectModel(Genre.name)
    private readonly genreModel: Model<Genre>,
    @InjectModel(User.name)
    private readonly userModel: Model<User>,
    @InjectModel(MovieUserLike.name)
    private readonly movieUserLikeModel: Model<MovieUserLike>,
  ){}

  async findRecent() {
    const cacheData = await this.cacheManager.get('MOVIE_RECENT');

    if(cacheData){
      return cacheData;
    }

    // const data = await this.movieRepository.find({
    //   order: {
    //     createdAt: 'DESC'
    //   },
    //   take: 10
    // });
    const data = await this.movieModel.find()
      .populate({
        path: 'genres',
        model: 'Genre'
      })
      .sort({ createdAt: -1 })
      .limit(10)
      .exec();
    // const data = await this.prisma.movie.findMany({
    //   orderBy: {
    //     createdAt: 'desc'
    //   },
    //   take: 10
    // })

    await this.cacheManager.set('MOVIE_RECENT', data);

    return data;
  }

  /* istanbul ignore next */
  async getMovies() {
    // return this.movieRepository.createQueryBuilder('movie')
    // .leftJoinAndSelect('movie.detail', 'detail')
    // .leftJoinAndSelect('movie.director', 'director')
    // .leftJoinAndSelect('movie.genres', 'genres')
    // .leftJoinAndSelect('movie.creator', 'creator');
  }

  /* istanbul ignore next */
  async getLikedMovies(movieIds: number[], userId: number) {
    // return this.movieUserLikeRepository.createQueryBuilder('mul')
    //   .leftJoinAndSelect('mul.user', 'user')
    //   .leftJoinAndSelect('mul.movie', 'movie')
    //   .where('movie.id IN (:...movieIds)', {movieIds})
    //   .andWhere('user.id = :userId', {userId})
    //   .getMany();
  }

  async findAll(dto: GetMoviesDto, userId?: number) {
    const {title, cursor, take, order} = dto;

    const orderBy = order.reduce((acc, field) => {
      const [column, direction] = field.split('_');
      if( column === 'id' ){
        acc['_id'] = direction.toLowerCase();
      } else {
        acc[column] = direction.toLowerCase();
      }
      return acc;
    }, {});
    
    // const orderBy = order.map((field) => {
    //   const [column, direction] = field.split('_');
    //   return {[column]: direction.toLocaleLowerCase()};
    // });

    // const movies = await this.prisma.movie.findMany({
    //   where: title ? {title: { contains: title }} : {},
    //   take: take + 1,
    //   skip: cursor ? 1: 0,
    //   cursor: cursor ? { id: parseInt(cursor) } : undefined,
    //   orderBy,
    //   include: {
    //     detail: true,
    //     genres: true,
    //     director: true,
    //     creator: true
    //   }
    // });

    const query = this.movieModel.find(title ? 
      {
        title: {
          $regex: title,
        },
        $option: 'i', // 대소문자 구문X
      } : {})
      .sort(orderBy)
      .limit(take + 1);

    if( cursor ){
      query.lt('_id', new Types.ObjectId(cursor));
    }

    const movies = await query.populate('genres director').exec();

    const hasNextPage = movies.length > take;
    if(hasNextPage) movies.pop();

    const nextCursor = hasNextPage ? movies[movies.length - 1]._id.toString() : null;

    // const qb = await this.getMovies();
    // if(title){
    //   qb.where('movie.title LIKE :title', {title: `%${title}%`});
    // }
    // const {nextCursor} = await this.commonService.applyCursorPaginationParamsToQb(qb, dto);
    // let [data, count]  = await qb.getManyAndCount();

    // const movieIds    = data.map(movie => movie.id);
    // const likedMovies = movieIds.length < 1 || !userId ? [] : await this.getLikedMovies(movieIds, userId);

    if( userId ){
      const movieIds = movies.map((movie) => movie._id);

      const likedMovies = movieIds.length < 1 ? [] : await this.movieUserLikeModel.find({
        movie: { $in: movieIds.map((id) => new Types.ObjectId(id.toString())) },
        user: userId
      })
      .populate('movie')
      .exec();
      // const likedMovies = movieIds.length > 0 ? await this.prisma.movieUserLike.findMany({
      //   where: {
      //     movieId: {in: movieIds},
      //     userId: userId,
      //   },
      //   include: {
      //     movie: true
      //   }
      // }) : [];

      const likedMovieMap = likedMovies.reduce((acc, next) => ({
        ...acc,
        [next.movie._id.toString()]: next.isLike
      }), {});

      return {
        data: movies.map((movie) => ({
          ...movie.toObject(),
          likeStatus: movie._id.toString() in likedMovieMap ? likedMovieMap[movie._id.toString()] : null
        })) as (Document<unknown, {}, Movie, {}> & Movie & Required<{
            _id: unknown;
        }> & {
            __v: number;
        } & {
          likeStatus: boolean;
        })[],
        nextCursor,
        hasNextPage
      }

      // data = data.map((e) => ({
      //   ...e,
      //   isLike: e.id in likedMovieMap ? likedMovieMap[e.id] : null
      // }));
    }

    return {
      data: movies,
      nextCursor,
      hasNextPage
    }
  }

  /* istanbul ignore next */
  async findMovieDetail(id: number) {
    // return this.movieRepository.createQueryBuilder('movie')
    // .leftJoinAndSelect('movie.detail', 'detail')
    // .leftJoinAndSelect('movie.director', 'director')
    // .leftJoinAndSelect('movie.genres', 'genres')
    // .leftJoinAndSelect('movie.creator', 'creator')
    // .where('movie.id = :id', {id})
    // .getOne();
  }

  async findOne(id: string) {
    const movie = await this.movieModel.findById(id)
      .populate({
        path: 'genres',
        model: 'Genre'
      })
      .populate('director detail creator');
    // const movie = await this.prisma.movie.findUnique({
    //   where: { id }
    // });
    // const movie = await this.findMovieDetail(id);

    if(!movie) {
      throw new NotFoundException("존재하지 않는 ID 값의 영화입니다.");
    }

    return movie;
  }

  /* istanbul ignore next */
  // async createMovie(qr: QueryRunner, createMovieDto: CreateMovieDto, director: Director, movieDetailId: number, userId: number, thumbnailPath: string){
  //   return qr.manager.createQueryBuilder()
  //   .insert()
  //   .into(Movie)
  //   .values({
  //     title: createMovieDto.title,
  //     detail: {
  //       id: movieDetailId
  //     },
  //     director: director,
  //     creator: {
  //       id: userId
  //     },
  //     thumbnail: join(thumbnailPath, createMovieDto.thumbnail)
  //   })
  //   .execute();
  // }

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
    // return qr.manager.createQueryBuilder()
    // .relation(Movie, 'genres')
    // .of(movieId)
    // .add(genres.map(genre => genre.id));
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

  async createMongoose(createMovieDto: CreateMovieDto, userId: number){
    const session = await this.movieModel.startSession();
    session.startTransaction();

    try {
      const director = await this.directorModel.findById(createMovieDto.directorId).exec();
      if( !director ){
        throw new NotFoundException("존재하지 않는 감독 ID입니다.");
      }

      const genres = await this.genreModel
        .find({_id: {$in: createMovieDto.genreIds}})
        .exec();
      if( genres.length !== createMovieDto.genreIds.length ){
        throw new NotFoundException(`존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map(genre => genre.id).join(',')}`);
      }

      const movieDetail = await this.movieDetailModel.create(
        [
          {
            description: createMovieDto.description
          }
        ],
        {
          session
        }
      );

      const movie = await this.movieModel.create(
        [
          {
            title: createMovieDto.title,
            thumbnail: createMovieDto.thumbnail,
            creator: userId,
            director: director._id,
            genres: genres.map((genre) => genre._id),
            detail: movieDetail[0]._id,
          }
        ],
        {
          session
        }
      );
      await session.commitTransaction();

      return this.movieModel.findById(movie[0]._id)
        .populate('detail')
        .populate('director')
        .populate({
          path: 'genres',
          model: 'Genre'
        })
        .exec();
    } catch (error) {
      await session.abortTransaction();

      console.log(error);
      throw new InternalServerErrorException('트랜젝션 실패');
    } finally {
      session.endSession();
    }
  }

  // async createPrisma(createMovieDto: CreateMovieDto, userId: number){
  //   return this.prisma.$transaction(async(prisma) => {
  //     const director = await prisma.director.findUnique({
  //       where: {
  //         id: createMovieDto.directorId
  //       }
  //     });
  //     if( !director ){
  //       throw new NotFoundException("존재하지 않는 감독 ID입니다.");
  //     }

  //     const genres = await prisma.genre.findMany({
  //       where: {
  //         id: {
  //           in: createMovieDto.genreIds
  //         }
  //       }
  //     });
  //     if( genres.length !== createMovieDto.genreIds.length ){
  //       throw new NotFoundException(`존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map(genre => genre.id).join(',')}`);
  //     }

  //     const movieDetail = await prisma.movieDetail.create({
  //       data: {
  //         description: createMovieDto.description
  //       }
  //     });

  //     const movie = await prisma.movie.create({
  //       data: {
  //         title: createMovieDto.title,
  //         thumbnail: createMovieDto.thumbnail,
  //         creator: { connect: {id: userId} },
  //         director: { connect: {id: director.id} },
  //         genres: { connect: genres.map((genre) => ({ id: genre.id })) },
  //         detail: { connect: {id: movieDetail.id } },
  //       }
  //     });

  //     return prisma.movie.findUnique({
  //       where: {
  //         id: movie.id
  //       },
  //       include: {
  //         detail: true,
  //         director: true,
  //         genres: true,
  //       }
  //     });
  //   });
  // }

  // async create(createMovieDto: CreateMovieDto, userId: number, qr: QueryRunner){
  //   const director = await qr.manager.findOne(Director, {
  //     where: {
  //       id: createMovieDto.directorId
  //     }
  //   });
  //   if( !director ){
  //     throw new NotFoundException("존재하지 않는 감독 ID입니다.");
  //   }

  //   const genres = await qr.manager.find(Genre, {
  //     where: {
  //       id: In(createMovieDto.genreIds)
  //     }
  //   });
  //   if( genres.length !== createMovieDto.genreIds.length ){
  //     throw new NotFoundException(`존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map(genre => genre.id).join(',')}`);
  //   }

  //   const movieDetail = await this.createMovieDetail(qr, createMovieDto);
  //   const movieDetailId: number = movieDetail.identifiers[0].id;

  //   const haveMovie = await qr.manager.findOne(Movie, {
  //     where: {
  //       title: createMovieDto.title
  //     }
  //   });
  //   if( haveMovie ){
  //     throw new ConflictException('이미 존재하는 영화가 있습니다.');
  //   }

  //   const thumbnailPath = join('public', 'movie');
  //   const tempFolder    = join('public', 'temp');

  //   const movie = await this.createMovie(qr, createMovieDto, director, movieDetailId, userId, thumbnailPath);
  //   const movieId: number = movie.identifiers[0].id;

  //   await this.createMovieGenreRelation(qr, movieId, genres);
  //   await this.renameMovieThumbnail(tempFolder, thumbnailPath, createMovieDto);

  //   return qr.manager.findOne(Movie, {
  //     where: {
  //       id: movieId
  //     },
  //     relations: ['detail', 'director', 'genres']
  //   });
  // }

  /* istanbul ignore next */
  async updateMovie(qr: QueryRunner, movieUpdateFields: UpdateMovieDto, id: number){
    // return qr.manager.createQueryBuilder()
    //   .update(Movie)
    //   .set(movieUpdateFields)
    //   .where('id = :id', { id })
    //   .execute();
  }

  /* istanbul ignore next */
  async updateMovieDetail(qr: QueryRunner, description: string, movie: Movie){
    // return qr.manager.createQueryBuilder()
    //   .update(MovieDetail)
    //   .set({
    //     description: description
    //   })
    //   .where('id = :id', {id: movie.detail.id})
    //   .execute();
  }

  /* istanbul ignore next */
  async updateMovieGenreRelation(qr: QueryRunner, newGenres: Genre[], movie: Movie, id: number){
    // return qr.manager.createQueryBuilder()
    //   .relation(Movie, 'genres')
    //   .of(id)
    //   .addAndRemove(newGenres.map(genre => genre.id), movie.genres.map(genre => genre.id));
  }

  async updateMongoose(id: number, updateMovieDto: UpdateMovieDto) {
    const session = await this.movieModel.startSession();
    session.startTransaction();

    try {
      const movie = await this.movieModel.findById(id).populate('detail genres').exec();
      if(!movie) {
        throw new NotFoundException("존재하지 않는 ID 값의 영화입니다.");
      }

      const {description, directorId, genreIds, ...movieRest} = updateMovieDto;
      let movieUpdateParams: {
        title?: string;
        thumbnail?: string;
        director?: Types.ObjectId;
        genres?: Types.ObjectId[];
      } = {
        ...movieRest
      }

      if( directorId ){
        const director = await this.directorModel.findById(directorId).exec();
        if( !director ){
          throw new NotFoundException(`존재하지 않는 감독 ID입니다. ${directorId}`);
        }

        movieUpdateParams.director = director._id as Types.ObjectId;
      }

      if( genreIds ){
        const genres = await this.genreModel.find({_id: {$in: genreIds}}).exec();
        if( genres.length !== genreIds.length ){
          throw new NotFoundException(`존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map(genre => genre.id).join(',')}`);
        }

        movieUpdateParams.genres = genres.map(genre => genre._id) as Types.ObjectId[];
      }

      if( description ){
        await this.movieDetailModel.findByIdAndUpdate(movie.detail._id, { description }).exec();
      }

      await this.movieModel.findByIdAndUpdate(id, movieUpdateParams).exec();

      await session.commitTransaction();

      return await this.movieModel.findById(movie._id).populate('detail director genres').exec();
    } catch (error) {
      await session.abortTransaction();
    } finally {
      session.endSession();
    }
  }

  // async updatePrisma(id: number, updateMovieDto: UpdateMovieDto) {
  //   return this.prisma.$transaction(async(prisma) => {
  //     const movie = await prisma.movie.findUnique({
  //       where: {id},
  //       include: {
  //         detail: true,
  //         genres: true
  //       }
  //     });
  //     if(!movie) {
  //       throw new NotFoundException("존재하지 않는 ID 값의 영화입니다.");
  //     }

  //     const {description, directorId, genreIds, ...movieRest} = updateMovieDto;

  //     let movieUpdateParams: Prisma.MovieUpdateInput = {
  //       ...movieRest
  //     }

  //     if( directorId ){
  //       const director = await prisma.director.findUnique({
  //         where: {
  //           id: directorId
  //         }
  //       });

  //       if( !director ){
  //         throw new NotFoundException(`존재하지 않는 감독 ID입니다. ${directorId}`);
  //       }

  //       movieUpdateParams.director = { connect: {id: directorId} };
  //     }

  //     if( genreIds ){
  //       const genres = await prisma.genre.findMany({
  //         where: {
  //           id: { in: genreIds }
  //         }
  //       });

  //       if( genres.length !== genreIds.length ){
  //         throw new NotFoundException(`존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map(genre => genre.id).join(',')}`);
  //       }

  //       movieUpdateParams.genres = { set: genres.map(genre => ({id: genre.id})) };
  //     }

  //     await prisma.movie.update({
  //       where: { id },
  //       data: movieUpdateParams
  //     });

  //     if( description ){
  //       await prisma.movieDetail.update({
  //         where: { id: movie.detail.id },
  //         data: { description }
  //       })
  //     }

  //     return prisma.movie.findUnique({
  //       where: { id },
  //       include: {
  //         detail: true,
  //         director: true,
  //         genres: true,
  //       }
  //     });
  //   });
  // }

  // async update(id: number, updateMovieDto: UpdateMovieDto) {
  //   const qr = this.dataSource.createQueryRunner();
  //   await qr.connect();
  //   await qr.startTransaction();

  //   try {
  //     const movie = await qr.manager.findOne(Movie, {
  //       where: {id},
  //       relations: ['detail', 'genres']
  //     });
  //     if(!movie) {
  //       throw new NotFoundException("존재하지 않는 ID 값의 영화입니다.");
  //     }
  
  //     const {description, directorId, genreIds, ...movieRest} = updateMovieDto;
  
  //     let newDirector;
  //     if( directorId ){
  //       const director = await qr.manager.findOne(Director, {
  //         where: {
  //           id: directorId
  //         }
  //       });
    
  //       if( !director ){
  //         throw new NotFoundException(`존재하지 않는 감독 ID입니다. ${directorId}`);
  //       }
  
  //       newDirector = director;
  //     }
  
  //     let newGenres;
  //     if(genreIds){
  //       const genres = await qr.manager.find(Genre, {
  //         where: {
  //           id: In(updateMovieDto.genreIds)
  //         }
  //       });
  //       if( genres.length !== updateMovieDto.genreIds.length ){
  //         throw new NotFoundException(`존재하지 않는 장르가 있습니다. 존재하는 ids -> ${genres.map(genre => genre.id).join(',')}`);
  //       }
  
  //       newGenres = genres;
  //     }
  
  //     const movieUpdateFields = {
  //       ...movieRest,
  //       ...(newDirector && { director: newDirector })
  //     };
  //     await this.updateMovie(qr, movieUpdateFields, id);
  
  //     if(description) {
  //       await this.updateMovieDetail(qr, description, movie);
  //     }

  //     if(newGenres) {
  //       await this.updateMovieGenreRelation(qr, newGenres, movie, id);
  //     }
     
  //     await qr.commitTransaction();

  //     return this.movieRepository.findOne({
  //       where: {id},
  //       relations: ['detail', 'director', 'genres']
  //     });
  //   } catch (e) {
  //     await qr.rollbackTransaction();
  //     throw e;
  //   } finally {
  //     await qr.release();
  //   }

  // }

  async remove(id: number) {
    const movie = await this.movieModel.findById(id)
      .populate('movieDetail')
      .exec();
    // const movie = await this.prisma.movie.findUnique({
    //   where: { id },
    //   include: {
    //     detail: true
    //   }
    // });
    // const movie = await this.movieRepository.findOne({
    //   where: {id},
    //   relations: ['detail']
    // });
    if(!movie) {
      throw new NotFoundException("존재하지 않는 ID 값의 영화입니다.");
    }

    await this.movieModel.findByIdAndDelete(id).exec();
    // await this.prisma.movie.delete({
    //   where: { id }
    // });
    // await this.movieRepository.delete(id);

    if(movie.detail._id) {
      await this.movieDetailModel.findByIdAndDelete(movie.detail._id).exec();
      // await this.prisma.movieDetail.delete({
      //   where: { id: movie.detail.id }
      // });
      // await this.movieDetailRepository.delete(movie.detail.id);
    }

    return id;
  }

  /* istanbul ignore next */
  // async insertMovieUserLike(qr: QueryRunner, movieId: number, userId: number, isLike: boolean){
  //   return qr.manager.createQueryBuilder()
  //     .insert()
  //     .into(MovieUserLike)
  //     .values({
  //       movieId, userId, isLike
  //     })
  //     .execute();
  // }

  async toggleMovieLike(movieId: number, userId: number, isLike: boolean, qr: QueryRunner) {
    const movie = await this.movieModel.findById(movieId).exec();
    // const movie = await this.prisma.movie.findUnique({
    //   where: { id: movieId }
    // });
    // const movie = await this.movieRepository.findOne({
    //   where: {
    //     id: movieId
    //   }
    // });
    if( !movie ){
      throw new BadRequestException('존재하지 않는 영화입니다.')
    }
    
    const user = await this.userModel.findById(userId).exec();
    // const user = await this.prisma.user.findUnique({
    //   where: { id: userId }
    // });
    // const user = await this.userRepository.findOne({
    //   where: {
    //     id: userId
    //   }
    // });
    if( !user ){
      throw new UnauthorizedException('존재하지 않는 회원입니다.')
    }
    
    const likeRecord = await this.movieUserLikeModel.findOne({
      movie: movieId,
      user: userId
    }).exec();
    // const likeRecord = await this.prisma.movieUserLike.findUnique({
    //   where: {
    //     movieId_userId: {movieId, userId}
    //   }
    // });
    // const likeRecord = await this.movieUserLikeRepository.findOne({
    //   where: {
    //     movieId,
    //     userId
    //   }
    // });

    if( likeRecord ){
      if(isLike === likeRecord.isLike){
        await this.movieUserLikeModel.findByIdAndDelete(likeRecord._id);
        // await this.prisma.movieUserLike.delete({
        //   where: {
        //     movieId_userId: {movieId, userId}
        //   }
        // });
        // await qr.manager.delete(MovieUserLike, {
        //   movieId,
        //   userId
        // });
      } else {
        likeRecord.isLike = isLike;
        likeRecord.save();
        // await this.movieUserLikeModel.findByIdAndUpdate(likeRecord._id, { isLike });
        // await this.prisma.movieUserLike.update({
        //   where: {
        //     movieId_userId: {movieId, userId}
        //   },
        //   data: {
        //     isLike
        //   }
        // });
        // await qr.manager.update(MovieUserLike, {
        //   movieId,
        //   userId
        // },{
        //   isLike
        // });
      }
    } else {
      await this.movieUserLikeModel.create({
        movie: movieId,
        user: userId,
        isLike: isLike
      });
      // await this.prisma.movieUserLike.create({
      //   data: {
      //     movie: {connect: {id: movieId}},
      //     user: {connect: {id: userId}},
      //     isLike
      //   }
      // })
      // await this.insertMovieUserLike(qr, movieId, userId, isLike);
    }

    const result = await this.movieUserLikeModel.findOne({
      movie: movieId,
      user: userId
    });
    // const result = await this.prisma.movieUserLike.findUnique({
    //   where: {
    //     movieId_userId: {movieId, userId}
    //   }
    // });
    // const result = await qr.manager.findOne(MovieUserLike, {
    //   where: {
    //     movieId,
    //     userId
    //   }
    // });
    return {
      isLike: result && result.isLike
    };
  }
}
