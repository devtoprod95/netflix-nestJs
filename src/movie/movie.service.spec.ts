import { MovieService } from './movie.service';
import { DataSource, Repository } from 'typeorm';
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
});
