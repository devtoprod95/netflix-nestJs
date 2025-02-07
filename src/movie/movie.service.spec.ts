import { MovieService } from './movie.service';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { Movie } from './entity/movie.entity';
import { TestBed } from '@automock/jest';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CommonService } from 'src/common/common.service';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { User } from 'src/user/entity/user.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { BadRequestException, ConflictException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

describe('MovieService', () => {
  let movieService           : MovieService;
  let movieRepository        : jest.Mocked<Repository<Movie>>;
  let detailRepository       : jest.Mocked<Repository<MovieDetail>>;
  let directorRepository     : jest.Mocked<Repository<Director>>;
  let genreRepository        : jest.Mocked<Repository<Genre>>;
  let userRepository         : jest.Mocked<Repository<User>>;
  let movieUserLikeRepository: jest.Mocked<Repository<MovieUserLike>>;
  let dataSource             : jest.Mocked<DataSource>;
  let commonService          : jest.Mocked<CommonService>;
  let cacheManager           : Cache;

  beforeEach(async () => {
    const {unit, unitRef} = TestBed.create(MovieService).compile();

    movieService            = unit;
    movieRepository         = unitRef.get(getRepositoryToken(Movie) as string);
    detailRepository        = unitRef.get(getRepositoryToken(MovieDetail) as string);
    directorRepository      = unitRef.get(getRepositoryToken(Director) as string);
    genreRepository         = unitRef.get(getRepositoryToken(Genre) as string);
    userRepository          = unitRef.get(getRepositoryToken(User) as string);
    movieUserLikeRepository = unitRef.get(getRepositoryToken(MovieUserLike) as string);
    dataSource              = unitRef.get(DataSource);
    commonService           = unitRef.get(CommonService);
    cacheManager            = unitRef.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(movieService).toBeDefined();
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('findRecent', () => {
    it('should findRecent from cache', async() => {
      const cacheMovies = [
        {
          id: 1,
          title: 'test'
        }
      ];

      jest.spyOn(cacheManager, 'get').mockResolvedValue(cacheMovies);

      const result = await movieService.findRecent();

      expect(cacheManager.get).toHaveBeenCalledWith('MOVIE_RECENT');
      expect(result).toEqual(cacheMovies);
    });

    it('should findRecent from movie', async() => {
      const movies = [
        {
          id: 1,
          title: 'test'
        }
      ];

      jest.spyOn(cacheManager, 'get').mockResolvedValue(null);
      jest.spyOn(movieRepository, 'find').mockResolvedValue(movies as Movie[]);
      jest.spyOn(cacheManager, 'set').mockResolvedValue(null);

      const result = await movieService.findRecent();

      expect(cacheManager.get).toHaveBeenCalledWith('MOVIE_RECENT');
      expect(movieRepository.find).toHaveBeenCalledWith({
        order: {
          createdAt: 'DESC'
        },
        take: 10
      });
      expect(cacheManager.set).toHaveBeenCalledWith('MOVIE_RECENT', movies);
      expect(result).toEqual(movies);
    });
  });

  describe('findAll', () => {
    let getMoviesMock    : jest.SpyInstance;
    let getLikedMovieMock: jest.SpyInstance;

    beforeEach(() => {
      getMoviesMock     = jest.spyOn(movieService, 'getMovies');
      getLikedMovieMock = jest.spyOn(movieService, 'getLikedMovies');
    })

    it('should findAll 1', async() => {
      const movies = [
        {
          id: 1,
          title: 'movie 1',
          isLike: true
        },
        {
          id: 2,
          title: 'movie 2',
          isLike: true
        }
      ];
      const userId = 1;
      const dto: GetMoviesDto = {
        title: 'movie',
        order: ['id_DESC'],
        take : 10
      };
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(),
      };

      getMoviesMock.mockResolvedValue(qb);
      jest.spyOn(commonService, 'applyCursorPaginationParamsToQb').mockResolvedValue({nextCursor: null} as any);
      qb.getManyAndCount.mockResolvedValueOnce([movies, movies.length]);
      getLikedMovieMock.mockResolvedValue([
        {isLike: true, movie: {id: 1} as Movie},
        {isLike: true, movie: {id: 2} as Movie}
      ]);
      
      const result = await movieService.findAll(dto, userId);

      expect(getMoviesMock).toHaveBeenCalled();
      expect(qb.where).toHaveBeenCalledWith('movie.title LIKE :title', {
        title: `%${dto.title}%`
      });
      expect(commonService.applyCursorPaginationParamsToQb).toHaveBeenCalledWith(qb, dto);
      expect(qb.getManyAndCount).toHaveBeenCalled();
      expect(getLikedMovieMock).toHaveBeenCalledWith(movies.map(movie => movie.id), userId);
      expect(result).toEqual({
        data: movies,
        nextCursor: null,
        count: 2
      });
    });

    it('should findAll 2', async() => {
      const movies = [
        {
          id: 1,
          title: 'movie 1',
          isLike: null,
        }
      ];
      const dto: GetMoviesDto = {
        title: 'movie',
        order: ['id_DESC'],
        take : 10
      };
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn(),
      };

      getMoviesMock.mockResolvedValue(qb);
      jest.spyOn(commonService, 'applyCursorPaginationParamsToQb').mockResolvedValue({nextCursor: null} as any);
      qb.getManyAndCount.mockResolvedValueOnce([movies, movies.length]);
      
      const result = await movieService.findAll(dto);

      expect(getMoviesMock).toHaveBeenCalled();
      expect(qb.where).toHaveBeenCalledWith('movie.title LIKE :title', {
        title: `%${dto.title}%`
      });
      expect(commonService.applyCursorPaginationParamsToQb).toHaveBeenCalledWith(qb, dto);
      expect(qb.getManyAndCount).toHaveBeenCalled();
      expect(getLikedMovieMock).not.toHaveBeenCalled();
      expect(result).toEqual({
        data: movies,
        nextCursor: null,
        count: movies.length
      });
    });
  });

  describe("findOne", () => {
    let findMovieDetailMock: jest.SpyInstance;

    beforeEach(() => {
      findMovieDetailMock = jest.spyOn(movieService, "findMovieDetail");
    });

    it('should findOne', async() => {
      const movie = {
        id: 1,
        title: "test"
      };

      findMovieDetailMock.mockResolvedValue(movie);

      const result = await movieService.findOne(movie.id);

      expect(findMovieDetailMock).toHaveBeenCalledWith(movie.id);
      expect(result).toEqual(movie);
    });
    
    it('should findOne erorr', async() => {
      const movie = {
        id: 1,
        title: "test"
      };

      findMovieDetailMock.mockResolvedValue(null);

      expect(movieService.findOne(movie.id)).rejects.toThrow(NotFoundException);
      expect(findMovieDetailMock).toHaveBeenCalledWith(movie.id);
    });
  });

  describe('create', () => {
    let qr                          : jest.Mocked<QueryRunner>;
    let createMovieDetailMock       : jest.SpyInstance;
    let createMovieMock             : jest.SpyInstance;
    let createMovieGenreRelationMock: jest.SpyInstance;
    let renameMovieThumbnailMock    : jest.SpyInstance;

    beforeEach(() => {
      qr = {
        manager: {
          findOne: jest.fn(),
          find: jest.fn(),
        }
      } as any as jest.Mocked<QueryRunner>;

      createMovieDetailMock        = jest.spyOn(movieService, 'createMovieDetail');
      createMovieMock              = jest.spyOn(movieService, 'createMovie');
      createMovieGenreRelationMock = jest.spyOn(movieService, 'createMovieGenreRelation');
      renameMovieThumbnailMock     = jest.spyOn(movieService, 'renameMovieThumbnail');
    });

    const createMovieDto: CreateMovieDto = {
      title: 'new movie',
      directorId: 1,
      genreIds: [1, 2],
      description: 'good movie',
      thumbnail: 'test.jpg'
    };
    const userId = 1;
    const director = {
      id: 1,
      name: 'director'
    } as Director;
    const genres = [
      {
        id: 1,
        name: 'genre1'
      },
      {
        id: 2,
        name: 'genre2'
      }
    ] as Genre[];
    const movieDetailInsertResult = {identifiers: [{id: 1}]};
    const movieInsertResult       = {identifiers: [{id: 1}]};
    const createMovieResult       = {...createMovieDto, id: 1};
    it('create', async() => {
      (qr.manager.findOne as any).mockResolvedValueOnce(director);
      (qr.manager.find as any).mockResolvedValueOnce(genres);
      (qr.manager.findOne as any).mockResolvedValueOnce(null);
      (qr.manager.findOne as any).mockResolvedValueOnce(createMovieResult);

      createMovieDetailMock.mockResolvedValue(movieDetailInsertResult);
      createMovieMock.mockResolvedValue(movieInsertResult);
      createMovieGenreRelationMock.mockResolvedValue(undefined);
      renameMovieThumbnailMock.mockResolvedValue(undefined);

      const result = await movieService.create(createMovieDto, userId, qr);

      expect(qr.manager.findOne).toHaveBeenCalledWith(Director, {
        where: {
          id: createMovieDto.directorId
        }
      });
      expect(qr.manager.find).toHaveBeenCalledWith(Genre, {
        where: {
          id: In(createMovieDto.genreIds)
        }
      });
      expect(createMovieDetailMock).toHaveBeenCalledWith(qr, createMovieDto);
      expect(createMovieMock).toHaveBeenCalledWith(qr, createMovieDto, director, movieDetailInsertResult.identifiers[0].id, userId, expect.any(String));
      expect(createMovieGenreRelationMock).toHaveBeenCalledWith(qr, movieInsertResult.identifiers[0].id, genres);
      expect(renameMovieThumbnailMock).toHaveBeenCalledWith(expect.any(String), expect.any(String), createMovieDto);
      expect(result).toEqual(createMovieResult);
    });

    it('create error empty director', async() => {
      (qr.manager.findOne as any).mockResolvedValueOnce(null);
      await expect(movieService.create(createMovieDto, userId, qr)).rejects.toThrow(NotFoundException);
    });

    it('create error empty genres', async() => {
      const emptyGenres = [];
      (qr.manager.findOne as any).mockResolvedValueOnce(director);
      (qr.manager.find as any).mockResolvedValueOnce(emptyGenres);
      await expect(movieService.create(createMovieDto, userId, qr)).rejects.toThrow(NotFoundException);
    });

    it('create error not empty movie', async() => {
      (qr.manager.findOne as any).mockResolvedValueOnce(director);
      (qr.manager.find as any).mockResolvedValueOnce(genres);
      (qr.manager.findOne as any).mockResolvedValueOnce(true);

      createMovieDetailMock.mockResolvedValue(movieDetailInsertResult);
      await expect(movieService.create(createMovieDto, userId, qr)).rejects.toThrow(ConflictException);
    });
  });

  describe('update', () => {
    let qr                          : jest.Mocked<QueryRunner>;
    let updateMovieMock             : jest.SpyInstance;
    let updateMovieDetailMock       : jest.SpyInstance;
    let updateMovieGenreRelationMock: jest.SpyInstance;

    beforeEach(() => {
      qr = {
        connect: jest.fn(),
        startTransaction: jest.fn(),
        commitTransaction: jest.fn(),
        rollbackTransaction: jest.fn(),
        release: jest.fn(),
        manager: {
          findOne: jest.fn(),
          find: jest.fn(),
        }
      } as any as jest.Mocked<QueryRunner>;
      updateMovieMock              = jest.spyOn(movieService, 'updateMovie');
      updateMovieDetailMock        = jest.spyOn(movieService, 'updateMovieDetail');
      updateMovieGenreRelationMock = jest.spyOn(movieService, 'updateMovieGenreRelation');

      jest.spyOn(dataSource, 'createQueryRunner').mockReturnValue(qr);
    });

    const updateMovieDto: UpdateMovieDto = {
      title: 'updated Movie',
      directorId: 1,
      genreIds: [1, 2],
      description: 'updated description'
    };
    const movie = {
      id: 1,
      detail: {id: 1},
      genres: [{id: 1}, {id: 2}]
    } as Movie;
    const director = {
      id: 1,
      name: 'Director'
    };
    const genres = [
      {
        id: 1,
        name: 'genre 1'
      },
      {
        id: 2,
        name: 'genre 2'
      }
    ];
    it('update', async() => {
      (qr.connect).mockResolvedValue(null);
      (qr.startTransaction).mockResolvedValue(null);
      (qr.manager.findOne as any).mockResolvedValueOnce(movie);
      (qr.manager.findOne as any).mockResolvedValueOnce(director);
      (qr.manager.find as any).mockResolvedValueOnce(genres);
      updateMovieMock.mockResolvedValue(undefined);
      updateMovieDetailMock.mockResolvedValue(undefined);
      updateMovieGenreRelationMock.mockResolvedValue(undefined);
      (qr.commitTransaction).mockResolvedValue(null);
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(movie);
      (qr.rollbackTransaction).mockResolvedValue(null);
      (qr.release).mockResolvedValue(null);

      const result = await movieService.update(movie.id, updateMovieDto);

      expect(qr.manager.findOne).toHaveBeenNthCalledWith(1, Movie, {
        where: {
          id: movie.id
        },
        relations: ['detail', 'genres']
      });
      expect(qr.manager.findOne).toHaveBeenNthCalledWith(2, Director, {
        where: {
          id: updateMovieDto.directorId
        }
      });
      expect(qr.manager.find).toHaveBeenNthCalledWith(1, Genre, {
        where: {
          id: In(updateMovieDto.genreIds)
        }
      });
      const {description, directorId, genreIds, ...movieRest} = updateMovieDto;
      const movieUpdaetFields = {
        ...movieRest,
        director: director
      };
      expect(movieService.updateMovie).toHaveBeenCalledWith(qr, movieUpdaetFields, movie.id);
      expect(movieService.updateMovieDetail).toHaveBeenCalledWith(qr, updateMovieDto.description, movie);
      expect(movieService.updateMovieGenreRelation).toHaveBeenCalledWith(qr, genres, movie, movie.id);
      expect(result).toEqual(movie);
    });

    it('update error empty movie', async() => {
      (qr.connect).mockResolvedValueOnce(null);
      (qr.startTransaction).mockResolvedValueOnce(null);
      (qr.manager.findOne as any).mockResolvedValueOnce(null);

      await expect(movieService.update(movie.id, updateMovieDto)).rejects.toThrow(NotFoundException);
      expect(qr.manager.findOne).toHaveBeenCalledWith(Movie, {
        where: {
          id: movie.id
        },
        relations: ['detail', 'genres']
      });
      expect(qr.rollbackTransaction).toHaveBeenCalled();
      expect(qr.release).toHaveBeenCalled();
    });

    it('update error empty director', async() => {
      (qr.connect).mockResolvedValueOnce(null);
      (qr.startTransaction).mockResolvedValueOnce(null);
      (qr.manager.findOne as any).mockResolvedValueOnce(movie);
      (qr.manager.findOne as any).mockResolvedValueOnce(null);

      await expect(movieService.update(movie.id, updateMovieDto)).rejects.toThrow(NotFoundException);
      expect(qr.rollbackTransaction).toHaveBeenCalled();
      expect(qr.release).toHaveBeenCalled();
    });

    it('update error empty genres', async() => {
      const emptyGenres = [];
      (qr.connect).mockResolvedValueOnce(null);
      (qr.startTransaction).mockResolvedValueOnce(null);
      (qr.manager.findOne as any).mockResolvedValueOnce(movie);
      (qr.manager.findOne as any).mockResolvedValueOnce(director);
      (qr.manager.find as any).mockResolvedValueOnce(emptyGenres);

      await expect(movieService.update(movie.id, updateMovieDto)).rejects.toThrow(NotFoundException);
      expect(qr.rollbackTransaction).toHaveBeenCalled();
      expect(qr.release).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    const movie = {
      id: 1,
      title: 'movie',
      detail: {
        id: 2,
        description: 'detail'
      }
    } as Movie;

    it('should remove success', async() => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(movie);
      jest.spyOn(movieRepository, 'delete').mockResolvedValue(undefined);
      jest.spyOn(detailRepository, 'delete').mockResolvedValue(undefined);

      const result = await movieService.remove(movie.id);

      expect(result).toEqual(movie.id);
      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: movie.id
        },
        relations: ['detail']
      });
      expect(movieRepository.delete).toHaveBeenCalledWith(movie.id);
      expect(detailRepository.delete).toHaveBeenCalledWith(movie.detail.id);
    });

    it('should remove error', async() => {
      jest.spyOn(movieRepository, 'findOne').mockResolvedValue(null);

      await expect(movieService.remove(movie.id)).rejects.toThrow(NotFoundException);
      expect(movieRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: movie.id
        },
        relations: ['detail']
      });
    });
  });

  describe('toggleMovieLike', () => {
    let findOneMovieMock        : jest.SpyInstance;
    let findOneUserMock         : jest.SpyInstance;
    let findOneMovieUserLikeMock: jest.SpyInstance;
    let qr                      : jest.Mocked<QueryRunner>;
    let insertMovieUserLikeMock : jest.SpyInstance;

    beforeEach(() => {
      findOneMovieMock         = jest.spyOn(movieRepository, 'findOne');
      findOneUserMock          = jest.spyOn(userRepository, 'findOne');
      findOneMovieUserLikeMock = jest.spyOn(movieUserLikeRepository, 'findOne');
      qr                       = {
        manager: {
          delete: jest.fn(),
          update: jest.fn(),
          findOne: jest.fn(),
        }
      } as any as jest.Mocked<QueryRunner>;
      insertMovieUserLikeMock = jest.spyOn(movieService, 'insertMovieUserLike');
    });

    const movie = {id: 1} as Movie;
    const user  = {id: 1} as User;

    it('should success like delete', async() => {
      const movieUserLike = {movieId: 1, userId: 1, isLike: true} as MovieUserLike;
      const isLike        = true;
      const resultMock    = {isLike: undefined};
      findOneMovieMock.mockResolvedValueOnce(movie);
      findOneUserMock.mockResolvedValueOnce(user);
      findOneMovieUserLikeMock.mockResolvedValueOnce(movieUserLike);
      (qr.manager.delete as any).mockResolvedValueOnce(undefined);
      findOneMovieUserLikeMock.mockResolvedValueOnce(null);

      const result = await movieService.toggleMovieLike(movie.id, user.id, isLike, qr);

      expect(result).toEqual(resultMock);
      expect(findOneMovieMock).toHaveBeenCalledWith({
        where: {
          id: movie.id
        }
      });
      expect(findOneUserMock).toHaveBeenCalledWith({
        where: {
          id: user.id
        }
      });
      expect(findOneMovieUserLikeMock).toHaveBeenCalledWith({
        where: {
          movieId: movie.id,
          userId: user.id
        }
      });
      expect(qr.manager.delete).toHaveBeenCalledWith(MovieUserLike, {
        movieId: movie.id,
        userId: user.id
      });
      expect(findOneMovieUserLikeMock).toHaveBeenCalledWith({
        where: {
          movieId: movie.id,
          userId: user.id
        }
      });
    });

    it('should success like update', async() => {
      const movieUserLike = {movieId: 1, userId: 1, isLike: true} as MovieUserLike;
      const isLike        = false;
      const resultMock    = {isLike: isLike};
      findOneMovieMock.mockResolvedValueOnce(movie);
      findOneUserMock.mockResolvedValueOnce(user);
      findOneMovieUserLikeMock.mockResolvedValueOnce(movieUserLike);
      (qr.manager.update as any).mockResolvedValueOnce(undefined);
      (qr.manager.findOne as any).mockResolvedValueOnce(resultMock);

      const result = await movieService.toggleMovieLike(movie.id, user.id, isLike, qr);

      expect(result).toEqual(resultMock);
      expect(findOneMovieMock).toHaveBeenCalledWith({
        where: {
          id: movie.id
        }
      });
      expect(findOneUserMock).toHaveBeenCalledWith({
        where: {
          id: user.id
        }
      });
      expect(findOneMovieUserLikeMock).toHaveBeenCalledWith({
        where: {
          movieId: movie.id,
          userId: user.id
        }
      });
      expect(qr.manager.update).toHaveBeenCalledWith(MovieUserLike, {
        movieId: movie.id,
        userId: user.id
      }, {isLike});
      expect(findOneMovieUserLikeMock).toHaveBeenCalledWith({
        where: {
          movieId: movie.id,
          userId: user.id
        }
      });
    });
 
    it('should success like insert', async() => {
      const isLike     = true;
      const resultMock = {isLike: isLike};
      findOneMovieMock.mockResolvedValueOnce(movie);
      findOneUserMock.mockResolvedValueOnce(user);
      findOneMovieUserLikeMock.mockResolvedValueOnce(null);
      insertMovieUserLikeMock.mockResolvedValueOnce(undefined);
      (qr.manager.findOne as any).mockResolvedValueOnce(resultMock);

      const result = await movieService.toggleMovieLike(movie.id, user.id, isLike, qr);

      expect(result).toEqual(resultMock);
      expect(findOneMovieMock).toHaveBeenCalledWith({
        where: {
          id: movie.id
        }
      });
      expect(findOneUserMock).toHaveBeenCalledWith({
        where: {
          id: user.id
        }
      });
      expect(findOneMovieUserLikeMock).toHaveBeenCalledWith({
        where: {
          movieId: movie.id,
          userId: user.id
        }
      });
      expect(insertMovieUserLikeMock).toHaveBeenCalledWith(qr, movie.id, user.id, isLike);
      expect(findOneMovieUserLikeMock).toHaveBeenCalledWith({
        where: {
          movieId: movie.id,
          userId: user.id
        }
      });
    });

    it('should error emtpy movie', async() => {
      const isLike = true;

      findOneMovieMock.mockResolvedValueOnce(null);

      await expect(movieService.toggleMovieLike(movie.id, user.id, isLike, qr)).rejects.toThrow(BadRequestException);
      expect(findOneMovieMock).toHaveBeenCalledWith({
        where: {
          id: movie.id
        }
      });
    });

    it('should error emtpy user', async() => {
      const isLike = true;

      findOneMovieMock.mockResolvedValueOnce(movie);
      findOneUserMock.mockResolvedValueOnce(null);

      await expect(movieService.toggleMovieLike(movie.id, user.id, isLike, qr)).rejects.toThrow(UnauthorizedException);
      expect(findOneMovieMock).toHaveBeenCalledWith({
        where: {
          id: movie.id
        }
      });
      expect(findOneUserMock).toHaveBeenCalledWith({
        where: {
          id: user.id
        }
      });
    });
  });
});
