import { Module } from '@nestjs/common';
import { GenreService } from './genre.service';
import { GenreController } from './genre.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CommonModule } from 'src/common/common.module';
import { MongooseModule } from '@nestjs/mongoose';
import { Genre, GenreSchema } from './schema/genre.schema';

@Module({
  imports: [
    // TypeOrmModule.forFeature([
    //   Genre
    // ]),
    MongooseModule.forFeature([
      {
        name: Genre.name,
        schema: GenreSchema
      }
    ]),
    CommonModule
  ],
  controllers: [GenreController],
  providers: [GenreService],
})
export class GenreModule {}