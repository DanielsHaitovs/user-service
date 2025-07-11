import { MecBaseEntity } from '@/base/mec.entity';
import { User } from '@/user/entities/user.entity';

import { IsNotEmpty, IsString } from 'class-validator';
import { UUID } from 'crypto';
import { Column, Entity, ManyToOne, Unique } from 'typeorm';

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

  @ManyToOne(() => User, (user) => user.departments, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  user?: User;

  constructor(
    id: UUID,
    name: string,
    country: string,
    user: User,
    createdAt: Date,
    updatedAt: Date,
  ) {
    super(id, createdAt, updatedAt);
    this.id = id;
    this.name = name;
    this.country = country;
    this.user = user;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
