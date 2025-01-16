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
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';

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

    it('should findAll', async() => {
      const movies = [
        {
          id: 1,
          title: 'movie 1',
          isLike: null
        }
      ];
      const dto: GetMoviesDto = {
        title: 'movie',
        order: ['id_DESC'],
        take : 10
      };
      const qb: any = {
        where: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([movies, 1])
      };

      getMoviesMock.mockResolvedValue(qb);
      jest.spyOn(commonService, 'applyCursorPaginationParamsToQb').mockResolvedValue({nextCursor: null} as any);

      const result = await movieService.findAll(dto);

      expect(getMoviesMock).toHaveBeenCalled();
      expect(qb.where).toHaveBeenCalledWith('movie.title LIKE :title', {
        title: `%${dto.title}%`
      });
      expect(commonService.applyCursorPaginationParamsToQb).toHaveBeenCalledWith(qb, dto);
      expect(result).toEqual({
        data: movies,
        nextCursor: null,
        count: 1
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
});
