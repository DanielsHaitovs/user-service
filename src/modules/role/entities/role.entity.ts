import { MecBaseEntity } from '@/base/mec.entity';
import { Permission } from '@/role/entities/permissions.entity';
import { UserRole } from '@/user/entities/userRoles.entity';

import { IsNotEmpty, IsString } from 'class-validator';
import { UUID } from 'crypto';
import { Column, Entity, OneToMany } from 'typeorm';

@Entity('role')
export class Role extends MecBaseEntity {
  @Column({ length: 100 })
  @IsNotEmpty()
  @IsString()
  name: string;

  @OneToMany(() => UserRole, (userRole) => userRole.role)
  userRoles: UserRole[];

  @OneToMany(() => Permission, (permission) => permission.role)
  permissions?: Permission[];

  constructor(
    id: UUID,
    name: string,
    createdAd: Date,
    updatedAt: Date,
    permissions: Permission[],
    userRoles: UserRole[],
  ) {
    super(id, createdAd, updatedAt);
    this.name = name;
    this.createdAt = createdAd;
    this.updatedAt = updatedAt;
    this.permissions = permissions;
    this.userRoles = userRoles;
  }
}
