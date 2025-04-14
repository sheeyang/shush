import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
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
  processIds: string[]; // Keep a seperated array for IDs so we can use it to iterate over
  actions: PingStoreActions;
};

const usePingStore = create<PingStore>()(
  immer((set) => ({
    processes: {},
    processIds: [], // Initialize the array

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

        set((state) => {
          state.processes[processId] = { label, processState, data: '' };
          state.processIds = Object.keys(state.processes); // Update the IDs array
        });
      },

      removeProcess: async (processId: string) => {
        const { success, message } = await removeProcessAction(processId);

        if (!success) {
          throw new Error(message);
        }

        set((state) => {
          delete state.processes[processId];
          state.processIds = Object.keys(state.processes); // Update the IDs array
        });
      },

      runProcess: async (processId: string) => {
        const { success, message, processState } =
          await runProcessAction(processId);

        if (!success) {
          throw new Error(message);
        }

        set((state) => {
          state.processes[processId].processState = processState;
        });
      },

      killProcess: async (processId: string) => {
        const { success, message, processState } =
          await killProcessAction(processId);

        if (!success) {
          throw new Error(message);
        }

        set((state) => {
          state.processes[processId].processState = processState;
        });
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
              if (state.processes[processId]) {
                state.processes[processId].data += chunk;
              }
            });
          }
        } catch (error) {
          throw new Error(
            error instanceof Error
              ? error.message
              : 'An unknown error occurred',
          );
        } finally {
          set((state) => {
            // Check if process was removed prematurely
            if (state.processes[processId]) {
              state.processes[processId].processState = 'terminated';
            }
          });
        }
      },
    },
  })),
);

// Update the selector to use the dedicated array
export const usePingProcessIds = () =>
  usePingStore((state) => state.processIds);

export const usePingProcess = (processId: string) =>
  usePingStore((state) => state.processes[processId]);

export const usePingActions = () => usePingStore((state) => state.actions);
