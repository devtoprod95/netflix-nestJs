import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { Movie } from './entity/movie.entity';

@Injectable()
export class MovieService {
  private movies : Movie[] = [];
  private idCount: number;

  constructor(){
    const movie1 = new Movie();
    movie1.id = 1;
    movie1.title = '해리포터';
    movie1.genre = '판타지';

    const movie2 = new Movie();
    movie2.id = 2;
    movie2.title = '어벤져스';
    movie2.genre = '판타지';

    const movie3 = new Movie();
    movie3.id = 3;
    movie3.title = '겨울왕국';
    movie3.genre = '판타지';

    this.movies.push(movie1, movie2, movie3);
    this.idCount = this.movies.length + 1;
  }

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
      ...createMovieDto
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
