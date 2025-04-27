'use client';

import { createProcessStore } from './creators/create-process-store';

const {
  useProcessIds: usePingProcessIds,
  useProcessState: usePingProcessState,
  useProcessOutput: usePingProcessOutput,
  useProcessLabel: usePingProcessLabel,
  useActions: usePingActions,
} = createProcessStore();

export {
  usePingProcessIds,
  usePingProcessState,
  usePingProcessOutput,
  usePingProcessLabel,
  usePingActions,
};
