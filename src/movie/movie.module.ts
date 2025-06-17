import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';
import { v4 } from 'uuid';
import { MongooseModule } from '@nestjs/mongoose';
import { Movie, MovieSchema } from './schema/movie.schema';
import { MovieDetail, MovieDetailSchema } from './schema/movie-detail.schema';
import { Director, DirectorSchema } from 'src/director/schema/director.schema';
import { Genre, GenreSchema } from 'src/genre/schema/genre.schema';
import { User, UserSchema } from 'src/user/schema/user.schema';
import { MovieUserLike, MovieUserLikeSchema } from './schema/movie-user-like.schema';

@Module({
  imports: [
    // TypeOrmModule.forFeature([
    //   Movie,
    //   MovieDetail,
    //   Director,
    //   Genre,
    //   User,
    //   MovieUserLike
    // ]),
    MongooseModule.forFeature([
      {
        name: Movie.name,
        schema: MovieSchema
      },
      {
        name: MovieDetail.name,
        schema: MovieDetailSchema
      },
      {
        name: Director.name,
        schema: DirectorSchema
      },
      {
        name: Genre.name,
        schema: GenreSchema
      },
      {
        name: User.name,
        schema: UserSchema
      },
      {
        name: MovieUserLike.name,
        schema: MovieUserLikeSchema
      }
    ]),
    CommonModule,
    MulterModule.register({
      storage: diskStorage({
        destination: join(process.cwd(), 'public', 'movie'),
        filename: (req, file, callback) => {
          const ext = file.originalname.split('.').pop();  // 원본 파일의 확장자 추출
          callback(null, `${v4()}_${Date.now()}.${ext}`);
        }
      })
    }),
  ],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
