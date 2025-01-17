import { MovieService } from './movie.service';
import { TestBed } from '@automock/jest';
import { MovieController } from './movie.controller';
import { GetMoviesDto } from './dto/get-movies.dto';
import { Movie } from './entity/movie.entity';
import { CreateMovieDto } from './dto/create-movie.dto';
import { QueryRunner } from 'typeorm';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { User } from 'src/user/entity/user.entity';

describe('MovieController', () => {
  let movieController: MovieController;
  let movieService   : jest.Mocked<MovieService>;
  let qr             : jest.Mocked<QueryRunner>;

  beforeEach(async () => {
    const {unit, unitRef} = TestBed.create(MovieController).compile();
    movieController       = unit;
    movieService          = unitRef.get<MovieService>(MovieService);
    qr                    = {} as any as jest.Mocked<QueryRunner>;
  });

  it('should be defined', () => {
    expect(movieService).toBeDefined();
  });

  describe('get movies', () => {
    it('should get movies', async() => {
      const getMoviesDto: GetMoviesDto = {
        title: '',
        order: ['id_DESC'],
        take: 10
      };
      const userId = 1;
      const movies = [{id: 1}, {id: 2}] as any;

      jest.spyOn(movieService, 'findAll').mockResolvedValue(movies);

      const result = await movieController.getMovies(getMoviesDto, userId);

      expect(movieService.findAll).toHaveBeenCalledWith(getMoviesDto, userId);
      expect(result).toEqual(movies);
    });
  });

  describe('get recent movies', () => {
    it('should get recent movies', async() => {
      const getMoviesDto: GetMoviesDto = {
        title: '',
        order: ['id_DESC'],
        take: 10
      };
      const userId = 1;
      const movies = [{id: 1}, {id: 2}] as any;

      jest.spyOn(movieService, 'findRecent').mockResolvedValue(movies);

      const result = await movieController.getRecentMovies(getMoviesDto, userId);

      expect(movieService.findRecent).toHaveBeenCalled();
      expect(result).toEqual(movies);
    });
  });

  describe('get movie', () => {
    it('should get movie', async() => {
      const movie = {
        id: 1,
        title: 'movie'
      } as Movie;
      jest.spyOn(movieService, 'findOne').mockResolvedValue(movie);

      const result = await movieController.getMovie(movie.id);

      expect(movieService.findOne).toHaveBeenCalledWith(movie.id);
      expect(result).toEqual(movie);
    });
  });

  describe('get create movie', () => {
    it('should create movie', async() => {
      const createMovieDto = {
        title: 'test',
        description: 'desc',
      } as CreateMovieDto;
      const userId = 1;
      const movie  = {id: 1} as Movie;

      jest.spyOn(movieService, 'create').mockResolvedValue(movie);

      const result = await movieController.postMovie(createMovieDto, qr, userId);

      expect(movieService.create).toHaveBeenCalledWith(createMovieDto, userId, qr);
      expect(result).toEqual(movie);
    });
  });

  describe('get update movie', () => {
    it('should udpate movie', async() => {
      const updateMovieDto = {
        title: 'test',
        description: 'desc',
      } as UpdateMovieDto;
      const movie  = {id: 1} as Movie;

      jest.spyOn(movieService, 'update').mockResolvedValue(movie);

      const result = await movieController.patchMovie(movie.id, updateMovieDto);

      expect(movieService.update).toHaveBeenCalledWith(movie.id, updateMovieDto);
      expect(result).toEqual(movie);
    });
  });

  describe('get delete movie', () => {
    it('should delete movie', async() => {
      const movie = {id: 1} as Movie;

      jest.spyOn(movieService, 'remove').mockResolvedValue(movie.id);

      const result = await movieController.deleteMovie(movie.id);

      expect(movieService.remove).toHaveBeenCalledWith(movie.id);
      expect(result).toEqual(movie.id);
    });
  });

  describe('get toggleMovieLike like movie', () => {
    it('should toggleMovieLike like movie', async() => {
      const movie = {id: 1} as any;
      const user  = {id: 1} as any;

      jest.spyOn(movieService, 'toggleMovieLike').mockResolvedValue(movie);

      const result = await movieController.createMovieLike(movie.id, user.id, qr);

      expect(movieService.toggleMovieLike).toHaveBeenCalledWith(movie.id, user.id, true, qr);
      expect(result).toEqual(movie);
    });
  });

  describe('get toggleMovieLike dislike movie', () => {
    it('should toggleMovieLike dislike movie', async() => {
      const movie = {id: 1} as any;
      const user  = {id: 1} as any;

      jest.spyOn(movieService, 'toggleMovieLike').mockResolvedValue(movie);

      const result = await movieController.createMovieDisLike(movie.id, user.id, qr);

      expect(movieService.toggleMovieLike).toHaveBeenCalledWith(movie.id, user.id, false, qr);
      expect(result).toEqual(movie);
    });
  });
});
