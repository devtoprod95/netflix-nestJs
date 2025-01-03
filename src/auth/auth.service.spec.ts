import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { Repository } from 'typeorm';
import { Role, User } from 'src/user/entity/user.entity';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Cache, CACHE_MANAGER } from '@nestjs/cache-manager';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserService } from 'src/user/user.service';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

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

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe("tokenBlock", () => {
    it('should block a token', async () => {
      const token = 'token';
      const payload = {
        exp: Math.floor(Date.now() / 1000) + 60,
      };

      jest.spyOn(jwtService, "decode").mockReturnValue(payload);

      const blockResult = await service.tokenBlock(token);
      expect(jwtService.decode).toHaveBeenCalledWith(token);
      expect(cacheManager.set).toHaveBeenCalledWith(`BLOCK_TOKEN_${token}`, payload, expect.any(Number));
      expect(blockResult).toBeTruthy();
    });
  });

  describe("parseBasicToken", () => {
    it('should parse a valid Basic Token', async () => {
      const decode   = {email: 'test@gmail.com', password: '1234'};
      const rawToken = 'Basic dGVzdEBnbWFpbC5jb206MTIzNA==';

      // const decode   = {email: 'test@gmail.com', password: '12345'};
      // jest.spyOn(service, "parseBasicToken").mockReturnValue(decode);

      const result = await service.parseBasicToken(rawToken);
      expect(result).toEqual(decode);
    });
    it('should throw an error for invalid token format', () => {
      const rawToken = 'InvalidTokenFormat';
      // promise면 rejects인데 아니면 람다식으로 정의해야함
      expect(() => service.parseBasicToken(rawToken)).toThrow(BadRequestException);
    });
    it('should throw an error for invalid Basic Token format', () => {
      const rawToken = 'basicc InvalidTokenFormat';
      // promise면 rejects인데 아니면 람다식으로 정의해야함
      expect(() => service.parseBasicToken(rawToken)).toThrow(BadRequestException);
    });
    it('should throw an decode error for invalid Basic Token format', () => {
      const rawToken = 'basic InvalidTokenFormat';
      // promise면 rejects인데 아니면 람다식으로 정의해야함
      expect(() => service.parseBasicToken(rawToken)).toThrow(BadRequestException);
    });
  });

  describe("register", () => {
    it('should register', async() => {
      const rawToken = 'Basic dGVzdEBnbWFpbC5jb206MTIzNA==';
      const user     = {
        email: 'test@gmail.com',
        password: '1234'
      };

      jest.spyOn(service, "parseBasicToken").mockReturnValue(user);
      jest.spyOn(mockUserService, "create").mockResolvedValue(user);

      const result = await service.register(rawToken);
      expect(service.parseBasicToken).toHaveBeenCalledWith(rawToken);
      expect(result).toEqual(user);
    });
  });

  describe("authenticate", () => {
    it('should authenticate a user with correct info', async() => {
      const user = {
        email: 'test@gmail.com',
        password: '1234'
      };

      jest.spyOn(mockUserRepository, "findOne").mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation((a, b) => true);

      const result = await service.authenticate(user.email, user.password);

      expect(userRepository.findOne).toHaveBeenCalledWith({where: {email: user.email}});
      expect(bcrypt.compare).toHaveBeenCalledWith(user.password, user.password);
      expect(result).toEqual(user);
    });

    it('should throw an error for not existing user', async() => {
      const user = {
        email: 'test@gmail.com',
        password: '1234'
      };

      jest.spyOn(mockUserRepository, "findOne").mockResolvedValue(null);

      expect(service.authenticate(user.email, user.password)).rejects.toThrow(BadRequestException);
      expect(userRepository.findOne).toHaveBeenCalled();
    });

    it('should throw an error for not valify compare', async() => {
      const user = {
        email: 'test@gmail.com',
        password: '1234'
      };

      jest.spyOn(mockUserRepository, "findOne").mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation((a, b) => false);

      expect(service.authenticate(user.email, user.password)).rejects.toThrow(BadRequestException);
      expect(userRepository.findOne).toHaveBeenCalled();
    });
  });

  describe("issueToken", () => {
    const secret = 'secret';
    const token  = 'token';
    const user = {
      id: 1,
      role: Role.admin
    };

    beforeEach(() => {
      jest.spyOn(mockConfigService, 'get').mockReturnValue(secret);
      jest.spyOn(mockJwtService, 'signAsync').mockReturnValue(token);
    });

    it('should issue an access token', async() => {
      const isRefreshToken = false;
      const result = await service.issueToken(user, isRefreshToken);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: user.id,
          role: user.role,
          type: isRefreshToken ? 'refresh' : 'access'
        },
        {
          secret: secret,
          expiresIn: 30000 // 300초 5분
        }
      );
      expect(result).toEqual(token);
    });

    it('should issue an refresh token', async() => {
      const isRefreshToken = true;
      const result = await service.issueToken(user, isRefreshToken);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        {
          sub: user.id,
          role: user.role,
          type: isRefreshToken ? 'refresh' : 'access'
        },
        {
          secret: secret,
          expiresIn: '24h' // 300초 5분
        }
      );
      expect(result).toEqual(token);
    });
  });

  describe("login", () => {
    it('should login', async() => {
      const rawToken = 'Basic dGVzdEBnbWFpbC5jb206MTIzNA==';
      const user     = {
        email: 'test@gmail.com',
        password: '1234'
      };
      const payload = {
        refreshToken: "mockToken",
        accessToken: "mockToken",
      }

      jest.spyOn(service, "parseBasicToken").mockReturnValue(user);
      jest.spyOn(service, "authenticate").mockResolvedValue(user as User);
      jest.spyOn(service, "issueToken").mockResolvedValue(payload.refreshToken);

      const result = await service.login(rawToken);

      expect(service.parseBasicToken).toHaveBeenCalledWith(rawToken);
      expect(service.authenticate).toHaveBeenCalledWith(user.email, user.password);
      expect(service.issueToken).toHaveBeenCalledTimes(2);
      expect(result).toEqual(payload);
    });
  });
});
