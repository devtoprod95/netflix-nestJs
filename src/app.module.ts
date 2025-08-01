import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { MovieModule } from './movie/movie.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConditionalModule, ConfigModule, ConfigService } from '@nestjs/config';
import * as Joi from 'joi';
import { Movie } from './movie/entity/movie.entity';
import { MovieDetail } from './movie/entity/movie-detail.entity';
import { DirectorModule } from './director/director.module';
import { Director } from './director/entity/director.entity';
import { GenreModule } from './genre/genre.module';
import { Genre } from './genre/entity/genre.entity';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { User } from './user/entity/user.entity';
import { envVariableKeys } from './common/const/env.const';
import { BearerTokenMiddleware } from './auth/middleware/bearer-token.middleware';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AuthGuard } from './auth/guard/auth.guard';
import { RBACGuard } from './auth/guard/rbac.guard';
import { ResponseTimeInterceptor } from './common/interceptor/response-time.interceptor';
import { ForbiddenExceptionFilter } from './common/filter/forbidden.filter';
import { QueryFailedExceptionFilter } from './common/filter/query-failed.filter';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { MovieUserLike } from './movie/entity/movie-user-like.entity';
import { CacheModule } from '@nestjs/cache-manager';
import { ThrottleInterceptor } from './common/interceptor/throttle.interceptor';
import { ScheduleModule } from '@nestjs/schedule';
import { WinstonModule } from 'nest-winston';
import { ChatModule } from './chat/chat.module';
import * as winston from 'winston'
import * as moment from 'moment-timezone';
import { Chat } from './chat/entity/chat.entity';
import { ChatRoom } from './chat/entity/chat-room.entity';
import { WorkerModule } from './worker/worker.module';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // 다른 모듈에서도 사용가능한 옵션
      envFilePath: process.env.NODE_ENV === 'test' ? '.env.test' : '.env',
      validationSchema: Joi.object({
        ENV: Joi.string().valid('test', 'dev', 'prod').required(),
        DB_TYPE: Joi.string().valid('postgres').required(),
        DB_URL: Joi.string().required(),
        DB_HOST: Joi.string().required(),
        DB_PORT: Joi.string().required(),
        DB_USERNAME: Joi.string().required(),
        DB_PASSWORD: Joi.string().required(),
        DB_DATABASE: Joi.string().required(),
        HASH_ROUNDS: Joi.number().required(),
        ACCESS_TOKEN_SECRET: Joi.string().required(),
        REFRESH_TOKEN_SECRET: Joi.string().required(),
        AWS_SECRET_ACCESS_KEY: Joi.string().required(),
        AWS_ACCESS_KEY_ID: Joi.string().required(),
        AWS_REGION: Joi.string().required(),
        BUCKET_NAME: Joi.string().required(),
        REDIS_ENDPOINT: Joi.string().required(),
        REDIS_PORT: Joi.number().required(),
        REDIS_USER: Joi.string().required(),
        REDIS_PASSWORD: Joi.string().required(),
      }),
    }),
    MongooseModule.forRoot('mongodb+srv://test:test@nestjsmongo.v73neng.mongodb.net/?retryWrites=true&w=majority&appName=NestJsMongo'),
    // forRootAsync는 비동기로 설정하며 ConfigModule가 완료되었을 때 실행되게 설정
    TypeOrmModule.forRootAsync({
      useFactory:(configService: ConfigService) => ({
        url: configService.get<string>(envVariableKeys.DB_URL),
        type: configService.get<string>(envVariableKeys.DB_TYPE) as 'postgres',
        // host: configService.get<string>(envVariableKeys.DB_HOST),
        // port: configService.get<number>(envVariableKeys.DB_PORT),
        // username: configService.get<string>(envVariableKeys.DB_USERNAME),
        // password: configService.get<string>(envVariableKeys.DB_PASSWORD),
        // database: configService.get<string>(envVariableKeys.DB_DATABASE),
        entities: [
          Movie,
          MovieDetail,
          Director,
          Genre,
          User,
          MovieUserLike,
          Chat,
          ChatRoom
        ],
        synchronize: configService.get<string>(envVariableKeys.ENV) === 'prod' ? false : true,
        ...(configService.get<string>(envVariableKeys.ENV) === 'prod' && {
          ssl: {
            rejectUnauthorized: false,
          }
        }),
        // logging: configService.get<string>(envVariableKeys.ENV) === 'dev' ? ["query", "error"] : false,
      }),
      inject: [ConfigService],
    }),
    // Joi를 안쓰는 일반 설정일 경우
    // TypeOrmModule.forRoot({
    //   type: process.env.DB_TYPE as 'postgres',
    //   host: process.env.DB_HOST,
    //   port: parseInt(process.env.DB_PORT),
    //   username: process.env.DB_USERNAME,
    //   password: process.env.DB_PASSWORD,
    //   database: process.env.DB_DATABASE,
    //   entities: [],
    //   synchronize: true,
    // }),
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      serveRoot: '/public/'
    }),
    CacheModule.register({
      ttl: 3000, // 3초
      isGlobal: true
    }),
    ScheduleModule.forRoot(),
    WinstonModule.forRoot({
      level: 'debug',
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize({
              all: true
            }),
            winston.format.timestamp({
                format: () => moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
            }),
            winston.format.printf(info => `${info.timestamp} [${info.context}] ${info.level} ${info.message}`)
          )
        }),
        new winston.transports.File({
          dirname: join(process.cwd(), 'logs'),
          filename: 'logs.log',
          format: winston.format.combine(
            winston.format.timestamp({
                format: () => moment().tz('Asia/Seoul').format('YYYY-MM-DD HH:mm:ss')
            }),
            winston.format.printf(info => `${info.timestamp} [${info.context}] ${info.level} ${info.message}`)
          )
        })
      ]
    }),
    MovieModule,
    DirectorModule,
    GenreModule,
    AuthModule,
    UserModule,
    ChatModule,
    ConditionalModule.registerWhen(
      WorkerModule,
      (env: NodeJS.ProcessEnv) => env['TYPE'] === 'worker'
    ),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: AuthGuard
    },
    {
      provide: APP_GUARD,
      useClass: RBACGuard
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseTimeInterceptor
    },
    {
      provide: APP_FILTER,
      useClass: ForbiddenExceptionFilter
    },
    {
      provide: APP_FILTER,
      useClass: QueryFailedExceptionFilter
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ThrottleInterceptor
    },
  ],
})
export class AppModule implements NestModule{
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(
      BearerTokenMiddleware,
    ).exclude(
      {
        path: '/auth/login',
        method: RequestMethod.POST
      },
      {
        path: '/auth/register',
        method: RequestMethod.POST
      },
    ).forRoutes('*')
  }
}
