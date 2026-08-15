/* eslint-disable @typescript-eslint/no-misused-spread */
import { updatedResults } from '@/baseHelper/update';
import { SystemIdentityService } from '@/system/identity.service';
import type { GetUserDto, UpdateUserDto } from '@/userDto/user.dto';
import { User } from '@/userEntities/user.entity';
import { UserHelperService } from '@/userServices/helper.service';
import { UpdateService } from '@/userServices/update.service';
import { UnauthorizedException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { randomUUID } from 'crypto';
import type { UpdateResult } from 'typeorm';

jest.mock('@/baseHelper/update', () => ({
  updatedResults: jest.fn(),
}));

describe('UpdateService', () => {
  let service: UpdateService;

  let mockUserRepository: {
    update: jest.Mock;
  };

  let mockUserHelperService: {
    isEmailUniqueOrThrow: jest.Mock;
  };

  let mockSystemIdentityService: {
    getSystemUserId: jest.Mock;
  };

  const mockUserId = randomUUID();
  const mockSystemUserId = randomUUID();

  const mockUserDto: GetUserDto = {
    id: mockUserId,
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
  } as GetUserDto;

  const mockUpdateResult: UpdateResult = {
    raw: [],
    affected: 1,
    generatedMaps: [],
  };

  beforeEach(async () => {
    mockUserRepository = {
      update: jest.fn().mockResolvedValue(mockUpdateResult),
    };

    mockUserHelperService = {
      isEmailUniqueOrThrow: jest.fn().mockResolvedValue(true),
    };

    mockSystemIdentityService = {
      getSystemUserId: jest.fn().mockReturnValue(mockSystemUserId),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
        {
          provide: UserHelperService,
          useValue: mockUserHelperService,
        },
        {
          provide: SystemIdentityService,
          useValue: mockSystemIdentityService,
        },
      ],
    }).compile();

    service = module.get<UpdateService>(UpdateService);

    (updatedResults as jest.Mock).mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    it('should successfully update user profile details and bypass email validation if email is omitted', async () => {
      const updateData: UpdateUserDto = { firstName: 'Johnny' };
      (updatedResults as jest.Mock).mockReturnValue(true);

      const result = await service.update({
        user: mockUserDto,
        data: updateData,
      });

      expect(result).toBe(true);
      expect(mockSystemIdentityService.getSystemUserId).toHaveBeenCalled();
      expect(mockUserHelperService.isEmailUniqueOrThrow).not.toHaveBeenCalled();
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        mockUserId,
        updateData,
      );
      expect(updatedResults).toHaveBeenCalledWith(mockUpdateResult);
    });

    it('should execute the email availability check if a new email is explicitly supplied in the payload', async () => {
      const updateData: UpdateUserDto = { email: 'new.email@example.com' };
      (updatedResults as jest.Mock).mockReturnValue(true);

      const result = await service.update({
        user: mockUserDto,
        data: updateData,
      });

      expect(result).toBe(true);
      expect(mockUserHelperService.isEmailUniqueOrThrow).toHaveBeenCalledWith({
        email: 'new.email@example.com',
        id: mockUserId,
      });
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        mockUserId,
        updateData,
      );
    });

    it('should throw an UnauthorizedException if the user payload maps to the protected system root user identity', async () => {
      const systemUserPayload = { ...mockUserDto, id: mockSystemUserId };
      const updateData: UpdateUserDto = { firstName: 'Malicious Change' };

      await expect(
        service.update({
          user: systemUserPayload,
          data: updateData,
        }),
      ).rejects.toThrow(
        new UnauthorizedException(
          'You cannot update the system identity user.',
        ),
      );

      expect(mockUserHelperService.isEmailUniqueOrThrow).not.toHaveBeenCalled();
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should bubble up exception errors if the email availability check throws a validation failure', async () => {
      const updateData: UpdateUserDto = { email: 'taken@example.com' };
      const uniqueCheckConflictError = new Error(
        'Email address is already in use.',
      );

      mockUserHelperService.isEmailUniqueOrThrow.mockRejectedValue(
        uniqueCheckConflictError,
      );

      await expect(
        service.update({
          user: mockUserDto,
          data: updateData,
        }),
      ).rejects.toThrow('Email address is already in use.');

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });
});
