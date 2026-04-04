import { MecBaseEntity } from '@/base/mec.entity';
import { Store } from '@/storeEntities/store.entity';
import { User } from '@/userEntities/user.entity';

import { UUID } from 'crypto';
import { Entity, Index, ManyToOne } from 'typeorm';

@Entity('userStores')
@Index('IX_USER_STORES', ['users', 'stores'])
export class UserStores extends MecBaseEntity {
  @ManyToOne(() => Store, (store) => store.userStores)
  stores: Store;

  @ManyToOne(() => User, (user) => user.userStores)
  users: User;

  @ManyToOne(() => User, { nullable: true })
  assignedBy: User;

  constructor(
    id: UUID,
    createdAt: Date,
    updatedAt: Date,
    assignedBy: User,
    stores: Store,
    users: User,
  ) {
    super(id, createdAt, updatedAt);
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.assignedBy = assignedBy;
    this.stores = stores;
    this.users = users;
  }
}
