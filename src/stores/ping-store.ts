'use client';

import { createProcessStore } from './creator/create-process-store';

const {
  useStore: usePingStore,
  useProcessIds: usePingProcessIds,
  useProcessState: usePingProcessState,
  useProcessOutput: usePingProcessOutput,
  useProcessLabel: usePingProcessLabel,
  useActions: usePingActions,
} = createProcessStore();

export {
  usePingStore,
  usePingProcessIds,
  usePingProcessState,
  usePingProcessOutput,
  usePingProcessLabel,
  usePingActions,
};
