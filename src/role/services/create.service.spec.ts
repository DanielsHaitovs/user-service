/* eslint-disable @typescript-eslint/no-misused-spread */
import { PermissionHelperService } from '@/permissionServices/helper.service';
import type { CreateRoleDto } from '@/roleDto/role.dto';
import { Roles } from '@/roleEntities/role.entity';
import { CreateService } from '@/roleServices/create.service';
import {
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { randomUUID, type UUID } from 'crypto';

describe('CreateService', () => {
  let service: CreateService;

  let mockRoleRepository: {
    findOne: jest.Mock;
    create: jest.Mock;
    save: jest.Mock;
  };

  let mockPermissionHelper: {
    checkIfManyExistOrThrow: jest.Mock;
  };

  const mockRoleId = randomUUID();
  const mockCreatedById = '44444444-e89b-12d3-a456-426614174000' as UUID;
  const mockPermissionUuid = '55555555-e89b-12d3-a456-426614174000' as UUID;

  beforeEach(async () => {
    mockRoleRepository = {
      findOne: jest.fn(),
      create: jest.fn(),
      save: jest.fn(),
    };

    mockPermissionHelper = {
      checkIfManyExistOrThrow: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateService,
        {
          provide: getRepositoryToken(Roles),
          useValue: mockRoleRepository,
        },
        {
          provide: PermissionHelperService,
          useValue: mockPermissionHelper,
        },
      ],
    }).compile();

    service = module.get<CreateService>(CreateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should successfully create and return a role when payload is valid', async () => {
      const createDto: CreateRoleDto = {
        name: 'Manager',
        permissions: ['USER_CREATE'],
      };

      mockRoleRepository.findOne.mockResolvedValue(null);
      mockPermissionHelper.checkIfManyExistOrThrow.mockResolvedValue([
        { id: mockPermissionUuid },
      ]);

      mockRoleRepository.create.mockImplementation((dto: CreateRoleDto) => {
        return { ...dto } as unknown as Roles;
      });

      mockRoleRepository.save.mockImplementation((entity: Roles) =>
        Promise.resolve({ ...entity, id: mockRoleId }),
      );

      const result = await service.create({
        createDto,
        createdById: mockCreatedById,
      });

      expect(result).toEqual({
        id: mockRoleId,
        name: 'Manager',
        createdBy: { id: mockCreatedById },
        permissions: [{ id: mockPermissionUuid }],
      });
      expect(mockRoleRepository.findOne).toHaveBeenCalledWith({
        where: { name: 'Manager' },
      });
      expect(mockPermissionHelper.checkIfManyExistOrThrow).toHaveBeenCalledWith(
        ['USER_CREATE'],
      );
      expect(mockRoleRepository.save).toHaveBeenCalled();
    });

    it('should skip permission validation and create a role if permissions array is empty', async () => {
      const createDto: CreateRoleDto = {
        name: 'Guest',
        permissions: [],
      };

      mockRoleRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.create.mockImplementation((dto: CreateRoleDto) => {
        return { ...dto } as unknown as Roles;
      });
      mockRoleRepository.save.mockImplementation((entity: Roles) =>
        Promise.resolve({ ...entity, id: mockRoleId }),
      );

      const result = await service.create({
        createDto,
        createdById: mockCreatedById,
      });

      expect(result.permissions).toEqual([]);
      expect(
        mockPermissionHelper.checkIfManyExistOrThrow,
      ).not.toHaveBeenCalled();
    });

    it('should throw a ConflictException if a role with the same name already exists', async () => {
      const createDto: CreateRoleDto = {
        name: 'Admin',
        permissions: ['ANY_PERM'],
      };

      mockRoleRepository.findOne.mockResolvedValue({
        id: 'existing-id',
        name: 'Admin',
      });
      mockPermissionHelper.checkIfManyExistOrThrow.mockResolvedValue([
        mockPermissionUuid,
      ]);

      await expect(
        service.create({ createDto, createdById: mockCreatedById }),
      ).rejects.toThrow(
        new ConflictException('A role with the name "Admin" already exists.'),
      );

      expect(mockRoleRepository.create).not.toHaveBeenCalled();
      expect(mockRoleRepository.save).not.toHaveBeenCalled();
    });

    it('should propagate UnprocessableEntityException if permission validation fails', async () => {
      const createDto: CreateRoleDto = {
        name: 'Supervisor',
        permissions: ['BAD_PERM'],
      };

      mockRoleRepository.findOne.mockResolvedValue(null);
      mockPermissionHelper.checkIfManyExistOrThrow.mockRejectedValue(
        new UnprocessableEntityException(
          'The following permission codes do not exist: BAD_PERM',
        ),
      );

      await expect(
        service.create({ createDto, createdById: mockCreatedById }),
      ).rejects.toThrow(UnprocessableEntityException);

      expect(mockRoleRepository.create).not.toHaveBeenCalled();
    });

    it('should successfully skip validation if permissions property is completely undefined', async () => {
      const createDto: CreateRoleDto = {
        name: 'Auditor',
      };

      mockRoleRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.create.mockImplementation((dto: CreateRoleDto) => {
        return { ...dto } as unknown as Roles;
      });
      mockRoleRepository.save.mockImplementation((entity: Roles) =>
        Promise.resolve({ ...entity, id: mockRoleId }),
      );

      const result = await service.create({
        createDto,
        createdById: mockCreatedById,
      });

      expect(result.name).toBe('Auditor');
      expect(
        mockPermissionHelper.checkIfManyExistOrThrow,
      ).not.toHaveBeenCalled();
    });

    it('should reject with the first failing exception when both name uniqueness and permissions fail concurrently', async () => {
      const createDto: CreateRoleDto = {
        name: 'DuplicateAdmin',
        permissions: ['INVALID_PERM'],
      };

      mockRoleRepository.findOne.mockResolvedValue({
        id: 'any-id',
        name: 'DuplicateAdmin',
      });
      mockPermissionHelper.checkIfManyExistOrThrow.mockRejectedValue(
        new UnprocessableEntityException('Permissions failed first'),
      );

      await expect(
        service.create({ createDto, createdById: mockCreatedById }),
      ).rejects.toThrow();

      expect(mockRoleRepository.save).not.toHaveBeenCalled();
    });
  });
});
