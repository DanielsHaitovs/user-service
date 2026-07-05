/* eslint-disable sonarjs/no-hardcoded-passwords */
import type { AuthenticateDto } from '@/auth/auth.dto';
import { AuthService } from '@/auth/auth.service'; // Adjust import path based on layout
import { AuthCacheService } from '@/auth/cache.service';
import { EnvConfigService } from '@/config/env/env.config.service';
import { Environment } from '@/config/env/env.validation';
import { UserRolePipelineService } from '@/user/role.pipeline';
import { UserStorePipelineService } from '@/user/store.pipeline';
import { UserHelperService } from '@/userServices/helper.service';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';

import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

// 🎯 Mock the external bcrypt library dependency
jest.mock('bcrypt', () => ({
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;

  let mockEnvConfigService: {
    requireAuth: boolean;
    nodeEnv: Environment;
  };

  let mockJwtService: {
    signAsync: jest.Mock;
  };

  let mockUserRoleService: {
    getPermissions: jest.Mock;
  };

  let mockUserStoreService: {
    getAssignedStores: jest.Mock;
  };

  let mockUserHelperService: {
    getByEmail: jest.Mock;
  };

  let mockAuthCacheService: {
    set: jest.Mock;
  };

  const mockUserId = randomUUID();
  const mockStoreId = randomUUID();
  const mockToken = 'mocked_jwt_token_string';

  const mockUserRecord = {
    id: mockUserId,
    email: 'john.doe@example.com',
    password: '$2b$10$mockedhashedpassword',
    isActive: true,
    isEmailVerified: true,
  };

  const authPayloadDto: AuthenticateDto = {
    email: 'john.doe@example.com',
    password: 'Password123!',
  };

  beforeEach(async () => {
    mockEnvConfigService = {
      requireAuth: true,
      nodeEnv: Environment.Production,
    };

    mockJwtService = {
      signAsync: jest.fn().mockResolvedValue(mockToken),
    };

    mockUserRoleService = {
      getPermissions: jest.fn().mockResolvedValue(['READ_PRIVILEGE']),
    };

    mockUserStoreService = {
      getAssignedStores: jest.fn().mockResolvedValue([{ id: mockStoreId }]),
    };

    mockUserHelperService = {
      getByEmail: jest.fn().mockResolvedValue(mockUserRecord),
    };

    mockAuthCacheService = {
      set: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: EnvConfigService, useValue: mockEnvConfigService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: UserRolePipelineService, useValue: mockUserRoleService },
        { provide: UserStorePipelineService, useValue: mockUserStoreService },
        { provide: UserHelperService, useValue: mockUserHelperService },
        { provide: AuthCacheService, useValue: mockAuthCacheService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    (bcrypt.compare as jest.Mock).mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signIn', () => {
    it('should authenticate successfully, issue tokens, and write payload logs to the cache', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.signIn(authPayloadDto);

      expect(result).toEqual({ token: mockToken });
      expect(mockUserHelperService.getByEmail).toHaveBeenCalledWith({
        email: authPayloadDto.email,
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        authPayloadDto.password,
        mockUserRecord.password,
      );

      expect(mockUserRoleService.getPermissions).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockUserStoreService.getAssignedStores).toHaveBeenCalledWith(
        mockUserId,
      );

      const expectedJwtPayload = {
        id: mockUserId,
        email: authPayloadDto.email,
        permissions: ['READ_PRIVILEGE'],
        stores: [mockStoreId],
      };

      expect(mockJwtService.signAsync).toHaveBeenCalledWith(expectedJwtPayload);
      expect(mockAuthCacheService.set).toHaveBeenCalledWith({
        payload: expectedJwtPayload,
        token: mockToken,
      });
    });

    it('should throw a strict UnauthorizedException if the user email layout cannot be found', async () => {
      mockUserHelperService.getByEmail.mockResolvedValue(null);

      await expect(service.signIn(authPayloadDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
    });

    it('should throw an empty context UnauthorizedException if passwords do not match', async () => {
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.signIn(authPayloadDto)).rejects.toThrow(
        new UnauthorizedException(),
      );

      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
      expect(mockAuthCacheService.set).not.toHaveBeenCalled();
    });

    it('should throw an UnauthorizedException if user is flagged as inactive', async () => {
      mockUserHelperService.getByEmail.mockResolvedValue({
        ...mockUserRecord,
        isActive: false,
      });

      await expect(service.signIn(authPayloadDto)).rejects.toThrow(
        new UnauthorizedException('User account is inactive'),
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw an UnauthorizedException if user email verification remains incomplete', async () => {
      mockUserHelperService.getByEmail.mockResolvedValue({
        ...mockUserRecord,
        isEmailVerified: false,
      });

      await expect(service.signIn(authPayloadDto)).rejects.toThrow(
        new UnauthorizedException('Email is not verified'),
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should bypass profile status filters if auth requirements are disabled outside of production environments', async () => {
      // Setup the configuration boundary bypass state
      mockEnvConfigService.requireAuth = false;
      mockEnvConfigService.nodeEnv = Environment.Development;

      // Provide an unverified, inactive user payload that would normally crash
      mockUserHelperService.getByEmail.mockResolvedValue({
        ...mockUserRecord,
        isActive: false,
        isEmailVerified: false,
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.signIn(authPayloadDto);

      expect(result).toEqual({ token: mockToken });
      expect(bcrypt.compare).toHaveBeenCalled();
      expect(mockJwtService.signAsync).toHaveBeenCalled();
    });

    it('should enforce status check boundaries even if requireAuth is false, provided nodeEnv is set to Production', async () => {
      // requireAuth is disabled, BUT Node environment remains set to Production
      mockEnvConfigService.requireAuth = false;
      mockEnvConfigService.nodeEnv = Environment.Production;

      mockUserHelperService.getByEmail.mockResolvedValue({
        ...mockUserRecord,
        isActive: false, // Will catch this indicator block
      });

      await expect(service.signIn(authPayloadDto)).rejects.toThrow(
        new UnauthorizedException('User account is inactive'),
      );
    });
  });
});
