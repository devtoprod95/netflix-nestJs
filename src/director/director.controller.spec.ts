import { Test, TestingModule } from '@nestjs/testing';
import { DirectorController } from './director.controller';
import { DirectorService } from './director.service';
import { Director } from './entity/director.entity';
import { CreateDirectorDto } from './dto/create-director.dto';
import { UpdateDirectorDto } from './dto/update-director.dto';

const mockDirectorService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn()
}

describe('DirectorController', () => {
  let controller: DirectorController;
  let service: DirectorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DirectorController],
      providers: [
        {
          provide: DirectorService,
          useValue: mockDirectorService
        }
      ],
    }).compile();

    controller = module.get<DirectorController>(DirectorController);
    service    = module.get<DirectorService>(DirectorService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => { 
    it('should call findAll method', async() => {
      const directors = [
        {
          id: 1,
          name: 'test'
        }
      ];
      jest.spyOn(service, 'findAll').mockResolvedValue(directors as Director[]);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(directors);
    });
  });

  describe('findOne', () => { 
    it('should call findOne method', async() => {
      const director = {
        id: 1,
        name: 'test'
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(director as Director);

      const result = await controller.findOne(director.id);

      expect(service.findOne).toHaveBeenCalled();
      expect(service.findOne).toHaveBeenCalledWith(director.id)
      expect(result).toEqual(director);
    });
  });

  describe('create', () => { 
    it('should call create method', async() => {
      const createDirectorDto: CreateDirectorDto = {
        name: 'test',
        dob: new Date,
        nationality: 'korea'
      };
      jest.spyOn(service, 'create').mockResolvedValue(createDirectorDto as Director);

      const result = await controller.create(createDirectorDto);

      expect(service.create).toHaveBeenCalledWith(createDirectorDto)
      expect(result).toEqual(createDirectorDto);
    });
  });

  describe('update', () => { 
    it('should call update method', async() => {
      const id = 1;
      const updateDirectorDto: UpdateDirectorDto = {
        name: 'test',
        dob: new Date,
        nationality: 'korea'
      };
      jest.spyOn(service, 'update').mockResolvedValue(updateDirectorDto as Director);

      const result = await controller.update(id, updateDirectorDto);

      expect(service.update).toHaveBeenCalledWith(id, updateDirectorDto)
      expect(result).toEqual(updateDirectorDto);
    });
  });

  describe('remove', () => { 
    it('should call remove method', async() => {
      const id = 1;
      jest.spyOn(service, 'remove').mockResolvedValue(id);

      const result = await controller.remove(id);

      expect(service.remove).toHaveBeenCalledWith(id);
      expect(result).toEqual(id);
    });
  });

});
