import { BadRequestException, Controller, Post, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

@Controller('common')
@ApiTags('Common')
@ApiBearerAuth()
export class CommonController {
    @Post('thumbnail')
    @UseInterceptors(FileInterceptor('thumbnail', {
        limits: {
            fileSize: 20000000, // MB
        },
        fileFilter(req, file, callback) {
            if (!file.mimetype.includes('image/') && file.mimetype.includes('mp4')) {
            return callback(new BadRequestException('이미지 또는 mp4 형식만 업로드 가능합니다.'), false)
            }

            callback(null, true);
        }
    }))
    createThumbnail(
        @UploadedFile() thumbnail: Express.Multer.File
    ) {
        return {
            fileName: thumbnail.filename
        }
    }
}
