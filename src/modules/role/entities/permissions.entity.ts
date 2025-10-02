import { MecBaseEntity } from '@/base/mec.entity';
import { Role } from '@/role/entities/role.entity';

import { IsNotEmpty, IsString } from 'class-validator';
import { UUID } from 'crypto';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  Unique,
} from 'typeorm';

import { User } from '../../user/entities/user.entity';

@Entity('permissions')
@Unique('UQ_PERMISSION', ['name', 'code'], {
  deferrable: 'INITIALLY IMMEDIATE',
})
export class Permission extends MecBaseEntity {
  @Column({ length: 100 })
  @IsNotEmpty()
  @IsString()
  code: string;

  @Column({ length: 100 })
  @IsNotEmpty()
  @IsString()
  name: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  roles: Role[];

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'createdBy' })
  createdBy: User;

  constructor(
    id: UUID,
    createdAt: Date,
    updatedAt: Date,
    name: string,
    code: string,
    roles: Role[],
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
