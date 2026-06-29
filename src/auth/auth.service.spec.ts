import type { AuthenticateDto } from '@/auth/auth.dto';
import { AuthService } from '@/auth/auth.service';
import { AuthCacheService } from '@/auth/cache.service';
import { COUNTRIES } from '@/commonConst/countries.const';
import { EnvConfigService } from '@/config/env/env.config.service';
import { Environment } from '@/config/env/env.validation';
import type { User } from '@/userEntities/user.entity';
import { UserRolesService } from '@/userRoleServices/role.service';
import { UserHelperService } from '@/userServices/helper.service';
import { faker } from '@faker-js/faker';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';

import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';

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

  let mockUserHelperService: {
    getByEmail: jest.Mock;
  };

  let mockCacheService: {
    set: jest.Mock;
  };

  const mockUserId = randomUUID();
  const mockEmail = 'auth.test@example.com';
  const mockToken = 'mock-jwt-string-token';
  const mockPermissions = ['READ_USERS', 'WRITE_USERS'];

  // Type safe plain user template to build tests onto cleanly
  const createMockUser = (overrides: Partial<User> = {}): User => {
    return Object.assign(
      {
        id: mockUserId,
        email: mockEmail,
        password: randomUUID(),
        isActive: true,
        isEmailVerified: true,
        country: COUNTRIES.US,
        firstName: 'Jane',
        lastName: 'Doe',
        createdAt: new Date(),
        updatedAt: new Date(),
        phone: faker.phone.number(),
        dateOfBirth: faker.date.past({ years: 30 }),
        emailVerificationToken: randomUUID(),
        passwordResetToken: randomUUID(),
        passwordResetExpires: new Date(Date.now() + 3600000),
        isTwoFactorEnabled: false,
        twoFactorSecret: randomUUID(),
        userRoles: [],
        userStores: [],
        createdBy: randomUUID(),
      },
      overrides,
    );
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
      getPermissions: jest.fn().mockResolvedValue(mockPermissions),
    };

    mockUserHelperService = {
      getByEmail: jest.fn(),
    };

    mockCacheService = {
      set: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: EnvConfigService, useValue: mockEnvConfigService },
        { provide: JwtService, useValue: mockJwtService },
        { provide: UserRolesService, useValue: mockUserRoleService },
        { provide: UserHelperService, useValue: mockUserHelperService },
        { provide: AuthCacheService, useValue: mockCacheService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    (bcrypt.compare as jest.Mock).mockReset();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('signIn', () => {
    let authDto: AuthenticateDto;

    beforeEach(() => {
      authDto = {
        email: mockEmail,
        // eslint-disable-next-line sonarjs/no-hardcoded-passwords
        password: 'PlainTextPassword123!',
      };
    });

    it('should successfully authenticate, issue a token, and cache credentials in Production', async () => {
      const activeUser = createMockUser();
      mockUserHelperService.getByEmail.mockResolvedValue(activeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.signIn(authDto);

      expect(result).toEqual({ token: mockToken });
      expect(mockUserHelperService.getByEmail).toHaveBeenCalledWith({
        email: mockEmail,
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        authDto.password,
        activeUser.password,
      );
      expect(mockUserRoleService.getPermissions).toHaveBeenCalledWith(
        mockUserId,
      );
      expect(mockJwtService.signAsync).toHaveBeenCalledWith({
        id: mockUserId,
        email: mockEmail,
        permissions: mockPermissions,
      });
      expect(mockCacheService.set).toHaveBeenCalledWith({
        payload: {
          id: mockUserId,
          email: mockEmail,
          permissions: mockPermissions,
        },
        token: mockToken,
      });
    });

    it('should bypass active and verified strict checks when requireAuth is disabled in Local environment', async () => {
      // Configuration values altered to hit the specific config gate shortcut path
      mockEnvConfigService.requireAuth = false;
      mockEnvConfigService.nodeEnv = Environment.Development;

      // User is explicitly inactive and unverified, but should still be allowed through by the gate
      const constrainedUser = createMockUser({
        isActive: false,
        isEmailVerified: false,
      });
      mockUserHelperService.getByEmail.mockResolvedValue(constrainedUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.signIn(authDto);

      expect(result).toEqual({ token: mockToken });

      // 🎯 THE FIX: Direct assertion to prove the validation limits were bypassed
      expect(mockUserRoleService.getPermissions).toHaveBeenCalledWith(
        mockUserId,
      );
    });

    it('should throw an UnauthorizedException if the password comparison check returns false', async () => {
      const activeUser = createMockUser();
      mockUserHelperService.getByEmail.mockResolvedValue(activeUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(false); // Mismatch path triggered

      await expect(service.signIn(authDto)).rejects.toThrow(
        new UnauthorizedException(),
      );

      expect(mockJwtService.signAsync).not.toHaveBeenCalled();
      expect(mockCacheService.set).not.toHaveBeenCalled();
    });

    it('should throw "Invalid credentials" if the email lookup resolves to null or undefined', async () => {
      mockUserHelperService.getByEmail.mockResolvedValue(null);

      await expect(service.signIn(authDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw "User account is inactive" if status is false and safety gates are active', async () => {
      const inactiveUser = createMockUser({ isActive: false });
      mockUserHelperService.getByEmail.mockResolvedValue(inactiveUser);

      await expect(service.signIn(authDto)).rejects.toThrow(
        new UnauthorizedException('User account is inactive'),
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw "Email is not verified" if verification flag is false and safety gates are active', async () => {
      const unverifiedUser = createMockUser({ isEmailVerified: false });
      mockUserHelperService.getByEmail.mockResolvedValue(unverifiedUser);

      await expect(service.signIn(authDto)).rejects.toThrow(
        new UnauthorizedException('Email is not verified'),
      );

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });
});
