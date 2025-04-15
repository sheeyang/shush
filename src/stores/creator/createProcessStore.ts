import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  addProcessAction,
  killProcessAction,
  removeProcessAction,
  runProcessAction,
} from '../../actions/processActions';
import { ProcessInfoClient, ProcessState } from '@/interfaces/process';
import { useShallow } from 'zustand/shallow';
import { devtools } from 'zustand/middleware';
import { StateCreator } from 'zustand';

type ProcessStoreActions = {
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

type ProcessStore = {
  processes: { [key: string]: ProcessInfoClient };
  actions: ProcessStoreActions;
};

const middlewares = <T>(f: StateCreator<T, [['zustand/immer', never]], []>) =>
  devtools(immer(f));

export const createProcessStore = () =>
  create<ProcessStore>()(
    middlewares((set) => ({
      processes: {},

      actions: {
        addCommandProcess: async (
          command: string,
          args: string[],
          label: string,
        ) => {
          const { success, message, processId, processState } =
            await addProcessAction(command, args);

          if (!success) {
            throw new Error(message);
          }

          set((state) => {
            state.processes[processId] = { label, processState, output: '' };
            // Remove processIds update
          });
        },

        removeProcess: async (processId: string) => {
          const { success, message } = await removeProcessAction(processId);

          if (!success) {
            throw new Error(message);
          }

          set((state) => {
            delete state.processes[processId];
            // Remove processIds update
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

            // Extract the process state from the response headers
            const processState = response.headers.get(
              'X-Process-State',
            ) as ProcessState;

            if (processState) {
              set((state) => {
                if (state.processes[processId]) {
                  state.processes[processId].processState = processState;
                }
              });
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
                  state.processes[processId].output += chunk;
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

// // Update the selector to derive IDs from processes
// export const usePingProcessIds = () =>
//   usePingStore(useShallow((state) => Object.keys(state.processes)));

// export const usePingProcess = (processId: string) =>
//   usePingStore((state) => state.processes[processId]);

// export const usePingActions = () => usePingStore((state) => state.actions);
