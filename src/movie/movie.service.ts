import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';

export interface Movie {
  id: number;
  title: string;
  genre: string;
}

@Injectable()
export class MovieService {
  private movies : Movie[] = [
    {
      id: 1,
      title: '해리포터',
      genre: '판타지',
    },
    {
      id: 2,
      title: '어벤져스',
      genre: '판타지',
    },
    {
      id: 3,
      title: '겨울왕국',
      genre: '판타지',
    }
  ];

  private idCount: number = this.movies.length + 1;

  getManyMovies(title: string): Movie[] {
    if( !title ){
      return this.movies;
    }

    return this.movies.filter(m => m.title.includes(title));
  }

  getMovieById(id: string): Movie {
    const movie = this.movies.find((m) => m.id === +id);

    if(!movie) {
      throw new NotFoundException("존재하지 않는 ID 값의 영화입니다.");
    }

    return movie;
  }

  createMovie(createMovieDto: CreateMovieDto): Movie {
    const movie: Movie = {
      id: this.idCount++,
      title: createMovieDto.title,
      genre: createMovieDto.genre
    };

    this.movies.push(movie);

    return movie;
  }

  updateMovie(id: string, updateMovieDto: UpdateMovieDto): Movie {
    const movie = this.movies.find((m) => m.id === +id);
    if(!movie) {
      throw new NotFoundException("존재하지 않는 ID 값의 영화입니다.");
    }

    Object.assign(movie, updateMovieDto);

    return movie;
  }

  deleteMovie(id: string): number {
    const movieIndex = this.movies.findIndex((m) => m.id === +id);
    if(movieIndex === -1) {
      throw new NotFoundException("존재하지 않는 ID 값의 영화입니다.");
    }

    this.movies.splice(movieIndex, 1)

    return +id;
  }
}
