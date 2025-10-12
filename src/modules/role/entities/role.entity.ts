import { MecBaseEntity } from '@/base/mec.entity';
import { Permission } from '@/role/entities/permissions.entity';
import { User } from '@/user/entities/user.entity';

import { IsNotEmpty, IsString } from 'class-validator';
import { UUID } from 'crypto';
import {
  Column,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
} from 'typeorm';

@Entity('role')
export class Role extends MecBaseEntity {
  @Column({ length: 100 })
  @IsNotEmpty()
  @IsString()
  name: string;

  // @OneToMany(() => UserRole, (userRole) => userRole.roles)
  // userRoles: UserRole[];

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
    // userRoles: UserRole[],
    createdBy: User,
  ) {
    super(id, createdAd, updatedAt);
    this.name = name;
    this.createdAt = createdAd;
    this.updatedAt = updatedAt;
    this.permissions = permissions;
    // this.userRoles = userRoles;
    this.createdBy = createdBy;
  }
}
