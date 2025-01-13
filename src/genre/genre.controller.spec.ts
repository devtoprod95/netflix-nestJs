import { Test, TestingModule } from '@nestjs/testing';
import { GenreController } from './genre.controller';
import { GenreService } from './genre.service';
import { Genre } from './entity/genre.entity';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';

const mockGenreService = {
  findAll: jest.fn(),
  findOne: jest.fn(),
  create : jest.fn(),
  update : jest.fn(),
  remove : jest.fn()
}

describe('GenreController', () => {
  let controller: GenreController;
  let service: GenreService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [GenreController],
      providers: [
        {
          provide: GenreService,
          useValue: mockGenreService
        }
      ],
    }).compile();

    controller = module.get<GenreController>(GenreController);
    service    = module.get<GenreService>(GenreService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('findAll', () => { 
    it('should call findAll method', async() => {
      const genres = [
        {
          id: 1,
          name: 'test'
        }
      ];
      jest.spyOn(service, 'findAll').mockResolvedValue(genres as Genre[]);

      const result = await controller.getMovies();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual(genres);
    });
  });

  describe('findOne', () => { 
    it('should call findOne method', async() => {
      const genre = {
        id: 1,
        name: 'test'
      };
      jest.spyOn(service, 'findOne').mockResolvedValue(genre as Genre);

      const result = await controller.getMovie(genre.id);

      expect(service.findOne).toHaveBeenCalledWith(genre.id);
      expect(result).toEqual(genre);
    });
  });

  describe('create', () => { 
    it('should call create method', async() => {
      const createGenreDto: CreateGenreDto = {
        name: 'test'
      };
      const genre = {
        id: 1,
        ...createGenreDto
      }
      jest.spyOn(service, 'create').mockResolvedValue(genre as Genre);

      const result = await controller.postMovie(createGenreDto);

      expect(service.create).toHaveBeenCalledWith(createGenreDto);
      expect(result).toEqual(genre);
    });
  });

  describe('update', () => { 
    it('should call update method', async() => {
      const updateGenreDto: UpdateGenreDto = {
        name: 'test'
      };
      const genre = {
        id: 1,
        ...updateGenreDto
      }
      jest.spyOn(service, 'update').mockResolvedValue(genre as Genre);

      const result = await controller.patchMovie(genre.id, updateGenreDto);

      expect(service.update).toHaveBeenCalledWith(genre.id, updateGenreDto);
      expect(result).toEqual(genre);
    });
  });

  describe('delete', () => { 
    it('should call delete method', async() => {
      const genre = {
        id: 1,
      }
      jest.spyOn(service, 'remove').mockResolvedValue(genre.id);

      const result = await controller.deleteMovie(genre.id);

      expect(service.remove).toHaveBeenCalledWith(genre.id);
      expect(result).toEqual(genre.id);
    });
  });

});
