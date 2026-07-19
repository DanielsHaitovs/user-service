/* eslint-disable sonarjs/no-hardcoded-passwords */
import type { AuthenticateDto } from '@/auth/auth.dto';
import { AuthService } from '@/auth/auth.service';
import { AuthCacheService } from '@/auth/cache.service';
import { CacheService } from '@/baseServices/cache.service';
import type { EnvConfigService } from '@/config/env/env.config.service';
import { bootstrapTestApp } from '@/test/bootstrap-e2e';
import { updateTestUser } from '@/test/db/user';
import { createTestUser } from '@/test/pipeline/user';
import type { UserPipelineService } from '@/user/user.pipeline';
import type { UserResponseDto } from '@/userDto/user.dto';
import { UnauthorizedException } from '@nestjs/common';
import type { TestingModule } from '@nestjs/testing';

import type { UUID } from 'crypto';
import type { DataSource } from 'typeorm';

describe('AuthService (Integration)', () => {
  let authService: AuthService;
  let userPipelineService: UserPipelineService;
  let dataSource: DataSource;
  let moduleFixture: TestingModule;
  let envConfigService: EnvConfigService;
  let cacheService: AuthCacheService;
  let cacheSetSpy: jest.SpyInstance;
  let requireAuthSpy: jest.SpyInstance;
  let systemUserId: UUID;

  const testPassword = 'TestPassword123!';

  let testUser: UserResponseDto;

  beforeAll(async () => {
    ({
      dataSource,
      moduleFixture,
      envConfigService,
      userPipelineService,
      systemUserId,
    } = await bootstrapTestApp());

    authService = moduleFixture.get<AuthService>(AuthService);
    cacheService = moduleFixture.get<AuthCacheService>(AuthCacheService);
    jest.spyOn(CacheService.prototype, 'invalidateByTags').mockResolvedValue();

    cacheSetSpy = jest.spyOn(cacheService, 'set').mockResolvedValue();

    requireAuthSpy = jest
      .spyOn(envConfigService, 'requireAuth', 'get')
      .mockReturnValue(true);
  });

  beforeEach(async () => {
    jest.clearAllMocks();
    testUser = await createTestUser({
      userPipelineService,
      overrides: { password: testPassword },
      createdById: systemUserId,
    });
    await updateTestUser({
      dataSource,
      id: testUser.id,
      override: { isActive: true, isEmailVerified: true },
    });
  });

  afterAll(async () => {
    await moduleFixture.close();
  });

  describe('signIn', () => {
    it('200 OK - should successfully authenticate a valid user, issue a JWT, and update the session cache', async () => {
      const payload: AuthenticateDto = {
        email: testUser.email,
        password: testPassword,
      };

      const result = await authService.signIn(payload);

      expect(result).toHaveProperty('token');
      expect(typeof result.token).toBe('string');

      expect(cacheSetSpy).toHaveBeenCalledTimes(1);
      expect(cacheSetSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          token: result.token,
          payload: expect.objectContaining({
            id: testUser.id,
            email: testUser.email,
          }),
        }),
      );
    });

    it('401 UNAUTHORIZED - should reject request instantly if the password verification fails', async () => {
      const payload: AuthenticateDto = {
        email: testUser.email,
        password: 'completely-wrong-password',
      };

      await expect(authService.signIn(payload)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(cacheSetSpy).toHaveBeenCalledTimes(0);
    });

    it('401 UNAUTHORIZED - should reject request with a specific message if the email does not exist', async () => {
      const payload: AuthenticateDto = {
        email: 'ghost-account@example.com',
        password: testPassword,
      };

      await expect(authService.signIn(payload)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });

    it('401 UNAUTHORIZED - should block authenticated lookups if the target user account is flagged inactive', async () => {
      await updateTestUser({
        dataSource,
        id: testUser.id,
        override: { isActive: false },
      });

      const payload: AuthenticateDto = {
        email: testUser.email,
        password: testPassword,
      };

      await expect(authService.signIn(payload)).rejects.toThrow(
        new UnauthorizedException('User account is inactive'),
      );
    });

    it('401 UNAUTHORIZED - should block authentication workflows if the email confirmation flag is false', async () => {
      await updateTestUser({
        dataSource,
        id: testUser.id,
        override: { isEmailVerified: false },
      });

      const payload: AuthenticateDto = {
        email: testUser.email,
        password: testPassword,
      };

      await expect(authService.signIn(payload)).rejects.toThrow(
        new UnauthorizedException('Email is not verified'),
      );
    });

    it('200 OK - should bypass status validation checks if requireAuth config is explicitly set to false', async () => {
      requireAuthSpy.mockReturnValue(false);

      await updateTestUser({
        dataSource,
        id: testUser.id,
        override: { isActive: false, isEmailVerified: false },
      });

      const payload: AuthenticateDto = {
        email: testUser.email,
        password: testPassword,
      };

      const result = await authService.signIn(payload);

      expect(result).toHaveProperty('token');
      expect(typeof result.token).toBe('string');
      expect(cacheSetSpy).toHaveBeenCalledTimes(1);

      requireAuthSpy.mockReturnValue(true);
    });
  });
});
