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
                ])
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
});