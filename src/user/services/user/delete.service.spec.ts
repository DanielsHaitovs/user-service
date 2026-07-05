import { deletedResults } from '@/base/helper/delete';
import { pgErrorStatusCodes } from '@/commonConst/database.const';
import { SystemIdentityService } from '@/system/identity.service';
import { User } from '@/userEntities/user.entity';
import { UserRolesService } from '@/userRoleServices/role.service';
import { UserHelperService } from '@/userServices/helper.service';
import { UserStoresService } from '@/userStoreServices/store.service';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { randomUUID } from 'crypto';
import { type DeleteResult, QueryFailedError } from 'typeorm';

import { DeleteService } from './delete.service'; // Adjust import path

jest.mock('@/base/helper/delete', () => ({
  deletedResults: jest.fn(),
}));

describe('DeleteService', () => {
  let service: DeleteService;

  let mockUserRepository: {
    delete: jest.Mock;
  };

  let mockHelperService: {
    checkIfExists: jest.Mock;
  };

  let mockRoleService: {
    getAssignedRoles: jest.Mock;
    unassignRolesFromUser: jest.Mock;
  };

  let mockStoreService: {
    getAssignedStores: jest.Mock;
    unassignStoresFromUser: jest.Mock;
  };

  let mockSystemIdentityService: {
    getSystemUserId: jest.Mock;
  };

  const mockUserId = randomUUID();
  const mockSystemUserId = randomUUID();
  const mockRoleId = randomUUID();
  const mockStoreId = randomUUID();

  const mockDeleteResult: DeleteResult = {
    raw: [],
    affected: 1,
  };

  beforeEach(async () => {
    mockUserRepository = {
      delete: jest.fn().mockResolvedValue(mockDeleteResult),
    };

    mockHelperService = {
      checkIfExists: jest.fn().mockResolvedValue(true),
    };

    mockRoleService = {
      getAssignedRoles: jest.fn().mockResolvedValue([]),
      unassignRolesFromUser: jest.fn().mockResolvedValue(undefined),
    };

    mockStoreService = {
      getAssignedStores: jest.fn().mockResolvedValue([]),
      unassignStoresFromUser: jest.fn().mockResolvedValue(undefined),
    };

    mockSystemIdentityService = {
      getSystemUserId: jest.fn().mockReturnValue(mockSystemUserId),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: UserHelperService,
          useValue: mockHelperService,
        },
        {
          provide: UserRolesService,
          useValue: mockRoleService,
        },
        {
          provide: UserStoresService,
          useValue: mockStoreService,
        },
        {
          provide: SystemIdentityService,
          useValue: mockSystemIdentityService,
        },
      ],
    }).compile();

    service = module.get<DeleteService>(DeleteService);

    (deletedResults as jest.Mock).mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('delete', () => {
    it('should successfully delete a user when they have no active role or store assignments', async () => {
      (deletedResults as jest.Mock).mockReturnValue(true);

      const result = await service.delete({
        id: mockUserId,
        canRemoveFromRelatedRoles: false,
        canRemoveFromRelatedStores: false,
      });

      expect(result).toBe(true);
      expect(mockSystemIdentityService.getSystemUserId).toHaveBeenCalled();
      expect(mockRoleService.getAssignedRoles).toHaveBeenCalledWith(mockUserId);
      expect(mockStoreService.getAssignedStores).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockUserRepository.delete).toHaveBeenCalledWith(mockUserId);
      expect(deletedResults).toHaveBeenCalledWith(mockDeleteResult);
    });

    it('should perform relational data purges and delete user if roles/stores exist and cascading permissions are explicitly allowed', async () => {
      (deletedResults as jest.Mock).mockReturnValue(true);

      const mockRolesArray = [{ id: mockRoleId }];
      const mockStoresArray = [{ id: mockStoreId }];

      mockRoleService.getAssignedRoles.mockResolvedValue(mockRolesArray);
      mockStoreService.getAssignedStores.mockResolvedValue(mockStoresArray);

      const result = await service.delete({
        id: mockUserId,
        canRemoveFromRelatedRoles: true,
        canRemoveFromRelatedStores: true,
      });

      expect(result).toBe(true);

      // 🎯 THE FIX: Verify structural signature match against your service updates
      expect(mockRoleService.unassignRolesFromUser).toHaveBeenCalledWith({
        userId: mockUserId,
        data: { roleIds: [mockRoleId] },
        assignedRoles: mockRolesArray,
      });

      expect(mockStoreService.unassignStoresFromUser).toHaveBeenCalledWith({
        userId: mockUserId,
        data: { storeIds: [mockStoreId] },
        assignedStores: mockStoresArray,
      });

      expect(mockUserRepository.delete).toHaveBeenCalledWith(mockUserId);
    });

    it('should throw an UnprocessableEntityException if user attempts to delete the protected system identity root user ID', async () => {
      await expect(
        service.delete({
          id: mockSystemUserId,
          canRemoveFromRelatedRoles: true,
          canRemoveFromRelatedStores: true,
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException('The system user cannot be deleted.'),
      );

      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });

    it('should halt deletion and throw an exception if the user is attached to roles and cascade flags are denied', async () => {
      mockRoleService.getAssignedRoles.mockResolvedValue([{ id: mockRoleId }]);

      await expect(
        service.delete({
          id: mockUserId,
          canRemoveFromRelatedRoles: false, // Disallow cascading role splits
          canRemoveFromRelatedStores: true,
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'User cannot be deleted because they are still assigned to roles. Please unassign the user from their roles before deletion.',
        ),
      );

      expect(mockRoleService.unassignRolesFromUser).not.toHaveBeenCalled();
      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });

    it('should halt deletion and throw an exception if the user is attached to stores and cascade flags are denied', async () => {
      mockStoreService.getAssignedStores.mockResolvedValue([
        { id: mockStoreId },
      ]);

      await expect(
        service.delete({
          id: mockUserId,
          canRemoveFromRelatedRoles: true,
          canRemoveFromRelatedStores: false, // Disallow cascading store splits
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'User cannot be deleted because they are still assigned to stores. Please unassign the user from their stores before deletion.',
        ),
      );

      expect(mockStoreService.unassignStoresFromUser).not.toHaveBeenCalled();
      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });

    it('should catch foreign key exceptions from the PostgreSQL engine and wrap them inside clean user-facing validation errors', async () => {
      const driverError = new Error('violates foreign key constraint');
      Object.assign(driverError, {
        code: pgErrorStatusCodes.FOREIGN_KEY_VIOLATION,
      });

      const databaseConstraintException = new QueryFailedError(
        'DELETE FROM "user" WHERE "id" = $1',
        [mockUserId],
        driverError,
      );

      Object.defineProperty(databaseConstraintException, 'code', {
        value: pgErrorStatusCodes.FOREIGN_KEY_VIOLATION,
      });

      mockUserRepository.delete.mockRejectedValue(databaseConstraintException);

      await expect(
        service.delete({
          id: mockUserId,
          canRemoveFromRelatedRoles: true,
          canRemoveFromRelatedStores: true,
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'User cannot be deleted because it had activity in the system. Please contact support for assistance.',
        ),
      );
    });

    it('should pass unhandled generic database runtime failures up the execution thread without transformation wrappers', async () => {
      mockUserRepository.delete.mockRejectedValue(
        new Error('NetworkTimeoutException'),
      );

      await expect(
        service.delete({
          id: mockUserId,
          canRemoveFromRelatedRoles: true,
          canRemoveFromRelatedStores: true,
        }),
      ).rejects.toThrow('NetworkTimeoutException');
    });
  });
});
