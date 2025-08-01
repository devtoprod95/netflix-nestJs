import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseInterceptors, ClassSerializerInterceptor, BadRequestException, UseGuards, Request, UploadedFile, UploadedFiles, Req } from '@nestjs/common';
import { MovieService } from './movie.service';
import { CreateMovieDto } from './dto/create-movie.dto';
import { UpdateMovieDto } from './dto/update-movie.dto';
import { RBAC } from 'src/auth/decorator/rbac.decorator';
import { GetMoviesDto } from './dto/get-movies.dto';
import { TransactionInterceptor } from 'src/common/interceptor/transaction.interceptor';
import { UserId } from 'src/user/decorator/user-id.decorator';
import { QueryRunner } from 'src/common/decorator/query-runner.decorator';
import { QueryRunner as QR } from 'typeorm';
import { CacheInterceptor as CI } from '@nestjs/cache-manager';
import { Throttle } from 'src/common/decorator/throttle.decorator';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Role } from '@prisma/client';

@Controller({
  path: 'movie',
})
@ApiTags('Movie')
@ApiBearerAuth()
// @UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  @RBAC(Role.user)
  @ApiOperation({
    description: '[Movie]를 Pagination 하는 endPoint'
  })
  @ApiResponse({
    status: 200,
    description: '정상 통신'
  })
  @ApiResponse({
    status: 400,
    description: '클라이언트 에러 통신'
  })
  @Throttle({
    count: 100,
    unit: 'minute'
  })
  getMovies(
    @Query() dto: GetMoviesDto,
    @UserId() userId: string
  ) {
    return this.movieService.findAll(dto, userId);
  }

  @Get('recent')
  @RBAC(Role.user)
  @UseInterceptors(CI) // URL 기반으로 캐싱
  getRecentMovies(
    @Query() dto: GetMoviesDto,
    @UserId() userId: string
  ) {
    return this.movieService.findRecent();
  }

  @Get(':id')
  @RBAC(Role.user)
  getMovie(
    // @Param('id', new ParseIntPipe({
    //   exceptionFactory(error) {
    //     throw new BadRequestException('숫자를 입력하세요.');
    //   }
    // })) id: number
    @Param('id') id: string,
    @Req() request: any,
  ) {
    const session = request.session;
    
    const movieCount = session.movieCount ?? {};

    request.session.movieCount = {
      ...movieCount,
      [id]: movieCount[id] ? movieCount[id]+1 : 1
    }
    
    return this.movieService.findOne(id)
  }

  @Post()
  @RBAC(Role.admin)
  @UseInterceptors(TransactionInterceptor)
  postMovie(
    @Body() body: CreateMovieDto,
    @UserId() userId
  ) {
    return this.movieService.createMongoose(body, userId);
  }

  // @Post()
  // @RBAC(Role.admin)
  // @UseInterceptors(TransactionInterceptor)
  // postMovie(
  //   @Body() body: CreateMovieDto,
  //   @QueryRunner() queryRunner: QR,
  //   @UserId() userId
  // ) {
  //   return this.movieService.create(body, userId, queryRunner);
  // }

  @Patch(':id')
  @RBAC(Role.admin)
  patchMovie(
    @Param('id') id: string,
    @Body() body: UpdateMovieDto
  ) {
    return this.movieService.updateMongoose(id, body);
  }

  @Delete(':id')
  @RBAC(Role.admin)
  deleteMovie(
    @Param('id') id: string
  ) {
    return this.movieService.remove(id);
  }

  @Post(':id/like')
  @UseInterceptors(TransactionInterceptor)
  createMovieLike(
    @Param('id') movieId: string,
    @UserId() userId: string,
    @QueryRunner() queryRunner: QR,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, true, queryRunner);
  }

  @Post(':id/dislike')
  @UseInterceptors(TransactionInterceptor)
  createMovieDisLike(
    @Param('id') movieId: string,
    @UserId() userId: string,
    @QueryRunner() queryRunner: QR,
  ) {
    return this.movieService.toggleMovieLike(movieId, userId, false, queryRunner);
  }
}
