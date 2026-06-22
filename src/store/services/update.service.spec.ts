import { updatedResults } from '@/base/helper/update';
import { Store } from '@/storeEntities/store.entity';
import { UpdateService } from '@/storeServices/update.service'; // Adjust path
import {
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { randomUUID } from 'crypto';

jest.mock('@/base/helper/update', () => ({
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
      const mockExistingStore = {
        id: mockStoreId,
        name: 'Old Store',
        code: 'ST-01',
        viewCode: 'V-01',
      };
      const mockUpdateResult = { affected: 1 };

      mockStoreRepository.findOneOrFail.mockResolvedValue(mockExistingStore);
      mockStoreRepository.findOne.mockResolvedValue(null); // No conflicts found
      mockStoreRepository.create.mockReturnValue(updateDto);
      mockStoreRepository.update.mockResolvedValue(mockUpdateResult);
      (updatedResults as jest.Mock).mockReturnValue(true);

      const result = await service.update({ updateDto, id: mockStoreId });

      expect(result).toBe(true);
      expect(mockStoreRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: mockStoreId },
      });
      expect(mockStoreRepository.findOne).toHaveBeenCalledWith({
        where: {
          name: 'Updated Store',
          code: 'ST-02',
          viewCode: 'V-02',
          id: expect.any(Object),
        },
      });
      expect(mockStoreRepository.create).toHaveBeenCalledWith(updateDto);
      expect(mockStoreRepository.update).toHaveBeenCalledWith(
        mockStoreId,
        updateDto,
      );
      expect(updatedResults).toHaveBeenCalledWith(mockUpdateResult);
    });

    it('should skip duplicate entity parsing if updated values match current state fields exactly', async () => {
      const updateDto = { name: 'Old Store' };
      const mockExistingStore = {
        id: mockStoreId,
        name: 'Old Store',
        code: 'ST-01',
        viewCode: 'V-01',
      };

      mockStoreRepository.findOneOrFail.mockResolvedValue(mockExistingStore);
      mockStoreRepository.findOne.mockResolvedValue(null);
      mockStoreRepository.update.mockResolvedValue({ affected: 1 });
      (updatedResults as jest.Mock).mockReturnValue(true);

      await service.update({ updateDto, id: mockStoreId });

      expect(mockStoreRepository.findOne).toHaveBeenCalledWith({
        where: {
          id: expect.any(Object),
        },
      });
    });

    it('should throw ConflictException if unique constraints are broken by another record', async () => {
      const updateDto = { name: 'Old Store', code: 'ST-02', viewCode: 'V-01' };
      const mockExistingStore = {
        id: mockStoreId,
        name: 'Old Store',
        code: 'ST-01',
        viewCode: 'V-01',
      };

      mockStoreRepository.findOneOrFail.mockResolvedValue(mockExistingStore);
      mockStoreRepository.findOne.mockResolvedValue({
        id: randomUUID(),
        name: 'Old Store',
        code: 'ST-02',
        viewCode: 'V-01',
      });

      await expect(
        service.update({ updateDto, id: mockStoreId }),
      ).rejects.toThrow(ConflictException);

      expect(mockStoreRepository.update).not.toHaveBeenCalled();
    });

    it('should throw UnprocessableEntityException if updateDto lacks target payload parameters', async () => {
      const updateDto = {}; // Empty payload structure layout validation constraint test
      const mockExistingStore = { id: mockStoreId, name: 'Old Store' };

      mockStoreRepository.findOneOrFail.mockResolvedValue(mockExistingStore);

      await expect(
        service.update({ updateDto, id: mockStoreId }),
      ).rejects.toThrow(UnprocessableEntityException);

      expect(mockStoreRepository.findOne).not.toHaveBeenCalled();
      expect(mockStoreRepository.update).not.toHaveBeenCalled();
    });
  });
});
