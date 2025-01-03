import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './entity/user.entity';
import { mock } from 'node:test';
import { NotFoundException } from '@nestjs/common';

const mockUserRepository = {
  findOne: jest.fn(),
  save: jest.fn(),
  find: jest.fn(),
  update: jest.fn(),
  delete: jest.fn()
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
        }
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
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
});
