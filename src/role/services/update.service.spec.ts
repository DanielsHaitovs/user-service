/* eslint-disable @typescript-eslint/no-misused-spread */
import type { UpdateRoleDto } from '@/roleDto/role.dto';
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

      const result = await service.update({ updateDto, id: mockRoleId });

      expect(result).toBe(true);
    });

    it('should return false early if the name property is completely missing or undefined', async () => {
      // Arrange
      const updateDto: UpdateRoleDto = {};

      const result = await service.update({ updateDto, id: mockRoleId });

      expect(result).toBe(false);
      expect(mockRoleRepository.findOneOrFail).not.toHaveBeenCalled();
      expect(mockRoleRepository.update).not.toHaveBeenCalled();
    });

    it('should return true without executing an update if the new name matches the current name', async () => {
      // Arrange
      const updateDto: UpdateRoleDto = { name: 'SameName' };

      mockRoleRepository.findOneOrFail.mockResolvedValue({
        id: mockRoleId,
        name: 'SameName',
      });

      const result = await service.update({ updateDto, id: mockRoleId });

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
        service.update({ updateDto, id: mockRoleId }),
      ).rejects.toThrow(
        new UnprocessableEntityException(
          'A role with the name "Admin" already exists.',
        ),
      );

      expect(mockRoleRepository.update).not.toHaveBeenCalled();
    });

    it('should propagate core TypeORM exceptions if the target role ID does not exist', async () => {
      const updateDto: UpdateRoleDto = { name: 'New Name' };
      mockRoleRepository.findOneOrFail.mockRejectedValue(
        new Error('EntityNotFound'),
      );

      await expect(
        service.update({ updateDto, id: mockRoleId }),
      ).rejects.toThrow('EntityNotFound');

      expect(mockRoleRepository.findOne).not.toHaveBeenCalled();
      expect(mockRoleRepository.update).not.toHaveBeenCalled();
    });
  });
});
