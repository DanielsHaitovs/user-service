import { MecBaseEntity } from '@/base/mec.entity';
import { User } from '@/user/entities/user.entity';

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

@Entity('department')
@Unique('UQ_DEPARTMENT_NAME', ['name'], { deferrable: 'INITIALLY IMMEDIATE' })
export class Department extends MecBaseEntity {
  @Column({ length: 100 })
  @IsNotEmpty()
  @IsString()
  name: string;

  @Column({ length: 100 })
  @IsNotEmpty()
  @IsString()
  country: string;

  @ManyToMany(() => User, (user) => user.department)
  user: User[];

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'createdBy' })
  createdBy?: User;

  constructor(
    id: UUID,
    createdAt: Date,
    updatedAt: Date,
    name: string,
    country: string,
    user: User[],
    createdBy: User,
  ) {
    super(id, createdAt, updatedAt);
    this.id = id;
    this.name = name;
    this.country = country;
    this.user = user;
    this.createdBy = createdBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
