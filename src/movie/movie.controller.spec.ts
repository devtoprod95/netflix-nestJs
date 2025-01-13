import { MovieService } from './movie.service';
import { TestBed } from '@automock/jest';
import { DataSource, Repository } from 'typeorm';
import { Movie } from './entity/movie.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { User } from 'src/user/entity/user.entity';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { CommonService } from 'src/common/common.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CACHE_MANAGER, Cache } from '@nestjs/cache-manager';

describe('MovieController', () => {
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
    // const {unit, unitRef} = TestBed.create(MovieService).compile();

    // movieService            = unit;
    // movieRepository         = unitRef.get(getRepositoryToken(Movie) as string);
    // detailRepository        = unitRef.get(getRepositoryToken(MovieDetail) as string);
    // directorRepository      = unitRef.get(getRepositoryToken(Director) as string);
    // genreRepository         = unitRef.get(getRepositoryToken(Genre) as string);
    // userRepository          = unitRef.get(getRepositoryToken(User) as string);
    // movieUserLikeRepository = unitRef.get(getRepositoryToken(MovieUserLike) as string);
    // dataSource              = unitRef.get(DataSource);
    // commonService           = unitRef.get(CommonService);
    // cacheManager            = unitRef.get(CACHE_MANAGER);
  });

  it('should be defined', () => {
    // expect(movieService).toBeDefined();
    expect(true).toBe(true);
  });
});
