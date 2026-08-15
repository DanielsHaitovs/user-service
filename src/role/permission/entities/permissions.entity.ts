import { MecBaseEntity } from '@/base/mec.entity';
import { Roles } from '@/roleEntities/role.entity';
import { User } from '@/userEntities/user.entity';

import { IsNotEmpty, IsString } from 'class-validator';
import { UUID } from 'crypto';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  Relation,
  Unique,
} from 'typeorm';

@Entity('permissions')
@Unique('UQ_PERMISSION_CODE', ['code'])
@Unique('UQ_PERMISSION_NAME', ['name'])
@Index('IX_PERMISSIONS_CODE_CREATEDBY', ['code', 'createdBy'])
@Index('IX_PERMISSIONS_NAME_CREATEDBY', ['name', 'createdBy'])
@Index('IX_PERMISSIONS_NAME_CODE_CREATEDBY', ['name', 'code', 'createdBy'])
export class Permission extends MecBaseEntity {
  @Column({ length: 100 })
  @IsNotEmpty()
  @IsString()
  code: string;

  @Column({ length: 100 })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ManyToMany(() => Roles, (role) => role.permissions)
  roles: Relation<Roles[]>;

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'createdBy' })
  createdBy: Relation<User>;

  constructor(
    id: UUID,
    createdAt: Date,
    updatedAt: Date,
    name: string,
    code: string,
    roles: Roles[],
    createdBy: User,
  ) {
    super(id, createdAt, updatedAt);
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.name = name;
    this.code = code;
    this.roles = roles;
    this.createdBy = createdBy;
  }
}
