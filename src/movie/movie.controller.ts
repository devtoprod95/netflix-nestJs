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

@Controller('movie')
@UseInterceptors(ClassSerializerInterceptor)
export class MovieController {
  constructor(private readonly movieService: MovieService) {}

  @Get()
  @RBAC(Role.user)
  getMovies(
    @Query() dto: GetMoviesDto,
  ) {
    return this.movieService.findAll(dto);
  }

  @Get(':id')
  @RBAC(Role.user)
  getMovie(@Param('id', new ParseIntPipe({
    exceptionFactory(error) {
      throw new BadRequestException('숫자를 입력하세요.');
    }
  })) id: number) {
    return this.movieService.findOne(id)
  }

  @Post()
  @RBAC(Role.admin)
  @UseInterceptors(TransactionInterceptor)
  @UseInterceptors(FileFieldsInterceptor([
    { name: 'thumbnail', maxCount: 1 },
    { name: 'detailImages', maxCount: 10 },
  ],{
    limits: {
      fileSize: 20000000, // MB
    },
    fileFilter(req, file, callback) {
      if (!file.mimetype.includes('image/')) {
        return callback(new BadRequestException('이미지 형식만 업로드 가능합니다.'), false)
      }

      callback(null, true);
    }
  }))
  postMovie(
    @Body() body: CreateMovieDto,
    @Request() req,
    @UploadedFiles() files: {
      thumbnail: Express.Multer.File[],
      detailImages: Express.Multer.File[]
    }
  ) {
    console.log(files.thumbnail, files.detailImages);
    return this.movieService.create(body, req.queryRunner);
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
}
