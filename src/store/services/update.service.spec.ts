import { updatedResults } from '@/baseHelper/update';
import type { GetStoreDto } from '@/storeDto/store.dto';
import { Store } from '@/storeEntities/store.entity';
import { UpdateService } from '@/storeServices/update.service';
import {
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { randomUUID } from 'crypto';

jest.mock('@/baseHelper/update', () => ({
  updatedResults: jest.fn(),
}));

describe('UpdateService', () => {
  let service: UpdateService;

  let mockStoreRepository: {
    create: jest.Mock;
    update: jest.Mock;
    findOneOrFail: jest.Mock;
    findOne: jest.Mock;
  };

  const mockStoreId = randomUUID();
  const mockStore: GetStoreDto = {
    id: mockStoreId,
    name: 'Old Store',
    code: 'ST-01',
    viewCode: 'V-01',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockStoreRepository = {
      create: jest.fn(),
      update: jest.fn(),
      findOneOrFail: jest.fn(),
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateService,
        {
          provide: getRepositoryToken(Store),
          useValue: mockStoreRepository,
        },
      ],
    }).compile();

    service = module.get<UpdateService>(UpdateService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    it('should successfully update a store when data is valid and unique', async () => {
      const updateDto = {
        name: 'Updated Store',
        code: 'ST-02',
        viewCode: 'V-02',
      };
      const mockUpdateResult = { affected: 1 };

      mockStoreRepository.findOneOrFail.mockResolvedValue(mockStore);
      mockStoreRepository.findOne.mockResolvedValue(null);
      mockStoreRepository.create.mockReturnValue(updateDto);
      mockStoreRepository.update.mockResolvedValue(mockUpdateResult);
      (updatedResults as jest.Mock).mockReturnValue(true);

      const result = await service.update({ updateDto, store: mockStore });

      expect(result).toBe(true);
      expect(mockStoreRepository.findOne).toHaveBeenCalledWith({
        where: {
          name: 'Updated Store',
          code: 'ST-02',
          viewCode: 'V-02',
          id: expect.any(Object),
        },
      });
      expect(mockStoreRepository.update).toHaveBeenCalledWith(
        mockStoreId,
        updateDto,
      );
      expect(updatedResults).toHaveBeenCalledWith(mockUpdateResult);
    });

    it('should skip duplicate entity parsing if updated values match current state fields exactly', async () => {
      const updateDto = { name: 'Old Store' };

      mockStoreRepository.findOneOrFail.mockResolvedValue(mockStore);
      mockStoreRepository.findOne.mockResolvedValue(null);
      mockStoreRepository.update.mockResolvedValue({ affected: 1 });
      (updatedResults as jest.Mock).mockReturnValue(true);

      await service.update({ updateDto, store: mockStore });

      expect(mockStoreRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: expect.any(Object),
        },
      });
    });

    it('should throw ConflictException if unique constraints are broken by another record', async () => {
      const updateDto = { name: 'Old Store', code: 'ST-02', viewCode: 'V-01' };

      mockStoreRepository.findOneOrFail.mockResolvedValue(mockStore);
      mockStoreRepository.findOne.mockResolvedValue({
        id: randomUUID(),
        name: 'Old Store',
        code: 'ST-02',
        viewCode: 'V-01',
      });

      await expect(
        service.update({ updateDto, store: mockStore }),
      ).rejects.toThrow(ConflictException);

      expect(mockStoreRepository.update).not.toHaveBeenCalled();
    });

    it('should throw UnprocessableEntityException if updateDto lacks target payload parameters', async () => {
      const updateDto = {};

      mockStoreRepository.findOneOrFail.mockResolvedValue(mockStore);

      await expect(
        service.update({ updateDto, store: mockStore }),
      ).rejects.toThrow(UnprocessableEntityException);

      expect(mockStoreRepository.findOne).not.toHaveBeenCalled();
      expect(mockStoreRepository.update).not.toHaveBeenCalled();
    });
  });
});
