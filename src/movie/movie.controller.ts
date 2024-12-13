import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, ClassSerializerInterceptor } from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  getMovies(
    @Query('title') title?: string,
  ): Movie[] {
    
    return this.movieService.getManyMovies(title);
  }

  @Get(':id')
  getMovie(@Param('id') id: string): Movie {
    return this.movieService.getMovieById(id)
  }

  @Post()
  postMovie(
    @Body() body: CreateMovieDto
  ): Movie {
    return this.movieService.createMovie(body);
  }

  @Patch(':id')
  patchMovie(
    @Param('id') id: string,
    @Body() body: UpdateMovieDto
  ): Movie {
    return this.movieService.updateMovie(id, body);
  }

  @Delete(':id')
  deleteMovie(
    @Param('id') id: string
  ): number {
    return this.movieService.deleteMovie(id);
  }
}
