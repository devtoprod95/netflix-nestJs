import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { AppService, Movie } from './app.service';

@Controller('movie')
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getMovies(
    @Query('title') title?: string,
  ): Movie[] {
    
    return this.appService.getManyMovies(title);
  }

  @Get(':id')
  getMovie(@Param('id') id: string): Movie {
    return this.appService.getMovieById(id)
  }

  @Post()
  postMovie(
    @Body('title') title: string,
  ): Movie {
    return this.appService.createMovie(title);
  }

  @Patch(':id')
  patchMovie(
    @Param('id') id: string,
    @Body('title') title: string,
  ): Movie {
    return this.appService.updateMovie(id, title);
  }

  @Delete(':id')
  deleteMovie(
    @Param('id') id: string
  ): number {
    return this.appService.deleteMovie(id);
  }
}
