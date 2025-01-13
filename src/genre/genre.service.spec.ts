import { Test, TestingModule } from '@nestjs/testing';
import { GenreService } from './genre.service';
import { Repository } from 'typeorm';
import { Genre } from './entity/genre.entity';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CreateGenreDto } from './dto/create-genre.dto';
import { NotFoundException } from '@nestjs/common';
import { UpdateGenreDto } from './dto/update-genre.dto';

const mockGenreRepository = {
  save   : jest.fn(),
  find   : jest.fn(),
  findOne: jest.fn(),
  update : jest.fn(),
  delete : jest.fn()
}

describe('GenreService', () => {
  let service   : GenreService;
  let repository: Repository<Genre>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenreService,
        {
          provide: getRepositoryToken(Genre),
          useValue: mockGenreRepository
        }
      ],
    }).compile();

    service    = module.get<GenreService>(GenreService);
    repository = module.get<Repository<Genre>>(getRepositoryToken(Genre));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  afterAll(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    const createGenreDto: CreateGenreDto = {
      name: 'tenre2'
    };
    const genre = {
      id: 1,
      ...createGenreDto
    };

    it('should create', async() => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(null);
      jest.spyOn(repository, 'save').mockResolvedValue(genre as Genre);

      const result = await service.create(createGenreDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          name: createGenreDto.name
        }
      });
      expect(repository.save).toHaveBeenCalledWith(createGenreDto);
      expect(result).toEqual(genre);
    });
    
    it('should create error', async() => {
      jest.spyOn(repository, 'findOne').mockResolvedValue(genre as Genre);
      
      expect(service.create(createGenreDto)).rejects.toThrow(NotFoundException);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          name: createGenreDto.name
        }
      });
    });
  });

  describe('findAll', () => {
    it('should findAll', async() => {
      const genres = [
        {
          id: 1,
          name: 'genre1'
        },
        {
          id: 2,
          name: 'genre2'
        }
      ];

      jest.spyOn(repository, 'find').mockResolvedValue(genres as Genre[]);

      const result = await service.findAll('test');

      expect(result).toEqual(genres);
      expect(repository.find).toHaveBeenCalled();
    });
  });

  describe('findOne', () => {
    it('should findOne', async() => {
      const genre = {
        id: 1,
        name: 'genre1'
      };

      jest.spyOn(repository, 'findOne').mockResolvedValue(genre as Genre);

      const result = await service.findOne(genre.id);

      expect(result).toEqual(genre);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: genre.id
        }
      });
    });
  });

  describe('update', () => {
    const updateGenreDto: UpdateGenreDto = {
      name: 'genreChange'
    };
    const existingGenre = {
      id: 1,
      name: 'ganreOrigin'
    };
    const updateGenre = {
      id: 1,
      ...updateGenreDto
    };
    it('should update', async() => {
      jest.spyOn(repository, 'findOne')
        .mockResolvedValue(existingGenre as Genre)
        .mockResolvedValue(updateGenre as Genre);

      const result = await service.update(existingGenre.id, updateGenreDto);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: existingGenre.id
        }
      });
      expect(repository.update).toHaveBeenCalledWith({id: updateGenre.id}, updateGenreDto);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: updateGenre.id
        }
      });
      expect(result).toEqual(updateGenre);
    });

    it('should update error', async() => {
      jest.spyOn(repository, 'findOne')
        .mockResolvedValue(null);

      expect(service.update(existingGenre.id, updateGenreDto)).rejects.toThrow(NotFoundException);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: existingGenre.id
        }
      });
    });
  });

  describe('remove', () => {
    const genre = {
      id: 1
    };
    it('should remove', async() => {
      jest.spyOn(repository, 'findOne')
        .mockResolvedValue(genre as Genre);

      const result = await service.remove(genre.id);

      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: genre.id
        }
      });
      expect(repository.delete).toHaveBeenCalledWith(genre.id);
      expect(result).toEqual(genre.id);
    });

    it('should remove error', async() => {
      jest.spyOn(repository, 'findOne')
        .mockResolvedValue(null);

      expect(service.remove(genre.id)).rejects.toThrow(NotFoundException);
      expect(repository.findOne).toHaveBeenCalledWith({
        where: {
          id: genre.id
        }
      });
    });
  });

});
