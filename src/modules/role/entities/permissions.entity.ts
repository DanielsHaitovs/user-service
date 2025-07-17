import { MecBaseEntity } from '@/base/mec.entity';
import { Role } from '@/role/entities/role.entity';

import { IsNotEmpty, IsString } from 'class-validator';
import { UUID } from 'crypto';
import { Column, Entity, ManyToMany, Unique } from 'typeorm';

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

  constructor(
    name: string,
    code: string,
    roles: Role[],
    id: UUID,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt);
    this.name = name;
    this.code = code;
    this.roles = roles;
  }
}
