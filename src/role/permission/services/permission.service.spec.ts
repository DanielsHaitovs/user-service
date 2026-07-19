import { Permission } from '@/permissionEntities/permissions.entity';
import { PermissionService } from '@/permissionServices/permission.service';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import type { UUID } from 'crypto';

describe('PermissionService', () => {
  let service: PermissionService;
  let mockRepository: {
    findOneOrFail: jest.Mock;
    findOneByOrFail: jest.Mock;
  };

  const mockId = '123e4567-e89b-12d3-a456-426614174000' as UUID;
  const mockPermission = {
    id: mockId,
    code: 'USER_CREATE',
    name: 'Create User Profiles',
  };

  beforeEach(async () => {
    mockRepository = {
      findOneOrFail: jest.fn(),
      findOneByOrFail: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionService,
        {
          provide: getRepositoryToken(Permission),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PermissionService>(PermissionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getByIdOrThrow', () => {
    it('should return a permission DTO when found by ID', async () => {
      mockRepository.findOneOrFail.mockResolvedValue(mockPermission);

      const result = await service.getByIdOrThrow(mockId);

      expect(result).toEqual(mockPermission);
      expect(mockRepository.findOneOrFail).toHaveBeenCalledWith({
        where: { id: mockId },
      });
    });

    it('should propagate TypeORM exceptions up if the entity is missing', async () => {
      mockRepository.findOneOrFail.mockRejectedValue(
        new Error('EntityNotFoundException'),
      );

      await expect(service.getByIdOrThrow(mockId)).rejects.toThrow(
        'EntityNotFoundException',
      );
    });
  });

  describe('getByCodeOrThrow', () => {
    it('should return a permission DTO when found by code name', async () => {
      mockRepository.findOneByOrFail.mockResolvedValue(mockPermission);

      const result = await service.getByCodeOrThrow('USER_CREATE');

      expect(result).toEqual(mockPermission);
      expect(mockRepository.findOneByOrFail).toHaveBeenCalledWith({
        code: 'USER_CREATE',
      });
    });

    it('should propagate exceptions up if code match fails', async () => {
      mockRepository.findOneByOrFail.mockRejectedValue(
        new Error('EntityNotFoundException'),
      );

      await expect(service.getByCodeOrThrow('INVALID_CODE')).rejects.toThrow(
        'EntityNotFoundException',
      );
    });
  });
});
