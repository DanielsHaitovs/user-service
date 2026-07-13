import {
  CurrentUser,
  CurrentUserId,
  CurrentUserPermissions,
} from '@/commonDecorators/user.decorator';
import { type ExecutionContext, UnauthorizedException } from '@nestjs/common';

jest.mock('@nestjs/common', () => {
  const original = jest.requireActual('@nestjs/common');

  return {
    ...original,
    createParamDecorator: (factory: (...args: unknown[]) => unknown): unknown =>
      factory,
  } as Record<string, unknown>;
});

type MockedDecorator = (data: unknown, ctx: ExecutionContext) => unknown;

function createMockContext(userPayload: unknown): ExecutionContext {
  const mockRequest = { user: userPayload };
  return {
    switchToHttp: () => ({
      getRequest: () => mockRequest,
    }),
  } as unknown as ExecutionContext;
}

describe('CurrentUserId Decorator', () => {
  it('should successfully extract and return the user ID string from an authenticated request context', () => {
    const mockUser = { id: 'user-uuid-12345', permissions: ['READ_USER'] };
    const context = createMockContext(mockUser);

    const result = (CurrentUserId as unknown as MockedDecorator)(
      undefined,
      context,
    );

    expect(result).toBe('user-uuid-12345');
  });

  it('should throw an UnauthorizedException if the user payload object is missing from the request context', () => {
    const context = createMockContext(undefined);

    expect(() => {
      (CurrentUserId as unknown as MockedDecorator)(undefined, context);
    }).toThrow(UnauthorizedException);

    expect(() => {
      (CurrentUserId as unknown as MockedDecorator)(undefined, context);
    }).toThrow('User not authenticated');
  });
});

describe('CurrentUserPermissions Decorator', () => {
  it('should successfully extract and return the array of user permission strings from an authenticated request context', () => {
    const mockUser = {
      id: 'user-id',
      permissions: ['CREATE_ROLE', 'DELETE_ROLE'],
    };
    const context = createMockContext(mockUser);

    const result = (CurrentUserPermissions as unknown as MockedDecorator)(
      undefined,
      context,
    );

    expect(result).toEqual(['CREATE_ROLE', 'DELETE_ROLE']);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should throw an UnauthorizedException if the user payload object is missing from the request context', () => {
    const context = createMockContext(null);

    expect(() => {
      (CurrentUserPermissions as unknown as MockedDecorator)(
        undefined,
        context,
      );
    }).toThrow(UnauthorizedException);
  });
});

describe('CurrentUser Decorator', () => {
  it('should successfully extract and return the complete JwtPayload object from an authenticated request context', () => {
    const mockUser = {
      id: 'user-id',
      email: 'test@example.com',
      permissions: [],
    };
    const context = createMockContext(mockUser);

    const result = (CurrentUser as unknown as MockedDecorator)(
      undefined,
      context,
    );

    expect(result).toEqual(mockUser);
    expect(result).toHaveProperty('email', 'test@example.com');
  });

  it('should throw an UnauthorizedException if the user payload object is missing from the request context', () => {
    const context = createMockContext(undefined);

    expect(() => {
      (CurrentUser as unknown as MockedDecorator)(undefined, context);
    }).toThrow(UnauthorizedException);
  });
});
