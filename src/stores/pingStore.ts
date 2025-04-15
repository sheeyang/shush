import { useShallow } from 'zustand/shallow';
import { createProcessStore } from './creator/createProcessStore';

const usePingStore = createProcessStore();

// Update the selector to derive IDs from processes
export const usePingProcessIds = () =>
  usePingStore(useShallow((state) => Object.keys(state.processes)));

export const usePingProcess = (processId: string) =>
  usePingStore((state) => state.processes[processId]);

export const usePingActions = () => usePingStore((state) => state.actions);
