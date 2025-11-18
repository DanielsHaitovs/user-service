import { MecBaseEntity } from '@/base/mec.entity';
import { User } from '@/user/entities/user.entity';

import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UUID } from 'crypto';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  Unique,
} from 'typeorm';

import { COUNTRIES } from '../../../lib/const/countries.const';

@Entity('departments')
@Unique('UQ_DEPARTMENT_NAME', ['name'], { deferrable: 'INITIALLY IMMEDIATE' })
@Index('IX_DEPARTMENT_COUNTRY_NAME', ['country', 'name'])
@Index('IX_DEPARTMENT_NAME_CREATED_BY', ['name', 'createdBy'])
@Index('IX_DEPARTMENT_COUNTRY_CREATED_BY', ['country', 'createdBy'])
@Index('IX_DEPARTMENT_COUNTRY_NAME_CREATED_BY', [
  'country',
  'name',
  'createdBy',
])
export class Departments extends MecBaseEntity {
  @Column({ length: 100 })
  @IsNotEmpty()
  @IsString()
  name: string;

  @Column({ type: 'enum', enum: Object.values(COUNTRIES) })
  @IsNotEmpty()
  @IsEnum(COUNTRIES)
  country: keyof typeof COUNTRIES;

  @ManyToMany(() => User, (user) => user.departments)
  users: User[];

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'createdBy' })
  createdBy: User;

  constructor(
    id: UUID,
    createdAt: Date,
    updatedAt: Date,
    name: string,
    country: keyof typeof COUNTRIES,
    users: User[],
    createdBy: User,
  ) {
    super(id, createdAt, updatedAt);
    this.id = id;
    this.name = name;
    this.country = country;
    this.users = users;
    this.createdBy = createdBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
