import { deletedResults } from '@/base/helper/delete';
import { pgErrorStatusCodes } from '@/commonConst/database.const';
import { Store } from '@/storeEntities/store.entity';
import { DeleteService } from '@/storeServices/delete.service';
import { StoreHelperService } from '@/storeServices/helper.service';
import { UserStores } from '@/userEntities/userStores.entity';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { randomUUID } from 'crypto';
import { QueryFailedError } from 'typeorm';

jest.mock('@/base/helper/delete', () => ({
  deletedResults: jest.fn(),
}));

describe('DeleteService', () => {
  let service: DeleteService;

  let mockStoreRepository: {
    delete: jest.Mock;
  };

  let mockUserStoreRepository: {
    find: jest.Mock;
    delete: jest.Mock;
  };

  let mockStoreHelperService: {
    checkIfManyExistOrThrow: jest.Mock;
  };

  const mockStoreId = randomUUID();

  beforeEach(async () => {
    mockStoreRepository = {
      delete: jest.fn(),
    };

    mockUserStoreRepository = {
      find: jest.fn(),
      delete: jest.fn(),
    };

    mockStoreHelperService = {
      checkIfManyExistOrThrow: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteService,
        {
          provide: getRepositoryToken(Store),
          useValue: mockStoreRepository,
        },
        {
          provide: getRepositoryToken(UserStores),
          useValue: mockUserStoreRepository,
        },
        {
          provide: StoreHelperService,
          useValue: mockStoreHelperService,
        },
      ],
    }).compile();

    service = module.get<DeleteService>(DeleteService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('delete', () => {
    it('should successfully delete an unassigned store', async () => {
      mockStoreHelperService.checkIfManyExistOrThrow.mockResolvedValue([
        mockStoreId,
      ]);
      mockUserStoreRepository.find.mockResolvedValue([]);
      mockStoreRepository.delete.mockResolvedValue({ affected: 1 });
      (deletedResults as jest.Mock).mockReturnValue(true);

      const result = await service.delete({
        id: mockStoreId,
        canDeleteAssignedStore: false,
      });

      expect(result).toBe(true);
      expect(
        mockStoreHelperService.checkIfManyExistOrThrow,
      ).toHaveBeenCalledWith([mockStoreId]);
      expect(mockUserStoreRepository.find).toHaveBeenCalledWith({
        where: { store: { id: mockStoreId } },
        take: 1,
        skip: 0,
      });
      expect(mockUserStoreRepository.delete).not.toHaveBeenCalled();
      expect(mockStoreRepository.delete).toHaveBeenCalledWith(mockStoreId);
      expect(deletedResults).toHaveBeenCalledWith({ affected: 1 });
    });

    it('should unassign from users and delete successfully if canDeleteAssignedStore is true', async () => {
      mockStoreHelperService.checkIfManyExistOrThrow.mockResolvedValue([
        mockStoreId,
      ]);
      mockUserStoreRepository.find.mockResolvedValue([{ id: 'assignment-id' }]);
      mockUserStoreRepository.delete.mockResolvedValue({ affected: 1 });
      mockStoreRepository.delete.mockResolvedValue({ affected: 1 });
      (deletedResults as jest.Mock).mockReturnValue(true);

      const result = await service.delete({
        id: mockStoreId,
        canDeleteAssignedStore: true,
      });

      expect(result).toBe(true);
      expect(mockUserStoreRepository.delete).toHaveBeenCalledWith({
        store: { id: mockStoreId },
      });
      expect(mockStoreRepository.delete).toHaveBeenCalledWith(mockStoreId);
    });

    it('should throw UnprocessableEntityException if store is assigned to users and canDeleteAssignedStore is false', async () => {
      mockStoreHelperService.checkIfManyExistOrThrow.mockResolvedValue([
        mockStoreId,
      ]);
      mockUserStoreRepository.find.mockResolvedValue([{ id: 'assignment-id' }]);

      await expect(
        service.delete({ id: mockStoreId, canDeleteAssignedStore: false }),
      ).rejects.toThrow(UnprocessableEntityException);

      expect(mockUserStoreRepository.delete).not.toHaveBeenCalled();
      expect(mockStoreRepository.delete).not.toHaveBeenCalled();
    });

    it('should catch database foreign key violation and throw UnprocessableEntityException', async () => {
      mockStoreHelperService.checkIfManyExistOrThrow.mockResolvedValue([
        mockStoreId,
      ]);
      mockUserStoreRepository.find.mockResolvedValue([]);

      const dbError = new QueryFailedError(
        'DELETE FROM store...',
        [],
        new Error('foreign key constraint violation'),
      );

      (dbError as any).code = pgErrorStatusCodes.FOREIGN_KEY_VIOLATION;

      mockStoreRepository.delete.mockRejectedValue(dbError);

      await expect(
        service.delete({ id: mockStoreId, canDeleteAssignedStore: false }),
      ).rejects.toThrow(UnprocessableEntityException);
    });

    it('should propagate generic errors uncaught by specific db exception filters', async () => {
      mockStoreHelperService.checkIfManyExistOrThrow.mockResolvedValue([
        mockStoreId,
      ]);
      mockUserStoreRepository.find.mockResolvedValue([]);
      mockStoreRepository.delete.mockRejectedValue(
        new Error('Fatal Hardware Failure'),
      );

      await expect(
        service.delete({ id: mockStoreId, canDeleteAssignedStore: false }),
      ).rejects.toThrow('Fatal Hardware Failure');
    });
  });
});
