import { updatedResults } from '@/base/helper/update';
import { SystemIdentityService } from '@/system/identity.service';
import type { UpdateUserDto } from '@/userDto/user.dto';
import { User } from '@/userEntities/user.entity';
import { UserHelperService } from '@/userServices/helper.service';
import { UpdateService } from '@/userServices/update.service';
import { UnauthorizedException } from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { randomUUID } from 'crypto';
import type { UpdateResult } from 'typeorm';

// 🎯 Mock the external pure functional helper to ensure deterministic boolean tracking
jest.mock('@/base/helper/update', () => ({
  updatedResults: jest.fn(),
}));

describe('UpdateService', () => {
  let service: UpdateService;

  let mockUserRepository: {
    update: jest.Mock;
  };

  let mockUserHelperService: {
    checkIfExists: jest.Mock;
    isEmailUniqueOrThrow: jest.Mock;
  };

  let mockSystemIdentityService: {
    getSystemUserId: jest.Mock;
  };

  const mockUserId = randomUUID();
  const mockSystemUserId = randomUUID();
  const mockEmail = 'updated.user@example.com';

  // Strongly type our fake TypeORM result structure to satisfy linting limits
  const mockUpdateResult: UpdateResult = {
    raw: [],
    generatedMaps: [],
    affected: 1,
  };

  beforeEach(async () => {
    mockUserRepository = {
      update: jest.fn().mockResolvedValue(mockUpdateResult),
    };

    mockUserHelperService = {
      checkIfExists: jest.fn().mockResolvedValue(true),
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

    // Reset external module mock history
    (updatedResults as jest.Mock).mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('update', () => {
    let updateDto: UpdateUserDto;

    beforeEach(() => {
      updateDto = {
        firstName: 'John',
        lastName: 'Doe',
      };
    });

    it('should successfully update a user record when email modification is skipped', async () => {
      (updatedResults as jest.Mock).mockReturnValue(true);

      const result = await service.update({
        id: mockUserId,
        data: updateDto,
      });

      expect(result).toBe(true);
      expect(mockUserHelperService.checkIfExists).toHaveBeenCalledWith({
        id: mockUserId,
      });
      expect(mockSystemIdentityService.getSystemUserId).toHaveBeenCalled();

      // Verification that the email uniqueness boundary was correctly skipped
      expect(mockUserHelperService.isEmailUniqueOrThrow).not.toHaveBeenCalled();

      expect(mockUserRepository.update).toHaveBeenCalledWith(
        mockUserId,
        updateDto,
      );
      expect(updatedResults).toHaveBeenCalledWith(mockUpdateResult);
    });

    it('should trigger email uniqueness validation routines if data payload includes an email field', async () => {
      (updatedResults as jest.Mock).mockReturnValue(true);
      updateDto.email = mockEmail;

      const result = await service.update({
        id: mockUserId,
        data: updateDto,
      });

      expect(result).toBe(true);
      expect(mockUserHelperService.isEmailUniqueOrThrow).toHaveBeenCalledWith({
        email: mockEmail,
        id: mockUserId,
      });
      expect(mockUserRepository.update).toHaveBeenCalledWith(
        mockUserId,
        updateDto,
      );
    });

    it('should throw an UnauthorizedException if the update target matches the active system identity user ID', async () => {
      await expect(
        service.update({
          id: mockSystemUserId, // Passing system identity UUID directly
          data: updateDto,
        }),
      ).rejects.toThrow(
        new UnauthorizedException(
          'You cannot update the system identity user.',
        ),
      );

      // Ensure transaction short-circuited before calling downstream databases
      expect(mockUserHelperService.isEmailUniqueOrThrow).not.toHaveBeenCalled();
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should halt processing and propagate errors if user helper verification rejects', async () => {
      mockUserHelperService.checkIfExists.mockRejectedValue(
        new Error('UserNotFound'),
      );

      await expect(
        service.update({ id: mockUserId, data: updateDto }),
      ).rejects.toThrow('UserNotFound');

      expect(mockSystemIdentityService.getSystemUserId).not.toHaveBeenCalled();
      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });

    it('should halt processing and propagate conflicts if email unique checks fail', async () => {
      updateDto.email = mockEmail;
      mockUserHelperService.isEmailUniqueOrThrow.mockRejectedValue(
        new Error('EmailConflictException'),
      );

      await expect(
        service.update({ id: mockUserId, data: updateDto }),
      ).rejects.toThrow('EmailConflictException');

      expect(mockUserRepository.update).not.toHaveBeenCalled();
    });
  });
});
