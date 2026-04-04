import { MecBaseEntity } from '@/base/mec.entity';
import { Departments } from '@/departmentEntities/department.entity';
import { User } from '@/userEntities/user.entity';

import { UUID } from 'crypto';
import { Entity, Index, ManyToOne } from 'typeorm';

@Entity('userDepartments')
@Index('IX_USER_DEPARTMENTS', ['users', 'departments'])
export class UserDepartments extends MecBaseEntity {
  @ManyToOne(() => Departments, (department) => department.userDepartments)
  departments: Departments;

  @ManyToOne(() => User, (user) => user.userRoles)
  users: User;

  @ManyToOne(() => User, { nullable: true })
  assignedBy: User;

  constructor(
    id: UUID,
    createdAt: Date,
    updatedAt: Date,
    assignedBy: User,
    departments: Departments,
    users: User,
  ) {
    super(id, createdAt, updatedAt);
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.assignedBy = assignedBy;
    this.departments = departments;
    this.users = users;
  }
}
