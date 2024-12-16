import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { GenreService } from './genre.service';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';

@Controller('genre')
export class GenreController {
  constructor(private readonly genreService: GenreService) {}

  @Get()
  getMovies(
    @Query('title') title?: string,
  ) {
    return this.genreService.findAll(title);
  }

  @Get(':id')
  getMovie(@Param('id') id: string) {
    return this.genreService.findOne(+id)
  }

  @Post()
  postMovie(
    @Body() body: CreateGenreDto
  ) {
    return this.genreService.create(body);
  }

  @Patch(':id')
  patchMovie(
    @Param('id') id: string,
    @Body() body: UpdateGenreDto
  ) {
    return this.genreService.update(+id, body);
  }

  @Delete(':id')
  deleteMovie(
    @Param('id') id: string
  ) {
    return this.genreService.remove(+id);
  }
}
