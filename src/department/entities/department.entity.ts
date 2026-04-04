import { MecBaseEntity } from '@/base/mec.entity';
import { COUNTRIES } from '@/libConst/countries.const';
import { User } from '@/userEntities/user.entity';
import { UserDepartments } from '@/userEntities/userDepartments.entity';

import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UUID } from 'crypto';
import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';

@Entity('departments')
@Unique('UQ_DEPARTMENT_ID', ['id'], { deferrable: 'INITIALLY IMMEDIATE' })
@Unique('UQ_DEPARTMENT_NAME', ['name'], { deferrable: 'INITIALLY IMMEDIATE' })
@Index('IX_DEPARTMENT_ID_NAME', ['id', 'name'])
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

  @Column({ type: 'enum', enum: COUNTRIES })
  @IsNotEmpty()
  @IsEnum(COUNTRIES)
  country: COUNTRIES;

  @OneToMany(
    () => UserDepartments,
    (userDepartment) => userDepartment.departments,
  )
  userDepartments: UserDepartments[];

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'createdBy' })
  createdBy: User;

  constructor(
    id: UUID,
    createdAt: Date,
    updatedAt: Date,
    name: string,
    country: COUNTRIES,
    userDepartments: UserDepartments[],
    createdBy: User,
  ) {
    super(id, createdAt, updatedAt);
    this.id = id;
    this.name = name;
    this.country = country;
    this.userDepartments = userDepartments;
    this.createdBy = createdBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
