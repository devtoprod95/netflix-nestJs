import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { Role, User } from 'src/user/entity/user.entity';

const mockAuthService = {
  register: jest.fn(),
  login: jest.fn(),
  issueToken: jest.fn(),
  tokenBlock: jest.fn(),
}

describe('AuthController', () => {
  let controller: AuthController;
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService
        }
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
    service = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  })

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('registerUser', () => {
    it('should register a user', async() => {
      const token = 'Basic dGVzdEBnbWFpbC5jb206MTIzNA==';
      const user = {
        id: 1,
        email: "test@gmail.com",
        password: "test1234"
      }

      jest.spyOn(service, "register").mockResolvedValue(user as User);

      const result = await controller.registerUser(token);

      expect(service.register).toHaveBeenCalledWith(token);
      expect(result).toEqual(user);
    });
  });

  describe('login', () => {
    it('should login a user', async() => {
      const token = 'Basic dGVzdEBnbWFpbC5jb206MTIzNA==';
      const mockToken = {
        refreshToken: token,
        accessToken: token,
      }

      jest.spyOn(service, "login").mockResolvedValue(mockToken);

      const result = await controller.loginUser(token);

      expect(service.login).toHaveBeenCalledWith(token);
      expect(result).toEqual(mockToken);
    });
  });

  describe('tokenAccess', () => {
    it('should tokenAccess a user', async() => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const param = {user: token}
      
      jest.spyOn(service, "issueToken").mockResolvedValue(token);

      const result = await controller.retateAccessToken(param);

      expect(service.issueToken).toHaveBeenCalled();
      expect(service.issueToken).toHaveBeenCalledWith(token, false);
      expect(result).toEqual({accessToken: token});
    });
  });

  describe('loginPassportLocal', () => {
    it('should loginPassportLocal a user', async() => {
      const user = {
        id: 1,
        role: Role.user
      };
      const param        = {user};
      const accessToken  = 'mock.access.token';
      const refreshToken = 'mock.refresh.token';
      
      jest.spyOn(service, "issueToken")
        .mockResolvedValueOnce(refreshToken)
        .mockResolvedValueOnce(accessToken);

      const result = await controller.loginUserPassportLocal(param);

      expect(service.issueToken).toHaveBeenCalledTimes(2);
      expect(service.issueToken).toHaveBeenNthCalledWith(1, user, true);
      expect(service.issueToken).toHaveBeenNthCalledWith(2, user, false);
      expect(result).toEqual({user, refreshToken, accessToken});
    });
  });
});
