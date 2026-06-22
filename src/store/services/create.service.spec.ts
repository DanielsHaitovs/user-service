import { Store } from '@/storeEntities/store.entity';
import { CreateService } from '@/storeServices/create.service'; // Adjust path
import {
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('CreateService', () => {
  let service: CreateService;

  const mockQueryBuilder = {
    orWhere: jest.fn().mockReturnThis(),
    getMany: jest.fn(),
  };

  const mockRepository = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => mockQueryBuilder),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateService,
        {
          provide: getRepositoryToken(Store),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<CreateService>(CreateService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a store successfully', async () => {
      const createDto = { name: 'Store A', code: 'A1', viewCode: 'V1' };
      const userId = '123e4567-e89b-12d3-a456-426614174000' as any;

      mockQueryBuilder.getMany.mockResolvedValue([]);
      mockRepository.create.mockReturnValue({ ...createDto });
      mockRepository.save.mockResolvedValue({ id: 'new-id', ...createDto });

      const result = await service.create({ createDto, createdById: userId });

      expect(mockRepository.save).toHaveBeenCalled();
      expect(result.id).toBe('new-id');
    });

    it('should throw ConflictException if store already exists', async () => {
      const createDto = { name: 'Store A', code: 'A1', viewCode: 'V1' };

      mockQueryBuilder.getMany.mockResolvedValue([{}]);

      await expect(
        service.create({ createDto, createdById: 'some-uuid' as any }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw UnprocessableEntityException if no fields provided', async () => {
      const createDto = {} as any;

      await expect(
        service.create({ createDto, createdById: 'some-uuid' as any }),
      ).rejects.toThrow(UnprocessableEntityException);
    });
  });
});
