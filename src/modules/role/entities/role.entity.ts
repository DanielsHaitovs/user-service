import { MecBaseEntity } from '@/base/mec.entity';
import { Permission } from '@/roleEntities/permissions.entity';
import { User } from '@/userEntities/user.entity';
import { UserRole } from '@/userEntities/userRoles.entity';

import { IsNotEmpty, IsString } from 'class-validator';
import { UUID } from 'crypto';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';

@Entity('roles')
@Unique('UQ_ROLE_NAME', ['name'])
@Index('IX_ROLE_NAME_CREATEDBY', ['name', 'createdBy'])
export class Roles extends MecBaseEntity {
  @Column({ length: 100 })
  @IsNotEmpty()
  @IsString()
  name: string;

  @OneToMany(() => UserRole, (userRole) => userRole.roles)
  userRoles: UserRole[];

  @ManyToMany(() => Permission, (permission) => permission.roles)
  @JoinTable({
    name: 'roles_permissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Permission[];

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'createdBy' })
  createdBy: User;

  constructor(
    id: UUID,
    name: string,
    createdAd: Date,
    updatedAt: Date,
    permissions: Permission[],
    userRoles: UserRole[],
    createdBy: User,
  ) {
    super(id, createdAd, updatedAt);
    this.name = name;
    this.createdAt = createdAd;
    this.updatedAt = updatedAt;
    this.permissions = permissions;
    this.userRoles = userRoles;
    this.createdBy = createdBy;
  }
}
