import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Query } from '@nestjs/common';
import { AppService } from './app.service';

interface Movie {
  id: number;
  title: string;
}

@Controller('movie')
export class AppController {
  private movies : Movie[] = [
    {
      id: 1,
      title: '해리포터',
    },
    {
      id: 2,
      title: '어벤져스',
    },
    {
      id: 3,
      title: '어벤져스2',
    }
  ];

  private idCount = this.movies.length + 1;

  constructor(private readonly appService: AppService) {}

  @Get()
  getMovies(
    @Query('title') title?: string,
  ): Movie[] {
    if( !title ){
      return this.movies;
    }

    return this.movies.filter(m => m.title.includes(title));
  }

  @Get(':id')
  getMovie(@Param('id') id: string): Movie {
    const movie = this.movies.find((m) => m.id === +id);

    if(!movie) {
      throw new NotFoundException("존재하지 않는 ID 값의 영화입니다.");
    }

    return movie;
  }

  @Post()
  postMovie(
    @Body('title') title: string,
  ): Movie {
    const movie: Movie = {
      id: this.idCount++,
      title: title
    };

    this.movies.push(movie);

    return movie;
  }

  @Patch(':id')
  patchMovie(
    @Param('id') id: string,
    @Body('title') title: string,
  ): Movie {
    const movie = this.movies.find((m) => m.id === +id);
    if(!movie) {
      throw new NotFoundException("존재하지 않는 ID 값의 영화입니다.");
    }

    Object.assign(movie, {title});

    return movie;
  }

  @Delete(':id')
  deleteMovie(
    @Param('id') id: string
  ): number {
    const movieIndex = this.movies.findIndex((m) => m.id === +id);
    if(movieIndex === -1) {
      throw new NotFoundException("존재하지 않는 ID 값의 영화입니다.");
    }

    this.movies.splice(movieIndex, 1)

    return +id;
  }
}
