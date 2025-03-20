import { BadRequestException, Controller, Post, UploadedFile, UploadedFiles, UseInterceptors } from '@nestjs/common';
import { FileFieldsInterceptor, FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CommonService } from './common.service';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';

@Controller('common')
@ApiTags('Common')
@ApiBearerAuth()
export class CommonController {
    constructor(
        private readonly commonService: CommonService,
        @InjectQueue('thumbnail-generation')
        private readonly thumbnailQueue: Queue
    ) {
    }

    @Post('thumbnail')
    @UseInterceptors(FileInterceptor('thumbnail', {
        limits: {
            fileSize: 200000000, // MB
        },
        fileFilter(req, file, callback) {
            if (!file.mimetype.includes('image/') && !file.mimetype.includes('mp4')) {
                return callback(new BadRequestException('이미지 또는 mp4 형식만 업로드 가능합니다.'), false)
            }

            callback(null, true);
        }
    }))
    async createThumbnail(
        @UploadedFile() thumbnail: Express.Multer.File
    ) {
        await this.thumbnailQueue.add('thumbnail', {
            fileId: thumbnail.filename,
            filePath: thumbnail.path
        });

        return {
            fileName: thumbnail.filename
        }
    }

    @Post('presigned-url')
    async createPresignedUrl(){
        return {
            url: await this.commonService.createPresignedUrl(),
        }
    }
}
