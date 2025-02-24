import type { BaseStorage } from '../base/index.js';
import { createStorage, StorageEnum } from '../base/index.js';

type Status = 'on' | 'off';

type StatusStorage = BaseStorage<Status> & {
  toggle: () => Promise<void>;
};

const storage = createStorage<Status>('summary-status-storage-key', 'on', {
  storageEnum: StorageEnum.Local,
  liveUpdate: true,
});

export const aiSummaryStatus: StatusStorage = {
  ...storage,
  toggle: async () => {
    await storage.set(currentStatus => {
      return currentStatus === 'on' ? 'off' : 'on';
    });
  },
};
