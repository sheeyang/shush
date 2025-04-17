'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  addProcessAction,
  getAllProcessesAction,
  killProcessAction,
  removeProcessAction,
  runProcessAction,
} from '../../actions/processActions';
import { ProcessInfoClient, ProcessState } from '@/interfaces/process';
import { useShallow } from 'zustand/shallow';
import { devtools } from 'zustand/middleware';
import { StateCreator } from 'zustand';

type ProcessStoreActions = {
  initializeStore: () => Promise<void>;
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
  processes: Record<string, ProcessInfoClient>;
  actions: ProcessStoreActions;
};

const middlewares = <T>(f: StateCreator<T, [['zustand/immer', never]], []>) =>
  devtools(immer(f));

export const createProcessStore = () => {
  const useStore = create<ProcessStore>()(
    middlewares((set) => ({
      processes: {},

      actions: {
        initializeStore: async () => {
          const processes = await getAllProcessesAction();
          set((state) => {
            state.processes = processes;
          });
        },

        addCommandProcess: async (
          command: string,
          args: string[],
          label: string,
        ) => {
          const { success, message, processId, processState } =
            await addProcessAction(command, args, label); // Update to pass label

          if (!success) {
            throw new Error(message);
          }

          set((state) => {
            state.processes[processId] = { label, processState, output: '' };
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
                state.processes[processId].processState = processState;
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
              if (state.processes[processId]) {
                state.processes[processId].processState = 'terminated';
              }
            });
          }
        },
      },
    })),
  );

  // Create and return selectors along with the store
  return {
    useStore,
    useProcessIds: () =>
      useStore(useShallow((state) => Object.keys(state.processes))),
    useProcessState: (processId: string) =>
      useStore((state) => state.processes[processId].processState),
    useProcessOutput: (processId: string) =>
      useStore((state) => state.processes[processId].output),
    useProcessLabel: (processId: string) =>
      useStore((state) => state.processes[processId].label),
    useActions: () => useStore((state) => state.actions),
  };
};
