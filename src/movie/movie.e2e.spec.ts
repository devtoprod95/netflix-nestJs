import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { Role, User } from 'src/user/entity/user.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { Movie } from './entity/movie.entity';
import { DataSource } from 'typeorm';
import { MovieUserLike } from './entity/movie-user-like.entity';
import { AuthService } from 'src/auth/auth.service';

describe('MovieController (e2e)', () => {
  let app: INestApplication;
  let token: string;
  let dataSource  : DataSource;

  let users    : User[];
  let directors: Director[];
  let movies   : Movie[];
  let genres   : Genre[];

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true, // 불필요 속성은 전달 하지 않는다 default: true
      forbidNonWhitelisted: true, // 허용되지 않은 속성을 전달 시 에러를 반환한다 default: false,
      transformOptions: {
        enableImplicitConversion: true // query string -> integer 변환 기능
      }
    }));
    await app.init();

    dataSource = app.get<DataSource>(DataSource);

    const movieRepository         = dataSource.getRepository(Movie);
    const movieDetailRepository   = dataSource.getRepository(MovieDetail);
    const userRepository          = dataSource.getRepository(User);
    const directorRepository      = dataSource.getRepository(Director);
    const genreRepository         = dataSource.getRepository(Genre);
    const movieUserLikeRepository = dataSource.getRepository(MovieUserLike);

    await movieUserLikeRepository.delete({});
    await movieRepository.delete({});
    await genreRepository.delete({});
    await directorRepository.delete({});
    await userRepository.delete({});
    await movieDetailRepository.delete({});

    users = [1, 2].map(
        (x) => userRepository.create({
            id: x,
            email: `${x}@test.com`,
            password: '$2b$10$hujyAKwxxPEYLIxFiuGMreZ3Qth85z1jKNTGwHpS2sbtVzkFOqi1G'
        })
    );
    await userRepository.save(users);

    directors = [1, 2].map(
        (x) => directorRepository.create({
            id: x,
            dob: new Date('1992-11-14'),
            nationality: 'South Korea',
            name: `Director name ${x}`
        })
    );
    await directorRepository.save(directors);

    genres = [1, 2].map(
        (x) => genreRepository.create({
            id: x,
            name: `Genre ${x}`
        })
    );
    await genreRepository.save(genres);

    movies = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15].map(
        (x) => movieRepository.create({
            id: x,
            title: `Movie ${x}`,
            creator: users[0],
            genres: genres,
            likeCount: 0,
            disLikeCount: 0,
            detail: movieDetailRepository.create({
                description: `Movie Detail ${x}`
            }),
            thumbnail: `movies/movie${x}.mp4`,
            director: directors[0],
            createdAt: new Date(`2023-9-${x}`)
        })
    );
    await movieRepository.save(movies);

    let authService = moduleFixture.get<AuthService>(AuthService);
    token = await authService.issueToken({id: users[0].id, role: Role.admin}, false);
  });

  afterAll(async () => {
    await new Promise(resolve => setTimeout(resolve, 500));
    await dataSource.destroy();
    await app.close();
  });

  describe('[GET /movie]', () => {
    it('should get all movies', async() => {
      const { body, statusCode, error } = await request(app.getHttpServer())
        .get('/movie')
        .set('Authorization', `Bearer ${token}`);

      expect(statusCode).toBe(200);
      expect(body).toHaveProperty('data');
      expect(body).toHaveProperty('nextCursor');
      expect(body).toHaveProperty('count');

      expect(body.data).toHaveLength(10);
    });
  });

  describe('[GET /movie/recent]', () => {
    it('should get recent movies', async() => {
      const { body, statusCode, error } = await request(app.getHttpServer())
        .get('/movie/recent')
        .set('Authorization', `Bearer ${token}`);
      
      expect(statusCode).toBe(200);
      expect(body).toHaveLength(10);
    });
  });

  describe('[GET /movie/{id}]', () => {
    it('should get movie by id', async() => {
      const movieId = movies[0].id;

      const { body, statusCode, error } = await request(app.getHttpServer())
        .get(`/movie/${movieId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(statusCode).toBe(200);
      expect(body.id).toEqual(movieId);
    });

    it('should throw 404 error if movie does not exit', async() => {
      const movieId = 999999;

      const { body, statusCode, error } = await request(app.getHttpServer())
        .get(`/movie/${movieId}`)
        .set('Authorization', `Bearer ${token}`);
      
      expect(statusCode).toBe(404);
    });
  });
});
