import { Module } from '@nestjs/common';
import { MovieService } from './movie.service';
import { MovieController } from './movie.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Movie } from './entity/movie.entity';
import { MovieDetail } from './entity/movie-detail.entity';
import { Director } from 'src/director/entity/director.entity';
import { Genre } from 'src/genre/entity/genre.entity';
import { CommonMudlue } from 'src/common/common.module';
import { MulterModule } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { join } from 'path';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Movie,
      MovieDetail,
      Director,
      Genre,
    ]),
    CommonMudlue,
    MulterModule.register({
      storage: diskStorage({
        destination: join(process.cwd(), 'public', 'movie'),
      })
    }),
  ],
  controllers: [MovieController],
  providers: [MovieService],
})
export class MovieModule {}
