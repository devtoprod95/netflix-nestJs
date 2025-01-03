import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { Repository } from 'typeorm';
import { User } from 'src/user/entity/user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from 'src/user/user.service';

const mockUserRepository = {
  findOne: jest.fn(),
  save   : jest.fn(),
  find   : jest.fn(),
  update : jest.fn(),
  delete : jest.fn()
}
const mockUserService = {
  create: jest.fn()
}
const mockConfigService = {
  get: jest.fn()
}
const mockJwtService = {
  signAsync  : jest.fn(),
  verifyAsync: jest.fn(),
  decode     : jest.fn()
}
const mockCacheManager = {
  set: jest.fn()
}

describe('AuthService', () => {
  let service       : AuthService;
  let userRepository: Repository<User>;
  let userService   : UserService;
  let configService : ConfigService;
  let jwtService    : JwtService;
  let cacheManager  : Cache;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide : getRepositoryToken(User),
          useValue: mockUserRepository
        },
        {
          provide : UserService,
          useValue: mockUserService
        },
        {
          provide : ConfigService,
          useValue: mockConfigService
        },
        {
          provide : JwtService,
          useValue: mockJwtService
        },
        {
          provide : CACHE_MANAGER,
          useValue: mockCacheManager
        }
      ],
    }).compile();

    service        = module.get<AuthService>(AuthService);
    userRepository = module.get<Repository<User>>(getRepositoryToken(User));
    userService    = module.get<UserService>(UserService);
    configService  = module.get<ConfigService>(ConfigService);
    jwtService     = module.get<JwtService>(JwtService);
    cacheManager   = module.get<Cache>(CACHE_MANAGER);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
