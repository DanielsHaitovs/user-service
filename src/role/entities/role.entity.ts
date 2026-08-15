import { MecBaseEntity } from '@/base/mec.entity';
import { Permission } from '@/permissionEntities/permissions.entity';
import { User } from '@/userEntities/user.entity';
import { UserRoles } from '@/userEntities/userRoles.entity';

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
  Relation,
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

  @OneToMany(() => UserRoles, (userRole) => userRole.role)
  userRoles: Relation<UserRoles[]>;

  @ManyToMany(() => Permission, (permission) => permission.roles)
  @JoinTable({
    name: 'rolePermissions',
    joinColumn: { name: 'role_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'permission_id', referencedColumnName: 'id' },
  })
  permissions: Relation<Permission[]>;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'createdBy' })
  createdBy: Relation<User>;

  constructor(
    id: UUID,
    name: string,
    createdAt: Date,
    updatedAt: Date,
    permissions: Permission[],
    userRoles: UserRoles[],
    createdBy: User,
  ) {
    super(id, createdAt, updatedAt);
    this.name = name;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.permissions = permissions;
    this.userRoles = userRoles;
    this.createdBy = createdBy;
  }
}
