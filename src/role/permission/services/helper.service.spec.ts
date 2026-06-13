import { Permission } from '@/permissionEntities/permissions.entity';
import { PermissionHelperService } from '@/permissionServices/helper.service';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import type { UUID } from 'crypto';
import { In } from 'typeorm';

describe('PermissionHelperService', () => {
  let service: PermissionHelperService;
  let mockRepository: {
    find: jest.Mock;
  };

  beforeEach(async () => {
    mockRepository = {
      find: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PermissionHelperService,
        {
          provide: getRepositoryToken(Permission),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<PermissionHelperService>(PermissionHelperService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // ==========================================
  // Unit Tests: checkIfManyExistOrThrow
  // ==========================================
  describe('checkIfManyExistOrThrow', () => {
    const mockCodes = ['USER_CREATE', 'USER_DELETE'];

    const mockPermissionsArray = [
      {
        id: '11111111-e89b-12d3-a456-426614174000' as UUID,
        code: 'USER_CREATE',
      },
      {
        id: '22222222-e89b-12d3-a456-426614174000' as UUID,
        code: 'USER_DELETE',
      },
    ];

    // Scenario 1: Happy Path
    it('should return an array of UUIDs when all provided codes match existing entities', async () => {
      // Arrange
      mockRepository.find.mockResolvedValue(mockPermissionsArray);

      // Act
      const result = await service.checkIfManyExistOrThrow(mockCodes);

      // Assert
      expect(result).toEqual([
        mockPermissionsArray[0]?.id,
        mockPermissionsArray[1]?.id,
      ]);
      expect(mockRepository.find).toHaveBeenCalledWith({
        where: { code: In(mockCodes) },
      });
    });

    // Scenario 2: Empty Input Boundary Error
    it('should throw UnprocessableEntityException if codes array is undefined or empty', async () => {
      // Act & Assert (Testing undefined)
      await expect(service.checkIfManyExistOrThrow()).rejects.toThrow(
        new UnprocessableEntityException('No permission codes provided.'),
      );

      // Act & Assert (Testing empty array)
      await expect(service.checkIfManyExistOrThrow([])).rejects.toThrow(
        new UnprocessableEntityException('No permission codes provided.'),
      );

      // Senior Check: Ensure the database was never touched since it should exit early
      expect(mockRepository.find).not.toHaveBeenCalled();
    });

    // Scenario 3: Mismatched Database Ingestion Error
    it('should throw UnprocessableEntityException listing missing codes if some codes are not found', async () => {
      // Arrange: The user requested two codes, but the database only returns one
      mockRepository.find.mockResolvedValue([mockPermissionsArray[0]]);

      // Act & Assert
      await expect(service.checkIfManyExistOrThrow(mockCodes)).rejects.toThrow(
        new UnprocessableEntityException(
          'The following permission codes do not exist: USER_DELETE',
        ),
      );
    });
  });
});
