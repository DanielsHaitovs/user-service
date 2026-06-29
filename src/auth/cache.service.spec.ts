import type { JwtPayload } from '@/auth/auth.interface';
import { AuthCacheService } from '@/auth/cache.service';
import { EnvConfigService } from '@/config/env/env.config.service';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, type TestingModule } from '@nestjs/testing';

import { randomUUID } from 'crypto';

describe('AuthCacheService', () => {
  let service: AuthCacheService;

  let mockCacheManager: {
    get: jest.Mock;
    set: jest.Mock;
    del: jest.Mock;
  };

  let mockJwtService: {
    verifyAsync: jest.Mock;
  };

  let mockEnvConfigService: {
    jwtExpiration: number;
  };

  const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mockTokenString';
  const mockCacheKey = `auth_token:${mockToken}`;

  const mockPayload: JwtPayload = {
    id: randomUUID(),
    email: 'cache.test@example.com',
    permissions: ['READ_STORES'],
  };

  beforeEach(async () => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn().mockResolvedValue(undefined),
      del: jest.fn().mockResolvedValue(undefined),
    };

    mockJwtService = {
      verifyAsync: jest.fn(),
    };

    mockEnvConfigService = {
      jwtExpiration: 3600, // 1 hour in seconds
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthCacheService,
        {
          provide: CACHE_MANAGER,
          useValue: mockCacheManager,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: EnvConfigService,
          useValue: mockEnvConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthCacheService>(AuthCacheService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('set', () => {
    it('should calculate the correct cache key and store the payload using millisecond conversion for TTL', async () => {
      await service.set({
        payload: mockPayload,
        token: mockToken,
      });

      expect(mockCacheManager.set).toHaveBeenCalledWith(
        mockCacheKey,
        mockPayload,
        3600 * 1000, // jwtExpiration * 1000
      );
    });
  });

  describe('get', () => {
    it('should immediately return the cached payload on a cache hit and skip JWT verification routes', async () => {
      mockCacheManager.get.mockResolvedValue(mockPayload);

      const result = await service.get(mockToken);

      expect(result).toEqual(mockPayload);
      expect(mockCacheManager.get).toHaveBeenCalledWith(mockCacheKey);
      expect(mockJwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should fall back to verifyAsync, update the cache store, and return the decoded payload on a cache miss', async () => {
      mockCacheManager.get.mockResolvedValue(null); // Cache miss simulation
      mockJwtService.verifyAsync.mockResolvedValue(mockPayload);

      const result = await service.get(mockToken);

      expect(result).toEqual(mockPayload);
      expect(mockCacheManager.get).toHaveBeenCalledWith(mockCacheKey);
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith(mockToken);

      // Asserts that the cache manager was updated dynamically during execution
      expect(mockCacheManager.set).toHaveBeenCalledWith(
        mockCacheKey,
        mockPayload,
        3600 * 1000,
      );
    });

    it('should intercept structural errors or cryptographic validation failures and throw an UnauthorizedException', async () => {
      mockCacheManager.get.mockResolvedValue(null);
      mockJwtService.verifyAsync.mockRejectedValue(
        new Error('TokenExpiredError'),
      );

      await expect(service.get(mockToken)).rejects.toThrow(
        new UnauthorizedException('Invalid or expired token'),
      );

      expect(mockCacheManager.set).not.toHaveBeenCalled();
    });
  });

  describe('del', () => {
    it('should pass target key parameters directly to the underlying deletion interface', async () => {
      const explicitKey = 'auth_token:target-to-purge';

      await service.del(explicitKey);

      expect(mockCacheManager.del).toHaveBeenCalledWith(explicitKey);
    });
  });
});
