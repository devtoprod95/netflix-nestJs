import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from 'src/app.module';

describe('MovieController (e2e)', () => {
  let app: INestApplication;
  const userToken: string = `${process.env.USER_TOKEN}`;

  afterAll(async () => {
    await app.close();
  });
  
  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true, // 불필요 속성은 전달 하지 않는다 default: true
      forbidNonWhitelisted: true, // 허용되지 않은 속성을 전달 시 에러를 반환한다 default: false,
      transformOptions: {
        enableImplicitConversion: true // query string -> integer 변환 기능
      }
    }));
    await app.init();
  });

  describe('[GET /movie]', () => {
    it('should get all movies', async() => {
      const { body, statusCode, error } = await request(app.getHttpServer())
        .get('/movie')
        .set('Authorization', `Bearer ${userToken}`);

      expect(statusCode).toBe(200);
    });
  })
});
