import { MecBaseEntity } from '@/base/mec.entity';
import { Departments } from '@/department/entities/department.entity';
import { User } from '@/user/entities/user.entity';

import { UUID } from 'crypto';
import { Entity, Index, ManyToOne } from 'typeorm';

@Entity('userDepartments')
@Index('IX_USER_DEPARTMENTS', ['user', 'department'])
export class UserDepartments extends MecBaseEntity {
  @ManyToOne(() => Departments, (department) => department.userDepartments)
  department: Departments;

  @ManyToOne(() => User, (user) => user.userRoles)
  user: User;

  @ManyToOne(() => User, { nullable: true })
  assignedBy: User;

  constructor(
    id: UUID,
    createdAt: Date,
    updatedAt: Date,
    assignedBy: User,
    department: Departments,
    user: User,
  ) {
    super(id, createdAt, updatedAt);
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.assignedBy = assignedBy;
    this.department = department;
    this.user = user;
  }
}
