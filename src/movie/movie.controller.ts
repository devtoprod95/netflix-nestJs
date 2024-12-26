import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, ClassSerializerInterceptor, ParseIntPipe, BadRequestException, UseGuards, Request, UploadedFile, UploadedFiles } from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { MovieTitleValidationPipe } from './pipe/movie-title-validation.pipe';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { Public } from 'src/auth/decorator/public.decorator';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { Role } from 'src/user/entity/user.entity';
import { GetMoviesDto } from './dto/get-movies.dto';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { FileFieldsInterceptor, FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { UserId } from 'src/user/decorator/user-id.decorator';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import { QueryRunner as QR } from 'typeorm';
import { CacheInterceptor as CI } from '@nestjs/cache-manager';

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  @RBAC(Role.user)
  getMovies(
    @Query() dto: GetMoviesDto,
    @UserId() userId: number
  ) {
    return this.movieService.findAll(dto, userId);
  }

  @Get('recent')
  @RBAC(Role.user)
  @UseInterceptors(CI) // URL 기반으로 캐싱
  getRecentMovies(
    @Query() dto: GetMoviesDto,
    @UserId() userId: number
  ) {
    return this.movieService.findRecent();
  }

  @Get(':id')
  @RBAC(Role.user)
  getMovie(
    @Param('id', new ParseIntPipe({
      exceptionFactory(error) {
        throw new BadRequestException('숫자를 입력하세요.');
      }
    })) id: number,
    @UserId() userId
  ) {
    return this.movieService.findOne(id, userId)
  }

  @Post()
  @RBAC(Role.admin)
  @UseInterceptors(TransactionInterceptor)
  postMovie(
    @Body() body: CreateMovieDto,
    @QueryRunner() queryRunner: QR,
    @UserId() userId
  ) {
    return this.movieService.create(body, userId, queryRunner);
  }

  @Patch(':id')
  @RBAC(Role.admin)
  patchMovie(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: UpdateMovieDto
  ) {
    return this.movieService.update(id, body);
  }

  @Delete(':id')
  @RBAC(Role.admin)
  deleteMovie(
    @Param('id', ParseIntPipe) id: number
  ) {
    return this.movieService.remove(id);
  }

  @Post(':id/like')
  @UseInterceptors(TransactionInterceptor)
  createMovieLike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
    @QueryRunner() queryRunner: QR,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, true, queryRunner);
  }

  @Post(':id/dislike')
  @UseInterceptors(TransactionInterceptor)
  createMovieDisLike(
    @Param('id', ParseIntPipe) movieId: number,
    @UserId() userId: number,
    @QueryRunner() queryRunner: QR,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, false, queryRunner);
  }
}
