import { createProcessStore } from './creator/createProcessStore';

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
