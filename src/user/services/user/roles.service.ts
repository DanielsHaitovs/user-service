import { RoleHelperService } from '@/roleServices/helper.service';
import { UserHelperService } from '@/userService/user/helper.service.';
import { Injectable } from '@nestjs/common';

import { DataSource } from 'typeorm';

@Injectable()
export class UserRolesService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly userHelper: UserHelperService,
    private readonly roleHelper: RoleHelperService,
  ) {}

  // getUserRoles(userId: string): UserResponseDto {
  //   return {} as UserResponseDto;
  // }
}
