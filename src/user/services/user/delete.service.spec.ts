import { deletedResults } from '@/base/helper/delete';
import type { FullUser } from '@/common/pipes/full-user.pipe';
import { pgErrorStatusCodes } from '@/commonConst/database.const';
import { SystemIdentityService } from '@/system/identity.service';
import { User } from '@/userEntities/user.entity';
import { UserRolesService } from '@/userRoleServices/role.service';
import { DeleteService } from '@/userServices/delete.service';
import { UserStoresService } from '@/userStoreServices/store.service';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { randomUUID } from 'crypto';
import { type DeleteResult, QueryFailedError } from 'typeorm';

jest.mock('@/base/helper/delete', () => ({
  deletedResults: jest.fn(),
}));

describe('DeleteService', () => {
  let service: DeleteService;

  let mockUserRepository: {
    delete: jest.Mock;
  };

  let mockRoleService: {
    unassignRolesFromUser: jest.Mock;
  };

  let mockStoreService: {
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

  const createMockFullUserData = (
    overrides?: Partial<FullUser['user']> & { roles?: any[]; stores?: any[] },
  ): FullUser => ({
    user: {
      id: mockUserId,
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      ...overrides,
    } as any,
    roles: overrides?.roles ?? [],
    stores: overrides?.stores ?? [],
  });

  beforeEach(async () => {
    mockUserRepository = {
      delete: jest.fn().mockResolvedValue(mockDeleteResult),
    };

    mockRoleService = {
      unassignRolesFromUser: jest.fn().mockResolvedValue(undefined),
    };

    mockStoreService = {
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
    it('should successfully delete a user directly when they have no active role or store assignments', async () => {
      (deletedResults as jest.Mock).mockReturnValue(true);
      const mockData = createMockFullUserData();

      const result = await service.delete({
        data: mockData,
        canRemoveFromRelatedRoles: false,
        canRemoveFromRelatedStores: false,
      });

      expect(result).toBe(true);
      expect(mockSystemIdentityService.getSystemUserId).toHaveBeenCalled();
      expect(mockRoleService.unassignRolesFromUser).not.toHaveBeenCalled();
      expect(mockStoreService.unassignStoresFromUser).not.toHaveBeenCalled();
      expect(mockUserRepository.delete).toHaveBeenCalledWith(mockUserId);
      expect(deletedResults).toHaveBeenCalledWith(mockDeleteResult);
    });

    it('should perform relational data purges and delete user if roles/stores exist and cascading permissions are explicitly allowed', async () => {
      (deletedResults as jest.Mock).mockReturnValue(true);

      const mockRolesArray = [{ id: mockRoleId, name: 'Admin' }];
      const mockStoresArray = [{ id: mockStoreId, name: 'Warehouse A' }];

      const mockData = createMockFullUserData({
        roles: mockRolesArray,
        stores: mockStoresArray,
      });

      const result = await service.delete({
        data: mockData,
        canRemoveFromRelatedRoles: true,
        canRemoveFromRelatedStores: true,
      });

      expect(result).toBe(true);

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
      const mockData = createMockFullUserData({ id: mockSystemUserId });

      await expect(
        service.delete({
          data: mockData,
          canRemoveFromRelatedRoles: true,
          canRemoveFromRelatedStores: true,
        }),
      ).rejects.toThrow(
        new UnprocessableEntityException('The system user cannot be deleted.'),
      );

      expect(mockUserRepository.delete).not.toHaveBeenCalled();
    });

    it('should halt deletion and throw an exception if the user is attached to roles and cascade flags are denied', async () => {
      const mockData = createMockFullUserData({
        roles: [{ id: mockRoleId, name: 'Manager' }],
      });

      await expect(
        service.delete({
          data: mockData,
          canRemoveFromRelatedRoles: false,
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
      const mockData = createMockFullUserData({
        stores: [{ id: mockStoreId, name: 'Retail Store' }],
      });

      await expect(
        service.delete({
          data: mockData,
          canRemoveFromRelatedRoles: true,
          canRemoveFromRelatedStores: false,
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
      const mockData = createMockFullUserData();

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
          data: mockData,
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
      const mockData = createMockFullUserData();
      mockUserRepository.delete.mockRejectedValue(
        new Error('NetworkTimeoutException'),
      );

      await expect(
        service.delete({
          data: mockData,
          canRemoveFromRelatedRoles: true,
          canRemoveFromRelatedStores: true,
        }),
      ).rejects.toThrow('NetworkTimeoutException');
    });
  });
});
