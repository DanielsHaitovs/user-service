import { Store } from '@/storeEntities/store.entity';
import { StoreHelperService } from '@/storeServices/helper.service';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { randomUUID } from 'crypto';

describe('StoreHelperService', () => {
  let service: StoreHelperService;

  const mockRepository = {
    find: jest.fn(),
  };

  const randomIds = [randomUUID(), randomUUID()];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StoreHelperService,
        {
          provide: getRepositoryToken(Store),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<StoreHelperService>(StoreHelperService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('checkIfManyExistOrThrow', () => {
    it('should throw UnprocessableEntityException if ids are undefined', async () => {
      await expect(service.checkIfManyExistOrThrow()).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should throw UnprocessableEntityException if ids array is empty', async () => {
      await expect(service.checkIfManyExistOrThrow([])).rejects.toThrow(
        UnprocessableEntityException,
      );
    });

    it('should return found IDs if all stores exist', async () => {
      // const ids = ['uuid-1', 'uuid-2'] as UUID[];
      mockRepository.find.mockResolvedValue(randomIds.map((id) => ({ id })));

      const result = await service.checkIfManyExistOrThrow(randomIds);

      expect(result).toEqual(randomIds);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { id: expect.any(Object) }, // Checks for In() operator
        select: ['id'],
      });
    });

    it('should throw UnprocessableEntityException if some stores are missing', async () => {
      const randomId = randomUUID();

      mockRepository.find.mockResolvedValue([{ id: randomId }]);

      await expect(service.checkIfManyExistOrThrow(randomIds)).rejects.toThrow(
        UnprocessableEntityException,
      );
    });
  });
});
