import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, ClassSerializerInterceptor, ParseIntPipe, BadRequestException, UseGuards } from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieTitleValidationPipe } from './pipe/movie-title-validation.pipe';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Public } from 'src/auth/decorator/public.decorator';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Public()
  @Get()
  getMovies(
    @Query('title', MovieTitleValidationPipe) title?: string,
  ) {
    return this.movieService.findAll(title);
  }

  @Get(':id')
  getMovie(@Param('id', new ParseIntPipe({
    exceptionFactory(error) {
      throw new BadRequestException('숫자를 입력하세요.');
    }
  })) id: number) {
    return this.movieService.findOne(id)
  }

  @Post()
  postMovie(
    @Body() body: CreateMovieDto
  ) {
    return this.movieService.create(body);
  }

  @Patch(':id')
  patchMovie(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateMovieDto
  ) {
    return this.movieService.update(id, body);
  }

  @Delete(':id')
  deleteMovie(
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.movieService.remove(id);
  }
}
