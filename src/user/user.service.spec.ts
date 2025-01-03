import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

const mockUserRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
}

const mockConfigService = {
  get: jest.fn()
}

describe('UserService', () => {
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        }
      ],
    }).compile();

    service = module.get<UserService>(UserService); 
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it('should create a new user and return it', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@gmail.com',
        password: '123'
      };
      const hashRound      = 10;
      const hashedPassword = 'fdafdafda';

      const result = {
        id: 1,
        email: createUserDto.email,
        password: hashedPassword
      };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(null);
      jest.spyOn(mockConfigService, 'get').mockReturnValue(hashRound);
      jest.spyOn(bcrypt, 'hash').mockImplementation((password, hashRound) => hashedPassword);
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(result);

      const createdUser = await service.create(createUserDto);
      expect(createdUser).toEqual(result);
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(1, {where: {email: createUserDto.email}});
      expect(mockUserRepository.findOne).toHaveBeenNthCalledWith(2, {where: {email: createUserDto.email}});
      expect(mockConfigService.get).toHaveBeenCalledWith(expect.anything());
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, hashRound);
      expect(mockUserRepository.save).toHaveBeenCalledWith({
        email: createUserDto.email,
        password: hashedPassword
      });
    });

    it('should throw a BadRequestException if user is not found', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@gmail.com',
        password: '123'
      };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(createUserDto);

      expect(service.create(createUserDto)).rejects.toThrow(BadRequestException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          email: createUserDto.email
        }
      });
    });
  });

  describe("findAll", () => {
    it('should return all users', async () => {
      const users = [
        {
          id: 1,
          email: 'test@gmail.com'
        }
      ];
      mockUserRepository.find.mockReturnValue(users);

      const result = await service.findAll();

      expect(result).toEqual(users);
      expect(mockUserRepository.find).toHaveBeenCalled();
      
    });
  });

  describe("findOne", () => {
    it('should return a user by id', async () => {
      const user = {
        id: 1,
        email: 'test@gmail.com'
      };

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(user);

      const result = await service.findOne(user.id);

      expect(result).toEqual(user);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: 1
        }
      });
    });

    it('should throw a NotFoundException if user is not found', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      const id = 7;
      expect(service.findOne(id)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id
        }
      });
    });
  });

  describe("update", () => {
    it('should update a user if it exists and return the updated user', async () => {
      const updateUserDto: UpdateUserDto = {
        email: 'test@gmail.com',
        password: "123"
      };
      const hashRound = 10;
      const hashedPassword = "123sddss";
      const user = {
        id: 1,
        email: updateUserDto.email
      }

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce(user);
      jest.spyOn(mockConfigService, 'get').mockReturnValue(hashRound);
      jest.spyOn(bcrypt, 'hash').mockImplementation((password, hashRound) => hashedPassword);
      jest.spyOn(mockUserRepository, 'update').mockResolvedValue(undefined);
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValueOnce({
        ...user,
        password: hashedPassword
      });

      const result = await service.update(user.id, updateUserDto);

      expect(result).toEqual({
        ...user,
        password: hashedPassword
      });
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: user.id
        }
      });
      expect(mockConfigService.get).toHaveBeenCalledWith(expect.anything());
      expect(bcrypt.hash).toHaveBeenCalledWith(updateUserDto.password, hashRound);
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        {
          id: user.id
        },
        {
          ...updateUserDto,
          password: hashedPassword
        }
      );
    });

    it('should throw a NotFoundException if user to update is not found', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      const id = 999;
      const updateUserDto: UpdateUserDto = {
        email: "test@gmail.com",
        password: "123sss"
      };

      expect(service.update(id, updateUserDto)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id
        }
      });
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

  });

  describe("remove", () => {
    it('should delete a user by id', async () => {
      const id = 999;

      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue({
        id
      });

      const result = await service.remove(id);

      expect(result).toEqual(id);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id
        }
      });
    });

    it('should throw a NotFoundException if user to delete is not found', async () => {
      jest.spyOn(mockUserRepository, 'findOne').mockResolvedValue(null);

      const id = 999;
      expect(service.remove(id)).rejects.toThrow(NotFoundException);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          id
        }
      });
    });
  });
});
