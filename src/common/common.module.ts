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
import { ConfigModule, ConfigService } from "@nestjs/config";
import { envVariableKeys } from "./const/env.const";
import { PrismaService } from "./prisma.sevice";

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
        BullModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => ({
            connection: {
              host: configService.get<string>(envVariableKeys.REDIS_ENDPOINT),
              port: configService.get<number>(envVariableKeys.REDIS_PORT),
              username: configService.get<string>(envVariableKeys.REDIS_USER),
              password: configService.get<string>(envVariableKeys.REDIS_PASSWORD),
            }
          }),
        }),
        BullModule.registerQueue({
          name: 'thumbnail-generation',
        })
    ],
    controllers: [CommonController],
    providers: [CommonService, TaskService, PrismaService],
    exports: [CommonService, PrismaService],
})
export class CommonModule {} // 클래스 이름도 오타 수정 (CommonMudlue -> CommonModule)