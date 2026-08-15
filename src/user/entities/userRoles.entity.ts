import { MecBaseEntity } from '@/base/mec.entity';
import { Roles } from '@/roleEntities/role.entity';
import { User } from '@/userEntities/user.entity';

import { UUID } from 'crypto';
import { Entity, Index, ManyToOne, Relation } from 'typeorm';

@Entity('userRoles')
@Index('IX_USER_ROLES', ['user', 'role'])
export class UserRoles extends MecBaseEntity {
  @ManyToOne(() => Roles, (role) => role.userRoles)
  role: Relation<Roles>;

  @ManyToOne(() => User, (user) => user.userRoles)
  user: Relation<User>;

  @ManyToOne(() => User, { nullable: true })
  assignedBy: Relation<User>;

  constructor(
    id: UUID,
    createdAt: Date,
    updatedAt: Date,
    assignedBy: User,
    role: Roles,
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
