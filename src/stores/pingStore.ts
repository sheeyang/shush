import { create } from 'zustand';
import {
  createProcessAction,
  killProcessAction,
  removeProcessAction,
  runProcessAction,
} from '../app/actions';
import { ProcessInfoClient } from '@/interfaces/process';

type PingStoreActions = {
  addCommandProcess: (
    command: string,
    args: string[],
    label: string,
  ) => Promise<void>;
  removeProcess: (processId: string) => Promise<void>;
  runProcess: (processId: string) => Promise<void>;
  killProcess: (processId: string) => Promise<void>;
  connectProcessStream: (processId: string) => Promise<void>;
};

type PingStore = {
  processes: { [key: string]: ProcessInfoClient };
  actions: PingStoreActions;
};

const usePingStore = create<PingStore>((set) => ({
  processes: {},

  actions: {
    addCommandProcess: async (
      command: string,
      args: string[],
      label: string,
    ) => {
      const { success, message, processId, processState } =
        await createProcessAction(command, args);

      if (!success) {
        throw new Error(message);
      }

      set((state) => ({
        processes: {
          ...state.processes,
          [processId]: { label, processState, data: '' },
        },
      }));
    },

    removeProcess: async (processId: string) => {
      const { success, message } = await removeProcessAction(processId);

      if (!success) {
        throw new Error(message);
      }

      set((state) => {
        const newProcesses = { ...state.processes };
        delete newProcesses[processId];
        return { processes: newProcesses };
      });
    },

    runProcess: async (processId: string) => {
      const { success, message, processState } =
        await runProcessAction(processId);

      if (!success) {
        throw new Error(message);
      }

      set((state) => ({
        processes: {
          ...state.processes,
          [processId]: { ...state.processes[processId], processState },
        },
      }));
    },

    killProcess: async (processId: string) => {
      const { success, message, processState } =
        await killProcessAction(processId);

      if (!success) {
        throw new Error(message);
      }

      set((state) => ({
        processes: {
          ...state.processes,
          [processId]: { ...state.processes[processId], processState },
        },
      }));
    },

    connectProcessStream: async (processId: string) => {
      try {
        const response = await fetch(`/api/connect/${processId}`);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || 'Failed to connect to process');
        }

        if (!response.body) {
          throw new Error('Response body is null');
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
          const { done, value } = await reader.read();

          if (done) {
            break;
          }

          const chunk = decoder.decode(value, { stream: true });
          // Update process state with the new data
          set((state) => {
            return {
              processes: {
                ...state.processes,
                [processId]: {
                  ...state.processes[processId],
                  data: state.processes[processId].data + chunk,
                },
              },
            };
          });
        }
      } catch (error) {
        throw new Error(
          error instanceof Error ? error.message : 'An unknown error occurred',
        );
      } finally {
        set((state) => {
          // Check if process was removed prematurely
          if (!state.processes[processId]) {
            return state;
          }

          return {
            processes: {
              ...state.processes,
              [processId]: {
                ...state.processes[processId],
                processState: 'terminated',
              },
            },
          };
        });
      }
    },
  },
}));

export const usePingProcesses = () => usePingStore((state) => state.processes);

export const usePingActions = () => usePingStore((state) => state.actions);
