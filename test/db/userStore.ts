import { Store } from '@/storeEntities/store.entity';
import { User } from '@/userEntities/user.entity';
import { UserStores } from '@/userEntities/userStores.entity';

import type { UUID } from 'crypto';
import type { DataSource } from 'typeorm';

export async function assignStoreToUser({
  dataSource,
  userId,
  storeId,
}: {
  dataSource: DataSource;
  userId: UUID;
  storeId: UUID;
}): Promise<UserStores> {
  const userRepository = dataSource.getRepository(User);
  const storeRepository = dataSource.getRepository(Store);
  const userStoreRepository = dataSource.getRepository(UserStores);

  const user = await userRepository.findOneByOrFail({ id: userId });
  const store = await storeRepository.findOneByOrFail({ id: storeId });

  const userStore = userStoreRepository.create({
    user,
    store,
  });

  return await userStoreRepository.save(userStore);
}
