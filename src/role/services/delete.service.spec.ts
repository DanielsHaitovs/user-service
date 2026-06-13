import { pgErrorStatusCodes } from '@/commonConst/database.const';
import { Roles } from '@/roleEntities/role.entity';
import { RoleHelperService } from '@/roleServices/helper.service';
import { SystemIdentityService } from '@/system/identity.service';
import { UserRoles } from '@/userEntities/userRoles.entity';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { randomUUID } from 'crypto';
import { QueryFailedError } from 'typeorm';

import { DeleteService } from './delete.service';

describe('DeleteService', () => {
  let service: DeleteService;

  let mockRoleRepository: {
    delete: jest.Mock;
  };
  let mockUserRolesRepository: {
    find: jest.Mock;
    delete: jest.Mock;
  };
  let mockRoleHelperService: {
    checkIfManyExistOrThrow: jest.Mock;
  };
  let mockSystemIdentityService: {
    getSystemRoleIds: jest.Mock;
  };

  const mockTargetRoleId = randomUUID();
  const mockSystemRoleId = randomUUID();

  beforeEach(async () => {
    mockRoleRepository = {
      delete: jest.fn(),
    };
    mockUserRolesRepository = {
      find: jest.fn(),
      delete: jest.fn(),
    };
    mockRoleHelperService = {
      checkIfManyExistOrThrow: jest.fn(),
    };
    mockSystemIdentityService = {
      getSystemRoleIds: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteService,
        {
          provide: getRepositoryToken(Roles),
          useValue: mockRoleRepository,
        },
        {
          provide: getRepositoryToken(UserRoles),
          useValue: mockUserRolesRepository,
        },
        {
          provide: RoleHelperService,
          useValue: mockRoleHelperService,
        },
        {
          provide: SystemIdentityService,
          useValue: mockSystemIdentityService,
        },
      ],
    }).compile();

    service = module.get<DeleteService>(DeleteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('delete', () => {
    it('should successfully delete the role when it has no active assignments or system locks', async () => {
      mockRoleHelperService.checkIfManyExistOrThrow.mockResolvedValue(
        undefined,
      );
      mockSystemIdentityService.getSystemRoleIds.mockResolvedValue([
        mockSystemRoleId,
      ]);
      mockUserRolesRepository.find.mockResolvedValue([]);
      mockRoleRepository.delete.mockResolvedValue({ affected: 1, raw: [] });

      const result = await service.delete({
        id: mockTargetRoleId,
        canDeleteAssignedRole: false,
      });

      expect(result).toBe(true);
      expect(
        mockRoleHelperService.checkIfManyExistOrThrow,
      ).toHaveBeenCalledWith([mockTargetRoleId]);
      expect(mockUserRolesRepository.find).toHaveBeenCalledWith({
        where: { role: { id: mockTargetRoleId } },
        take: 1,
        skip: 0,
      });
      expect(mockRoleRepository.delete).toHaveBeenCalledWith(mockTargetRoleId);
    });

    it('should propagate exceptions immediately if the helper module flags the role as non-existent', async () => {
      mockRoleHelperService.checkIfManyExistOrThrow.mockRejectedValue(
        new UnprocessableEntityException(
          'Role matching given ID does not exist.',
        ),
      );

      await expect(
        service.delete({ id: mockTargetRoleId, canDeleteAssignedRole: false }),
      ).rejects.toThrow(UnprocessableEntityException);

      expect(mockSystemIdentityService.getSystemRoleIds).not.toHaveBeenCalled();
      expect(mockRoleRepository.delete).not.toHaveBeenCalled();
    });

    it('should throw an UnprocessableEntityException if the targeted ID belongs to a core system role', async () => {
      mockRoleHelperService.checkIfManyExistOrThrow.mockResolvedValue(
        undefined,
      );
      mockSystemIdentityService.getSystemRoleIds.mockResolvedValue([
        mockSystemRoleId,
        mockTargetRoleId,
      ]);

      await expect(
        service.delete({ id: mockTargetRoleId, canDeleteAssignedRole: false }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'One or more of the specified roles are system roles and cannot be deleted.',
        ),
      );

      expect(mockUserRolesRepository.find).not.toHaveBeenCalled();
      expect(mockRoleRepository.delete).not.toHaveBeenCalled();
    });

    it('should reject with an UnprocessableEntityException if users are assigned and override flag is false', async () => {
      mockRoleHelperService.checkIfManyExistOrThrow.mockResolvedValue(
        undefined,
      );
      mockSystemIdentityService.getSystemRoleIds.mockResolvedValue([]);
      mockUserRolesRepository.find.mockResolvedValue([
        { id: 1, role: { id: mockTargetRoleId } },
      ]);

      await expect(
        service.delete({ id: mockTargetRoleId, canDeleteAssignedRole: false }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'Role cannot be deleted because it is currently assigned to one or more users. Please unassign the role from all users before attempting to delete it.',
        ),
      );

      expect(mockUserRolesRepository.delete).not.toHaveBeenCalled();
      expect(mockRoleRepository.delete).not.toHaveBeenCalled();
    });

    it('should perform a cascading unassign cleanup step before execution if override flag is active', async () => {
      mockRoleHelperService.checkIfManyExistOrThrow.mockResolvedValue(
        undefined,
      );
      mockSystemIdentityService.getSystemRoleIds.mockResolvedValue([]);
      mockUserRolesRepository.find.mockResolvedValue([
        { id: 1, role: { id: mockTargetRoleId } },
      ]);
      mockUserRolesRepository.delete.mockResolvedValue({ affected: 1 });
      mockRoleRepository.delete.mockResolvedValue({ affected: 1, raw: [] });

      const result = await service.delete({
        id: mockTargetRoleId,
        canDeleteAssignedRole: true,
      });

      expect(result).toBe(true);
      expect(mockUserRolesRepository.delete).toHaveBeenCalledWith({
        role: { id: mockTargetRoleId },
      });
      expect(mockRoleRepository.delete).toHaveBeenCalledWith(mockTargetRoleId);
    });

    it('should catch database-level foreign key violations and convert them to UnprocessableEntityExceptions', async () => {
      mockRoleHelperService.checkIfManyExistOrThrow.mockResolvedValue(
        undefined,
      );
      mockSystemIdentityService.getSystemRoleIds.mockResolvedValue([]);
      mockUserRolesRepository.find.mockResolvedValue([]);

      const dbDriverError = new Error('foreign key constraint violation');
      const queryError = new QueryFailedError(
        'DELETE FROM roles...',
        [],
        dbDriverError,
      );
      Object.defineProperty(queryError, 'code', {
        value: pgErrorStatusCodes.FOREIGN_KEY_VIOLATION,
      });

      mockRoleRepository.delete.mockRejectedValue(queryError);

      await expect(
        service.delete({ id: mockTargetRoleId, canDeleteAssignedRole: false }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'Role cannot be deleted because it is currently assigned to one or more users. Please unassign the role from all users before attempting to delete it.',
        ),
      );
    });

    it('should unconditionally propagate generic or unexpected database error modifications', async () => {
      mockRoleHelperService.checkIfManyExistOrThrow.mockResolvedValue(
        undefined,
      );
      mockSystemIdentityService.getSystemRoleIds.mockResolvedValue([]);
      mockUserRolesRepository.find.mockResolvedValue([]);

      const generalDbError = new Error(
        'Connection pool closed or dead socket pipeline',
      );
      mockRoleRepository.delete.mockRejectedValue(generalDbError);

      await expect(
        service.delete({ id: mockTargetRoleId, canDeleteAssignedRole: false }),
      ).rejects.toThrow('Connection pool closed or dead socket pipeline');
    });
  });
});
