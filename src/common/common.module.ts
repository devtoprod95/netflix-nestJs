import { Module } from "@nestjs/common";
import { CommonService } from "./common.service";
import { CommonController } from './common.controller';
import { MulterModule } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { join } from "path";
import { v4 } from "uuid";
import { TaskService } from "./task.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Movie } from "src/movie/entity/movie.entity";
import { BullModule } from "@nestjs/bullmq";

@Module({
    imports: [
        MulterModule.register({
            storage: diskStorage({
              destination: join(process.cwd(), 'public', 'temp'),
              filename: (req, file, callback) => {
                const ext = file.originalname.split('.').pop();  // 원본 파일의 확장자 추출
                callback(null, `${v4()}_${Date.now()}.${ext}`);
              }
            })
        }),
        TypeOrmModule.forFeature([
          Movie
        ]),
        BullModule.forRoot({
          connection: {
            host: 'redis-13946.c340.ap-northeast-2-1.ec2.redns.redis-cloud.com',
            port: 13946,
            username: 'default',
            password: 'O4UvGzK1aC1bxRVHhj0HQSLGQYfIYNrL',
          }
        }),
        BullModule.registerQueue({
          name: 'thumbnail-generation',
        })
    ],
    controllers: [CommonController],
    providers: [CommonService, TaskService],
    exports: [CommonService],
})
export class CommonMudlue{}