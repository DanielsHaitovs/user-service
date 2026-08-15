import { MecBaseEntity } from '@/base/mec.entity';
import { Store } from '@/storeEntities/store.entity';
import { User } from '@/userEntities/user.entity';

import { UUID } from 'crypto';
import { Entity, Index, ManyToOne, Relation } from 'typeorm';

@Entity('userStores')
@Index('IX_USER_STORES', ['user', 'store'])
export class UserStores extends MecBaseEntity {
  @ManyToOne(() => Store, (store) => store.userStores)
  store: Relation<Store>;

  @ManyToOne(() => User, (user) => user.userStores)
  user: Relation<User>;

  @ManyToOne(() => User, { nullable: true })
  assignedBy: Relation<User>;

  constructor(
    id: UUID,
    createdAt: Date,
    updatedAt: Date,
    assignedBy: User,
    store: Store,
    user: User,
  ) {
    super(id, createdAt, updatedAt);
    this.id = id;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
    this.assignedBy = assignedBy;
    this.store = store;
    this.user = user;
  }
}
