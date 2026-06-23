/* eslint-disable @typescript-eslint/no-misused-spread */
import type { GetRoleDto, UpdateRoleDto } from '@/roleDto/role.dto';
import { Roles } from '@/roleEntities/role.entity';
import { UpdateService } from '@/roleServices/update.service';
import { UnprocessableEntityException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { randomUUID } from 'crypto';

describe('UpdateService', () => {
  let service: UpdateService;

  let mockRoleRepository: {
    findOneOrFail: jest.Mock;
    findOne: jest.Mock;
    create: jest.Mock;
    update: jest.Mock;
  };

  const mockRoleId = randomUUID();
  const mockRole: GetRoleDto = {
    id: mockRoleId,
    name: 'Manager',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    mockRoleRepository = {
      findOneOrFail: jest.fn(),
      findOne: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateService,
        {
          provide: getRepositoryToken(Roles),
          useValue: mockRoleRepository,
        },
      ],
    }).compile();

    service = module.get<UpdateService>(UpdateService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    it('should successfully update the role name when it is unique and changed', async () => {
      const updateDto: UpdateRoleDto = { name: 'Super Manager' };

      mockRoleRepository.findOneOrFail.mockResolvedValue({
        id: mockRoleId,
        name: 'Old Manager',
      });
      mockRoleRepository.findOne.mockResolvedValue(null);
      mockRoleRepository.create.mockImplementation((dto: UpdateRoleDto) => {
        return { ...dto } as unknown as Roles;
      });

      mockRoleRepository.update.mockResolvedValue({ affected: 1 });

      const result = await service.update({ updateDto, role: mockRole });

      expect(result).toBe(true);
    });

    it('should return false early if the name property is completely missing or undefined', async () => {
      const updateDto: UpdateRoleDto = {};

      const result = await service.update({ updateDto, role: mockRole });

      expect(result).toBe(false);
      expect(mockRoleRepository.findOneOrFail).not.toHaveBeenCalled();
      expect(mockRoleRepository.update).not.toHaveBeenCalled();
    });

    it('should return true without executing an update if the new name matches the current name', async () => {
      const updateDto: UpdateRoleDto = { name: mockRole.name };

      mockRoleRepository.findOneOrFail.mockResolvedValue({
        id: mockRoleId,
        name: mockRole.name,
      });

      const result = await service.update({ updateDto, role: mockRole });

      expect(result).toBe(true);
      expect(mockRoleRepository.findOne).not.toHaveBeenCalled();
      expect(mockRoleRepository.update).not.toHaveBeenCalled();
    });

    it('should throw an UnprocessableEntityException if the new name is already taken by another role', async () => {
      const updateDto: UpdateRoleDto = { name: 'Admin' };

      mockRoleRepository.findOneOrFail.mockResolvedValue({
        id: mockRoleId,
        name: 'Staff',
      });
      mockRoleRepository.findOne.mockResolvedValue({
        id: randomUUID(),
        name: 'Admin',
      });

      await expect(
        service.update({ updateDto, role: mockRole }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'A role with the name "Admin" already exists.',
        ),
      );

      expect(mockRoleRepository.update).not.toHaveBeenCalled();
    });

    it('should propagate core TypeORM exceptions if the repository update operation fails', async () => {
      const updateDto: UpdateRoleDto = { name: 'New Name' };

      mockRoleRepository.create.mockReturnValue(updateDto);
      mockRoleRepository.update.mockRejectedValue(
        new Error('DatabaseConnectionError'),
      );

      mockRole.id = randomUUID();

      await expect(
        service.update({ updateDto, role: mockRole }),
      ).rejects.toThrow('DatabaseConnectionError');

      expect(mockRoleRepository.update).toHaveBeenCalledWith(
        mockRole.id,
        expect.objectContaining({ name: 'New Name' }),
      );
    });
  });
});
