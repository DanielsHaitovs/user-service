import { deletedResults } from '@/base/helper/delete';
import { pgErrorStatusCodes } from '@/commonConst/database.const';
import type { GetRoleDto } from '@/roleDto/role.dto';
import { Roles } from '@/roleEntities/role.entity';
import { DeleteService } from '@/roleServices/delete.service';
import { SystemIdentityService } from '@/system/identity.service';
import { UserRoles } from '@/userEntities/userRoles.entity';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import type { UUID } from 'crypto';
import { QueryFailedError } from 'typeorm';

jest.mock('@/base/helper/delete', () => ({
  deletedResults: jest.fn(),
}));

describe('DeleteService', () => {
  let service: DeleteService;

  const mockRoleDelete = jest.fn();
  const mockUserRolesFind = jest.fn();
  const mockUserRolesDelete = jest.fn();
  const mockGetSystemRoleIds = jest.fn();

  const mockRoleId = '93aa29b4-ad0f-4832-8486-d382be83ef36' as UUID;
  const mockTargetRole: GetRoleDto = {
    id: mockRoleId,
    name: 'Standard Editor',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteService,
        {
          provide: getRepositoryToken(Roles),
          useValue: {
            delete: mockRoleDelete,
          },
        },
        {
          provide: getRepositoryToken(UserRoles),
          useValue: {
            find: mockUserRolesFind,
            delete: mockUserRolesDelete,
          },
        },
        {
          provide: SystemIdentityService,
          useValue: {
            getSystemRoleIds: mockGetSystemRoleIds,
          },
        },
      ],
    }).compile();

    service = module.get<DeleteService>(DeleteService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('delete', () => {
    it('should throw UnprocessableEntityException if the role is a protected system role', async () => {
      mockGetSystemRoleIds.mockResolvedValue([mockRoleId]);

      await expect(
        service.delete({ role: mockTargetRole, canDeleteAssignedRole: false }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'One or more of the specified roles are system roles and cannot be deleted.',
        ),
      );

      expect(mockGetSystemRoleIds).toHaveBeenCalledTimes(1);
      expect(mockRoleDelete).not.toHaveBeenCalled();
    });

    it('should throw UnprocessableEntityException if role is assigned to users and canDeleteAssignedRole is false', async () => {
      mockGetSystemRoleIds.mockResolvedValue([]);
      mockUserRolesFind.mockResolvedValue([{} as UserRoles]);

      await expect(
        service.delete({ role: mockTargetRole, canDeleteAssignedRole: false }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'Role cannot be deleted because it is currently assigned to one or more users. Please unassign the role from all users before attempting to delete it.',
        ),
      );

      expect(mockUserRolesFind).toHaveBeenCalledWith({
        where: { role: { id: mockRoleId } },
        take: 1,
        skip: 0,
      });
      expect(mockUserRolesDelete).not.toHaveBeenCalled();
      expect(mockRoleDelete).not.toHaveBeenCalled();
    });

    it('should clear user assignments and delete the role if assigned to users and canDeleteAssignedRole is true', async () => {
      mockGetSystemRoleIds.mockResolvedValue([]);
      mockUserRolesFind.mockResolvedValue([{} as UserRoles]);
      mockUserRolesDelete.mockResolvedValue({ affected: 1 });
      mockRoleDelete.mockResolvedValue({ affected: 1 });
      (deletedResults as jest.Mock).mockReturnValue(true);

      const result = await service.delete({
        role: mockTargetRole,
        canDeleteAssignedRole: true,
      });

      expect(result).toBe(true);
      expect(mockUserRolesDelete).toHaveBeenCalledWith({
        role: { id: mockRoleId },
      });
      expect(mockRoleDelete).toHaveBeenCalledWith(mockRoleId);
    });

    it('should delete the role directly if it is not assigned to any users', async () => {
      mockGetSystemRoleIds.mockResolvedValue([]);
      mockUserRolesFind.mockResolvedValue([]);
      mockRoleDelete.mockResolvedValue({ affected: 1 });
      (deletedResults as jest.Mock).mockReturnValue(true);

      const result = await service.delete({
        role: mockTargetRole,
        canDeleteAssignedRole: false,
      });

      expect(result).toBe(true);
      expect(mockUserRolesDelete).not.toHaveBeenCalled();
      expect(mockRoleDelete).toHaveBeenCalledWith(mockRoleId);
    });

    it('should map a database foreign key violation to an UnprocessableEntityException', async () => {
      mockGetSystemRoleIds.mockResolvedValue([]);
      mockUserRolesFind.mockResolvedValue([]);

      const dbError = new QueryFailedError(
        'DELETE',
        [],
        new Error('FK Constraint failed'),
      );
      (dbError as any).code = pgErrorStatusCodes.FOREIGN_KEY_VIOLATION;
      mockRoleDelete.mockRejectedValue(dbError);

      await expect(
        service.delete({ role: mockTargetRole, canDeleteAssignedRole: false }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'Role cannot be deleted because it is currently assigned to one or more users. Please unassign the role from all users before attempting to delete it.',
        ),
      );
    });
  });
});
