import { Test, TestingModule } from '@nestjs/testing';
import { DirectorService } from './director.service';
import { DeleteResult, Repository } from 'typeorm';
import { Director } from './entity/director.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';
import { NotFoundException } from '@nestjs/common';

const mockDirectorRepository = {
  save: jest.fn(),
  find: jest.fn(),
  findOne: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}

describe('DirectorService', () => {
  let service: DirectorService;
  let repository: Repository<Director>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DirectorService,
        {
          provide: getRepositoryToken(Director),
          useValue: mockDirectorRepository,
        }
      ],
    }).compile();

    service = module.get<DirectorService>(DirectorService);
    repository = module.get<Repository<Director>>(getRepositoryToken(Director));
  });

  beforeAll(() => {
    jest.clearAllMocks();
  })

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe("create", () => {
    it('shoule create a new director', async() => {
      const createDirectorDto: CreateDirectorDto = {
        name: 'director name',
        dob: new Date(),
        nationality: 'korea'
      };

      jest.spyOn(repository, 'save').mockResolvedValue(createDirectorDto as Director);

      const result = await service.create(createDirectorDto);

      expect(repository.save).toHaveBeenCalled();
      expect(repository.save).toHaveBeenCalledWith(createDirectorDto);
      expect(result).toEqual(createDirectorDto);
    });
  });
  
  describe("findAll", () => {
    it('shoule findAll directors', async() => {
      const directors = [
        {
          id: 1,
          name: 'director name'
        }
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(directors as Director[]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalled();
      expect(result).toEqual(directors);
    });
  });

  describe("findOne", () => {
    it('shoule findOne director', async() => {
      const director = {
        id: 1,
        name: 'director name'
      }

      jest.spyOn(repository, 'findOne').mockResolvedValue(director as Director);

      const result = await service.findOne(director.id);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: director.id
        }
      });
      expect(result).toEqual(director);
    });
  });

  describe("update", () => {
    const updateDirectorDto: UpdateDirectorDto = {
      name: 'director name',
      dob: new Date(),
      nationality: 'korea'
    };
    const existingDirector = {
      id: 1,
      name: 'director name'
    };
    const updatedDirector = {
      id: 1,
      name: 'director name 2'
    };

    it('shoule update director', async() => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(existingDirector as Director);
      jest.spyOn(repository, 'findOne').mockResolvedValue(updatedDirector as Director);

      const result = await service.update(existingDirector.id, updateDirectorDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: existingDirector.id
        }
      });
      expect(repository.update).toHaveBeenCalledWith(
        {
          id: existingDirector.id
        },
        {
          ...updateDirectorDto
        }
      );
      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: existingDirector.id
        }
      });
      expect(result).toEqual(updatedDirector);
    });

    it('should throw NotFoundException', async() => {
      jest.spyOn(repository, "findOne").mockResolvedValue(null);
  
      expect(service.update(existingDirector.id, updateDirectorDto)).rejects.toThrow(NotFoundException);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: existingDirector.id
        }
      });
    });
  });

  describe('remove', () => {
    const director = {
      id: 1,
      name: 'director name'
    };
    it('should remove a director by id', async() => {
      jest.spyOn(repository, "findOne").mockResolvedValue(director as Director);
      jest.spyOn(repository, "delete").mockResolvedValue(null);

      const result = await service.remove(director.id);

      expect(repository.findOne).toHaveBeenCalledWith({where: {id: director.id}});
      expect(repository.delete).toHaveBeenCalledWith(director.id);
      expect(result).toEqual(director.id);
    });

    it('should throw NotFoundException', async() => {
      jest.spyOn(repository, "findOne").mockResolvedValue(null);
  
      expect(service.remove(director.id)).rejects.toThrow(NotFoundException);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: director.id
        }
      });
    });
  });

});
