import { User } from '@/userEntities/user.entity';
import { UserHelperService } from '@/userServices/helper.service';
import {
  ConflictException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Test, type TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';

import { randomUUID } from 'crypto';
import { Not } from 'typeorm';

describe('UserHelperService', () => {
  let service: UserHelperService;

  let mockUserRepository: {
    findOne: jest.Mock;
  };

  const mockUserId = randomUUID();
  const mockEmail = 'test-user@example.com';
  const mockUserInstance = {
    id: mockUserId,
    email: mockEmail,
    name: 'John Doe',
  };

  beforeEach(async () => {
    mockUserRepository = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserHelperService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    service = module.get<UserHelperService>(UserHelperService);
  });

  it('should be successfully instantiated', () => {
    expect(service).toBeDefined();
  });

  describe('checkIfExists', () => {
    it('should throw an UnprocessableEntityException if both id and email parameters are missing', async () => {
      await expect(service.checkIfExists({})).rejects.toThrow(
        UnprocessableEntityException,
      );

      expect(mockUserRepository.findOne).not.toHaveBeenCalled();
    });

    it('should query by ID and return user data if a matching user record is located', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUserInstance);

      const result = await service.checkIfExists({ id: mockUserId });

      expect(result).toEqual(mockUserInstance);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUserId },
      });
    });

    it('should query by Email and return user data if a matching user record is located', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUserInstance);

      const result = await service.checkIfExists({ email: mockEmail });

      expect(result).toEqual(mockUserInstance);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockEmail },
      });
    });

    it('should query by both ID and Email when both tracking coordinates are passed together', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUserInstance);

      await service.checkIfExists({ id: mockUserId, email: mockEmail });

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: mockUserId, email: mockEmail },
      });
    });

    it('should throw an UnprocessableEntityException if the repository returns null or empty sets', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(service.checkIfExists({ id: mockUserId })).rejects.toThrow(
        new UnprocessableEntityException('User does not exist.'),
      );
    });
  });

  describe('getByEmail', () => {
    it('should successfully pass back the entity instance returned by the repository boundary layer', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUserInstance);

      const result = await service.getByEmail({ email: mockEmail });

      expect(result).toEqual(mockUserInstance);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockEmail },
      });
    });

    it('should return null cleanly if the email criteria is unassigned or unrepresented in storage', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      const result = await service.getByEmail({
        email: 'nonexistent@example.com',
      });

      expect(result).toBeNull();
    });
  });

  describe('isEmailUniqueOrThrow', () => {
    it('should resolve normally if no conflicting email matches are found across the system database', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);

      await expect(
        service.isEmailUniqueOrThrow({ email: mockEmail }),
      ).resolves.not.toThrow();

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { email: mockEmail },
      });
    });

    it('should throw a ConflictException if the target email is claimed by an existing user entry', async () => {
      mockUserRepository.findOne.mockResolvedValue(mockUserInstance);

      await expect(
        service.isEmailUniqueOrThrow({ email: mockEmail }),
      ).rejects.toThrow(
        new ConflictException(
          `Email "${mockEmail}" is already in use by another user.`,
        ),
      );
    });

    it('should apply an explicit TypeORM Not condition exclusion filter if a user exclusion ID is provided', async () => {
      mockUserRepository.findOne.mockResolvedValue(null);
      const activeUpdatingUserId = randomUUID();

      await service.isEmailUniqueOrThrow({
        email: mockEmail,
        id: activeUpdatingUserId,
      });

      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: {
          email: mockEmail,
          id: Not(activeUpdatingUserId),
        },
      });
    });
  });
});
