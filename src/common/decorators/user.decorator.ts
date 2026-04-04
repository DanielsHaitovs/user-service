// import type {
//   JWTPayload,
//   RequestWithUserPermissions,
// } from '@/authInterfaces/req.interface';
// import { createParamDecorator, type ExecutionContext } from '@nestjs/common';

// export const CurrentUserId = createParamDecorator(
//   (_data: unknown, ctx: ExecutionContext): string => {
//     const request = ctx.switchToHttp().getRequest<RequestWithUserPermissions>();
//     return request.user.id;
//   },
// );

// export const CurrentUserPermissions = createParamDecorator(
//   (_data: unknown, ctx: ExecutionContext): string[] => {
//     const request = ctx.switchToHttp().getRequest<RequestWithUserPermissions>();
//     return request.user.permissions;
//   },
// );

// export const CurrentUser = createParamDecorator(
//   (_data: unknown, ctx: ExecutionContext): JWTPayload => {
//     const request = ctx.switchToHttp().getRequest<RequestWithUserPermissions>();
//     return request.user;
//   },
// );
