import { MecBaseEntity } from '@/base/mec.entity';
import { Roles } from '@/roleEntities/role.entity';
import { User } from '@/userEntities/user.entity';

import { UUID } from 'crypto';
import { Entity, Index, ManyToOne } from 'typeorm';

@Entity('userRoles')
@Index('IX_USER_ROLES', ['users', 'roles'])
export class UserRoles extends MecBaseEntity {
  @ManyToOne(() => Roles, (role) => role.userRoles)
  roles: Roles;

  @ManyToOne(() => User, (user) => user.userRoles)
  users: User;

  @ManyToOne(() => User, { nullable: true })
  assignedBy: User;

  constructor(
    id: UUID,
    createdAt: Date,
    updatedAt: Date,
    assignedBy: User,
    roles: Roles,
    users: User,
  ) {
    super(id, createdAt, updatedAt);
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.assignedBy = assignedBy;
    this.roles = roles;
    this.users = users;
  }
}
