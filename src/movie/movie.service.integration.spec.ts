import { Cache, CACHE_MANAGER, CacheModule } from "@nestjs/cache-manager";
import { Test, TestingModule } from "@nestjs/testing";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Movie } from "./entity/movie.entity";
import { MovieDetail } from "./entity/movie-detail.entity";
import { Director } from "src/director/entity/director.entity";
import { Genre } from "src/genre/entity/genre.entity";
import { User } from "src/user/entity/user.entity";
import { MovieUserLike } from "./entity/movie-user-like.entity";
import { MovieService } from "./movie.service";
import { CommonService } from "src/common/common.service";
import { DataSource } from "typeorm";
import { describe } from "node:test";
import { GetMoviesDto } from "./dto/get-movies.dto";
import { CreateMovieDto } from "./dto/create-movie.dto";
import { UpdateMovieDto } from "./dto/update-movie.dto";
import { NotFoundException } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";

describe('MovieService - Integration Test', () => {
    let service     : MovieService;
    let cacheManager: Cache;
    let dataSource  : DataSource;

    let users    : User[];
    let directors: Director[];
    let movies   : Movie[];
    let genres   : Genre[];

    beforeAll(async() => {
        const module: TestingModule = await Test.createTestingModule({
            imports: [
                CacheModule.register(),
                TypeOrmModule.forRoot({
                    type: 'sqlite',
                    database: ':memory:',
                    dropSchema: true,
                    entities: [
                        Movie,
                        MovieDetail,
                        Director,
                        Genre,
                        User,
                        MovieUserLike    
                    ],
                    synchronize: true,
                    logging: false,
                }),
                TypeOrmModule.forFeature([
                    Movie,
                    MovieDetail,
                    Director,
                    Genre,
                    User,
                    MovieUserLike
                ]),
                ConfigModule.forRoot()
            ],
            providers: [MovieService, CommonService]
        }).compile();

        service      = module.get<MovieService>(MovieService);
        cacheManager = module.get<Cache>(CACHE_MANAGER);
        dataSource   = module.get<DataSource>(DataSource);
    });

    it('should be defined', () => {
        expect(service).toBeDefined();
    });

    afterAll(async() => {
        await dataSource.destroy();
    });

    beforeEach(async() => {
        await cacheManager.reset();

        const movieRepository       = dataSource.getRepository(Movie);
        const movieDetailRepository = dataSource.getRepository(MovieDetail);
        const userRepository        = dataSource.getRepository(User);
        const directorRepository    = dataSource.getRepository(Director);
        const genreRepository       = dataSource.getRepository(Genre);

        users = [1, 2].map(
            (x) => userRepository.create({
                id: x,
                email: `${x}@test.com`,
                password: '123123'
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
    });

    describe('findRecent', () => {
        it('should return recent movies', async() => {
            const result = await service.findRecent() as Movie[];

            let sortedResult = [...movies];
            sortedResult.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
            let sortedResultIds = sortedResult.slice(0, 10).map(x => x.id);

            expect(result).toHaveLength(10);
            expect(result.map(x => x.id)).toEqual(sortedResultIds);
        });

        it('should cache recent movies', async() => {
            const result     = await service.findRecent() as Movie[];
            const cachedData = await cacheManager.get('MOVIE_RECENT');

            expect(cachedData).toEqual(cachedData);
        });
    });

    describe('findAll', () => {
        it('should return movies with correct titles', async() => {
            const dto: GetMoviesDto = {
                title: 'Movie 15',
                order: ['createdAt_DESC'],
                take : 10,
            };

            const result = await service.findAll(dto);

            expect(result.data).toHaveLength(1);
            expect(result.data[0].title).toEqual(dto.title);
            expect(result.data[0]).not.toHaveProperty('isLike');
        });

        it('should return likeStatus if userId as provied', async() => {
            const dto: GetMoviesDto = {
                order: ['createdAt_ASC'],
                take : 10,
            };
            const result = await service.findAll(dto, users[0].id);

            expect(result.data).toHaveLength(10);
            expect(result.data[0]).toHaveProperty('isLike');
        });
    });

    describe('findOne', () => {
        it('should findOne movie', async() => {
            const movieId = movies[0].id;

            const result = await service.findOne(movieId);

            expect(result.id).toEqual(movieId);
        });

        it('should throw error if empty movie', async() => {
            const movieId = 9999;

            await expect(service.findOne(movieId)).rejects.toThrow(NotFoundException);
        });
    });

    describe('create', () => {
        beforeEach(() => {
            jest.spyOn(service, 'renameMovieThumbnail').mockResolvedValue();
        });

        it('should create movie correctly', async() => {
            const createMovieDto: CreateMovieDto = {
                title      : 'Test Movie',
                description: 'A Test Movie Detail',
                directorId : directors[0].id,
                genreIds   : genres.map(x => x.id),
                thumbnail  : 'test.mp4',
            };

            const result = await service.create(createMovieDto, users[0].id, dataSource.createQueryRunner());

            expect(result.title).toEqual(createMovieDto.title);
            expect(result.director.id).toEqual(createMovieDto.directorId);
            expect(result.genres.map(x => x.id)).toEqual(createMovieDto.genreIds);
            expect(result.detail.description).toEqual(createMovieDto.description);
        });
    });

    describe('update', () => { 
        it('should update movie correctly', async() => {
            const movieId = movies[0].id;

            const updateMovieDto: UpdateMovieDto = {
                title      : 'Changed Title',
                description: 'Changed Description',
                directorId : directors[0].id,
                genreIds   : [genres[0].id],
            };

            const result = await service.update(movieId, updateMovieDto);

            expect(result.title).toBe(updateMovieDto.title);
            expect(result.detail.description).toBe(updateMovieDto.description);
            expect(result.director.id).toBe(updateMovieDto.directorId);
            expect(result.genres.map(x => x.id)).toEqual(updateMovieDto.genreIds);
        });

        it('should throw error if movie does not exist', async() => {
            const updateMovieDto: UpdateMovieDto = {
                title: 'Changed Title'
            };
            await expect(service.update(9999, updateMovieDto)).rejects.toThrow(NotFoundException);
        });

        it('should throw error if director does not exist', async() => {
            const updateMovieDto: UpdateMovieDto = {
                title      : 'Changed Title',
                description: 'Changed Description',
                directorId : 9999,
                genreIds   : [genres[0].id],
            };
            await expect(service.update(movies[0].id, updateMovieDto)).rejects.toThrow(NotFoundException);
        });

        it('should throw error if genres does not exist', async() => {
            const updateMovieDto: UpdateMovieDto = {
                title      : 'Changed Title',
                description: 'Changed Description',
                directorId : directors[0].id,
                genreIds   : [99, 98],
            };
            await expect(service.update(movies[0].id, updateMovieDto)).rejects.toThrow(NotFoundException);
        });
    });

    describe('remove', () => { 
        it('should remove movie correctly', async() => {
            const movieId = movies[0].id;

            const result = await service.remove(movieId);

            expect(result).toBe(movieId);
        });

        it('should throw error if empty movie', async() => {
            const movieId = 9999;

            await expect(service.remove(movieId)).rejects.toThrow(NotFoundException);
        });
    });

    describe('toggleMovieLike', () => {
        it('should create like correctly', async() => {
           const userId  = users[0].id;
           const movieId = movies[0].id;
           const isLike  = true;

           const result = await service.toggleMovieLike(movieId, userId, isLike, dataSource.createQueryRunner());

           expect(result).toEqual({isLike});
        });

        it('should create dislike correctly', async() => {
            const userId  = users[0].id;
            const movieId = movies[0].id;
            const isLike  = false;

            const result = await service.toggleMovieLike(movieId, userId, isLike, dataSource.createQueryRunner());

            expect(result).toEqual({isLike});
        });

        it('should toggle like correctly', async() => {
            const userId  = users[0].id;
            const movieId = movies[0].id;
            const isLike  = true;
 
            await service.toggleMovieLike(movieId, userId, isLike, dataSource.createQueryRunner());
            const result = await service.toggleMovieLike(movieId, userId, isLike, dataSource.createQueryRunner());
 
            expect(result).toEqual({isLike: null});
        });

        it('should toggle dislike correctly', async() => {
            const userId  = users[0].id;
            const movieId = movies[0].id;
            const isLike  = false;
 
            await service.toggleMovieLike(movieId, userId, isLike, dataSource.createQueryRunner());
            const result = await service.toggleMovieLike(movieId, userId, isLike, dataSource.createQueryRunner());
 
            expect(result).toEqual({isLike: null});
        });
    });
});