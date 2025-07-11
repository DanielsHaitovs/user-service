import { MecBaseEntity } from '@/base/mec.entity';
import { Role } from '@/role/entities/role.entity';
import { User } from '@/user/entities/user.entity';

import { UUID } from 'crypto';
import { Entity, ManyToOne } from 'typeorm';

@Entity('userRole')
export class UserRole extends MecBaseEntity {
  @ManyToOne(() => Role, (role) => role.userRoles)
  role: Role;

  @ManyToOne(() => User, (user) => user.userRoles)
  user: User;

  @ManyToOne(() => User, { nullable: true })
  assignedBy: User;

  constructor(
    id: UUID,
    createdAt: Date,
    updatedAt: Date,
    assignedBy: User,
    role: Role,
    user: User,
  ) {
    super(id, createdAt, updatedAt);
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.assignedBy = assignedBy;
    this.role = role;
    this.user = user;
  }
}
