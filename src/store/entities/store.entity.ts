import { MecBaseEntity } from '@/base/mec.entity';
import { User } from '@/userEntities/user.entity';
import { UserStores } from '@/userEntities/userStores.entity';

import { IsNotEmpty, IsString } from 'class-validator';
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

@Entity('stores')
@Unique('UQ_STORE_ID', ['id'], { deferrable: 'INITIALLY IMMEDIATE' })
@Unique('UQ_STORE_NAME', ['name'], { deferrable: 'INITIALLY IMMEDIATE' })
@Unique('UQ_STORE_CODE', ['code'], { deferrable: 'INITIALLY IMMEDIATE' })
@Unique('UQ_STORE_VIEW_CODE', ['viewCode'], {
  deferrable: 'INITIALLY IMMEDIATE',
})
@Index('IX_STORE_ID_NAME', ['id', 'name'])
@Index('IX_STORE_ID_CODE', ['id', 'code'])
@Index('IX_STORE_ID_VIEW_CODE', ['id', 'viewCode'])
@Index('IX_STORE_ID_CODE_VIEW_CODE', ['id', 'code', 'viewCode'])
@Index('IX_STORE_NAME_CREATED_BY', ['name', 'createdBy'])
export class Store extends MecBaseEntity {
  @Column({ length: 100 })
  @IsNotEmpty()
  @IsString()
  name: string;

  @Column({ length: 100 })
  @IsNotEmpty()
  @IsString()
  code: string;

  @Column({ length: 100 })
  @IsNotEmpty()
  @IsString()
  viewCode: string;

  @OneToMany(() => UserStores, (userStore) => userStore.stores)
  userStores: UserStores[];

  @ManyToOne(() => User, { nullable: false })
  @JoinColumn({ name: 'createdBy' })
  createdBy: User;

  constructor(
    id: UUID,
    createdAt: Date,
    updatedAt: Date,
    name: string,
    code: string,
    viewCode: string,
    userStores: UserStores[],
    createdBy: User,
  ) {
    super(id, createdAt, updatedAt);
    this.id = id;
    this.name = name;
    this.code = code;
    this.viewCode = viewCode;
    this.userStores = userStores;
    this.createdBy = createdBy;
    this.createdAt = createdAt;
    this.updatedAt = updatedAt;
  }
}
