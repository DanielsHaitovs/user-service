/* eslint-disable sonarjs/no-hardcoded-passwords */
import { COUNTRIES } from '@/commonConst/countries.const';
import { EnvConfigService } from '@/config/env/env.config.service';
import { RoleHelperService } from '@/roleServices/helper.service';
import { StoreHelperService } from '@/storeServices/helper.service';
import type { CreateUserDto } from '@/userDto/user.dto';
import { User } from '@/userEntities/user.entity';
import { UserRoles } from '@/userEntities/userRoles.entity';
import { UserStores } from '@/userEntities/userStores.entity';
import { CreateService } from '@/userServices/create.service';
import { UserHelperService } from '@/userServices/helper.service';
import { Test, type TestingModule } from '@nestjs/testing';

import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { DataSource, type EntityManager } from 'typeorm';

jest.mock('bcrypt', () => ({
  hash: jest.fn(),
}));

interface RoleWithId {
  role: { id: string };
  [key: string]: unknown;
}

interface StoreWithId {
  store: { id: string };
  [key: string]: unknown;
}

const getMockSaveHandler = (generatedUserId: string) => {
  return (entity: unknown, data: unknown): Promise<unknown> => {
    if (entity === User) {
      return Promise.resolve(
        Object.assign({ id: generatedUserId }, data as Record<string, unknown>),
      );
    }
    if (entity === UserRoles && Array.isArray(data)) {
      const typedRoles = data as RoleWithId[];
      const mappedRoles = typedRoles.map((item) =>
        Object.assign({}, item, { role: { id: item.role.id } }),
      );
      return Promise.resolve(mappedRoles);
    }
    if (entity === UserStores && Array.isArray(data)) {
      const typedStores = data as StoreWithId[];
      const mappedStores = typedStores.map((item) =>
        Object.assign({}, item, { store: { id: item.store.id } }),
      );
      return Promise.resolve(mappedStores);
    }
    return Promise.resolve(data);
  };
};

describe('CreateService', () => {
  let service: CreateService;

  let mockDataSource: {
    transaction: jest.Mock;
  };

  let mockEntityManager: {
    create: jest.Mock;
    save: jest.Mock;
  };

  let mockUserHelper: {
    isEmailUniqueOrThrow: jest.Mock;
  };

  let mockRoleHelper: {
    checkIfManyExistOrThrow: jest.Mock;
  };

  let mockStoreHelper: {
    checkIfManyExistOrThrow: jest.Mock;
  };

  let mockEnvConfigService: {
    passwordSaltRounds: number;
  };

  const mockCreatedById = randomUUID();
  const mockRoleId = randomUUID();
  const mockStoreId = randomUUID();

  const mockHashedPassword = '$2b$10$mockhashedpasswordstring';

  beforeEach(async () => {
    mockEntityManager = {
      create: jest
        .fn()
        .mockImplementation(
          (_entity: unknown, dto: Record<string, unknown>) => {
            return Object.assign({}, dto);
          },
        ),
      save: jest.fn(),
    };

    mockDataSource = {
      transaction: jest
        .fn()
        .mockImplementation(
          async (cb: (manager: EntityManager) => Promise<unknown>) => {
            return cb(mockEntityManager as unknown as EntityManager);
          },
        ),
    };

    mockUserHelper = {
      isEmailUniqueOrThrow: jest.fn().mockResolvedValue(true),
    };

    mockRoleHelper = {
      checkIfManyExistOrThrow: jest.fn().mockResolvedValue([mockRoleId]),
    };

    mockStoreHelper = {
      checkIfManyExistOrThrow: jest.fn().mockResolvedValue([mockStoreId]),
    };

    mockEnvConfigService = {
      passwordSaltRounds: 12,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateService,
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
        {
          provide: UserHelperService,
          useValue: mockUserHelper,
        },
        {
          provide: RoleHelperService,
          useValue: mockRoleHelper,
        },
        {
          provide: StoreHelperService,
          useValue: mockStoreHelper,
        },
        {
          provide: EnvConfigService,
          useValue: mockEnvConfigService,
        },
      ],
    }).compile();

    service = module.get<CreateService>(CreateService);

    (bcrypt.hash as jest.Mock).mockResolvedValue(mockHashedPassword);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    let baseCreateDto: CreateUserDto;

    beforeEach(() => {
      baseCreateDto = {
        firstName: 'Jane',
        lastName: 'Doe',
        isActive: true,
        country: COUNTRIES.AD,
        twoFactorSecret: 'mockTwoFactorSecret',
        phone: '+1234567890',
        dateOfBirth: new Date('1990-01-01'),
        email: 'jane.doe@example.com',

        password: 'PlainTextPassword123!',
        roleIds: [mockRoleId],
        storeIds: [mockStoreId],
      };
    });

    it('should successfully hash passwords, validate references, and create a user with complete role and store links', async () => {
      const generatedUserId = randomUUID();
      const mockSaltRounds = 10;
      mockEnvConfigService.passwordSaltRounds = mockSaltRounds;

      mockRoleHelper.checkIfManyExistOrThrow.mockResolvedValue([mockRoleId]);
      mockStoreHelper.checkIfManyExistOrThrow.mockResolvedValue([mockStoreId]);

      mockEntityManager.create.mockImplementation((entityClass, dto) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return dto;
      });

      mockEntityManager.save.mockImplementation((entityTarget, payload) => {
        if (entityTarget === User) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return
          return {
            ...payload,
            id: generatedUserId,
          };
        }
        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return Array.isArray(payload) ? payload : [payload];
      });

      const result = await service.create({
        createDto: baseCreateDto,
        createdById: mockCreatedById,
      });

      expect(mockUserHelper.isEmailUniqueOrThrow).toHaveBeenCalledWith({
        email: 'jane.doe@example.com',
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(
        'PlainTextPassword123!',
        mockSaltRounds,
      );
      expect(baseCreateDto.password).toBe(mockHashedPassword);

      expect(mockEntityManager.create).toHaveBeenCalledWith(
        User,
        baseCreateDto,
      );
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        User,
        expect.objectContaining({
          createdBy: { id: mockCreatedById },
        }),
      );

      expect(mockRoleHelper.checkIfManyExistOrThrow).toHaveBeenCalledWith([
        mockRoleId,
      ]);
      expect(mockStoreHelper.checkIfManyExistOrThrow).toHaveBeenCalledWith([
        mockStoreId,
      ]);

      expect(mockEntityManager.save).toHaveBeenCalledWith(UserRoles, [
        {
          user: { id: generatedUserId },
          role: { id: mockRoleId },
          assignedBy: { id: mockCreatedById },
        },
      ]);

      expect(mockEntityManager.save).toHaveBeenCalledWith(UserStores, [
        {
          user: { id: generatedUserId },
          store: { id: mockStoreId },
          assignedBy: { id: mockCreatedById },
        },
      ]);

      expect(result).toEqual(
        expect.objectContaining({
          id: generatedUserId,
          firstName: 'Jane',
          lastName: 'Doe',
          email: 'jane.doe@example.com',
          password: mockHashedPassword,
          createdBy: { id: mockCreatedById },
          userRoles: [
            { role: { id: mockRoleId }, assignedBy: { id: mockCreatedById } },
          ],
          userStores: [
            { store: { id: mockStoreId }, assignedBy: { id: mockCreatedById } },
          ],
        }),
      );
    });

    it('should completely skip intermediate junction saves if roleIds and storeIds arrays are empty', async () => {
      const generatedUserId = randomUUID();
      baseCreateDto.roleIds = [];
      baseCreateDto.storeIds = [];

      mockEntityManager.save.mockResolvedValue(
        Object.assign({ id: generatedUserId }, baseCreateDto),
      );

      const result = await service.create({
        createDto: baseCreateDto,
        createdById: mockCreatedById,
      });

      expect(mockEntityManager.save).toHaveBeenCalledWith(
        User,
        expect.any(Object),
      );

      expect(mockRoleHelper.checkIfManyExistOrThrow).not.toHaveBeenCalled();
      expect(mockStoreHelper.checkIfManyExistOrThrow).not.toHaveBeenCalled();
      expect(mockEntityManager.save).not.toHaveBeenCalledWith(
        UserRoles,
        expect.any(Array),
      );
      expect(mockEntityManager.save).not.toHaveBeenCalledWith(
        UserStores,
        expect.any(Array),
      );

      expect(result.userRoles).toBeUndefined();
      expect(result.userStores).toBeUndefined();
    });

    it('should successfully hash passwords, validate references, and create a user with complete role and store links', async () => {
      const generatedUserId = randomUUID();

      mockEntityManager.save.mockImplementation(
        getMockSaveHandler(generatedUserId),
      );

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      mockEntityManager.create.mockImplementation((entityClass, dto) => ({
        ...dto,
      }));

      const result = await service.create({
        createDto: baseCreateDto,
        createdById: mockCreatedById,
      });

      expect(mockUserHelper.isEmailUniqueOrThrow).toHaveBeenCalledWith({
        email: 'jane.doe@example.com',
      });
      expect(bcrypt.hash).toHaveBeenCalledWith('PlainTextPassword123!', 12);
      expect(baseCreateDto.password).toBe(mockHashedPassword);

      expect(mockDataSource.transaction).toHaveBeenCalled();

      expect(mockEntityManager.create).toHaveBeenCalledWith(
        User,
        baseCreateDto,
      );
      expect(mockEntityManager.save).toHaveBeenCalledWith(
        User,
        expect.objectContaining({
          createdBy: { id: mockCreatedById },
        }),
      );

      expect(mockRoleHelper.checkIfManyExistOrThrow).toHaveBeenCalledWith([
        mockRoleId,
      ]);
      expect(mockStoreHelper.checkIfManyExistOrThrow).toHaveBeenCalledWith([
        mockStoreId,
      ]);

      expect(mockEntityManager.save).toHaveBeenCalledWith(UserRoles, [
        {
          user: { id: generatedUserId },
          role: { id: mockRoleId },
          assignedBy: { id: mockCreatedById },
        },
      ]);

      expect(mockEntityManager.save).toHaveBeenCalledWith(UserStores, [
        {
          user: { id: generatedUserId },
          store: { id: mockStoreId },
          assignedBy: { id: mockCreatedById },
        },
      ]);

      expect(result).toEqual(
        expect.objectContaining({
          firstName: 'Jane',
          lastName: 'Doe',
          isActive: true,
          country: COUNTRIES.AD,
          twoFactorSecret: 'mockTwoFactorSecret',
          phone: '+1234567890',
          dateOfBirth: new Date('1990-01-01'),
          email: 'jane.doe@example.com',
          password: mockHashedPassword,
          roleIds: [mockRoleId],
          storeIds: [mockStoreId],
          createdBy: { id: mockCreatedById },
          userRoles: [
            { role: { id: mockRoleId }, assignedBy: { id: mockCreatedById } },
          ],
          userStores: [
            { store: { id: mockStoreId }, assignedBy: { id: mockCreatedById } },
          ],
        }),
      );
    });

    it('should pass core transaction rollback errors up the call stack if database operations reject', async () => {
      mockEntityManager.save.mockRejectedValue(
        new Error('QueryFailedError: Deadlock detected'),
      );

      await expect(
        service.create({
          createDto: baseCreateDto,
          createdById: mockCreatedById,
        }),
      ).rejects.toThrow('QueryFailedError: Deadlock detected');
    });
  });
});
