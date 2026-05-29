// /* eslint-disable @typescript-eslint/no-unnecessary-type-parameters */
// import { hasPermissions } from '@/authHelper/permission.helper';
// import { JWTPayload } from '@/authInterfaces/req.interface';
// import { DeleteResponseDto } from '@/baseDto/response.dto';
// import { UserAccessPermissions } from '@/baseInterface/query.request';
// import { AuthenticationGuard } from '@/commonGuards/auth.guard';
// import { PermissionsGuard } from '@/commonGuards/permission.guard';
// import {
//   CREATE_DEPARTMENT,
//   DELETE_DEPARTMENT,
//   READ_DEPARTMENT,
//   UPDATE_DEPARTMENT,
// } from '@/libConst/department.const';
// import {
//   CREATE_PERMISSION,
//   DELETE_PERMISSION,
//   READ_PERMISSION,
//   UPDATE_PERMISSION,
// } from '@/libConst/permission.const';
// import {
//   CREATE_ROLE,
//   DELETE_ROLE,
//   READ_ROLE,
//   UPDATE_ROLE,
// } from '@/libConst/role.const';
// import {
//   CREATE_USER,
//   CREATE_USER_ROLE,
//   DELETE_USER,
//   DELETE_USER_ROLE,
//   READ_USER,
//   READ_USER_ROLE,
//   UPDATE_USER,
//   UPDATE_USER_ROLE,
// } from '@/libConst/user.const';
// import { UseGuards } from '@nestjs/common';
// import { ApiBearerAuth } from '@nestjs/swagger';

// import { UUID } from 'crypto';

// @ApiBearerAuth('JWT-auth')
// @UseGuards(AuthenticationGuard, PermissionsGuard)
// export abstract class BaseController<
//   TCreateDto,
//   TFindByIdsQuery,
//   TSearchControl,
//   TUpdateDto,
//   TResponseDto,
//   TListResponseDto,
// > {
//   abstract create(
//     createDto: TCreateDto | TCreateDto[],
//     createdByUser: JWTPayload,
//   ): Promise<TResponseDto | TResponseDto[]>;

//   abstract findByIds(
//     query: TFindByIdsQuery,
//     requestedByUser: JWTPayload,
//   ): Promise<TListResponseDto>;

//   abstract search(
//     value: string,
//     control: TSearchControl,
//     requestedByUserId: UUID,
//   ): Promise<TListResponseDto>;

//   abstract updateById(id: UUID, updateDto: TUpdateDto): Promise<TResponseDto>;

//   abstract delete(
//     ids: UUID[],
//     requestedByUserId: UUID,
//   ): Promise<DeleteResponseDto>;
