import { create } from 'zustand';
import { createProcessAction, removeProcessAction } from '../actions';

type ProcessInfo = {
  processId: string;
  label: string;
};

type PingStoreActions = {
  addProcess: (processId: string, label: string) => void;
  addCommandProcess: (
    command: string,
    args: string[],
    label: string,
  ) => Promise<void>;
  removeProcess: (processId: string) => Promise<void>;
};

type PingStore = {
  processes: ProcessInfo[];
  actions: PingStoreActions;
};

const usePingStore = create<PingStore>((set) => ({
  processes: [],

  actions: {
    addProcess: (processId: string, label: string) => {
      set((state) => ({
        processes: [...state.processes, { processId, label }],
      }));
    },

    addCommandProcess: async (
      command: string,
      args: string[],
      label: string,
    ) => {
      const { success, message, processId } = await createProcessAction(
        command,
        args,
      );

      if (!success) {
        throw new Error(message);
      }

      set((state) => ({
        processes: [...state.processes, { processId, label }],
      }));
    },

    removeProcess: async (processId: string) => {
      const { success, message } = await removeProcessAction(processId);

      if (!success) {
        throw new Error(message);
      }

      set((state) => ({
        processes: state.processes.filter(
          (process) => process.processId !== processId,
        ),
      }));
    },
  },
}));

export const useProcesses = () => usePingStore((state) => state.processes);

export const useAddProcess = () =>
  usePingStore((state) => state.actions.addProcess);

export const useAddCommandProcess = () =>
  usePingStore((state) => state.actions.addCommandProcess);

export const useRemoveProcess = () =>
  usePingStore((state) => state.actions.removeProcess);
