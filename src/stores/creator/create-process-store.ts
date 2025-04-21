'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import {
  addProcessAction,
  getAllProcessesAction,
  killProcessAction,
  removeProcessAction,
  runProcessAction,
} from '../../actions/process-actions';
import { ProcessInfoClient } from '@/interfaces/process';
import { useShallow } from 'zustand/shallow';
import { devtools, persist } from 'zustand/middleware';
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

const middlewares = (
  f: StateCreator<ProcessStore, [['zustand/immer', never]], []>,
) =>
  devtools(
    immer(
      persist(f, {
        name: 'processes',
        partialize: (state) => ({
          processes: state.processes,
        }),
      }),
    ),
  );

export const createProcessStore = () => {
  const useStore = create<ProcessStore>()(
    middlewares((set, get) => ({
      // Add get to access state within actions
      processes: {},

      actions: {
        initializeStore: async () => {
          const response = await getAllProcessesAction();
          if (!response.success) {
            throw new Error(response.message);
          }

          set((state) => {
            state.processes = response.processes;
          });
        },

        addCommandProcess: async (
          command: string,
          args: string[],
          label: string,
        ) => {
          const response = await addProcessAction(command, args, label); // Update to pass label

          if (!response.success) {
            throw new Error(response.message);
          }

          set((state) => {
            // Initialize the new flag
            state.processes[response.processId] = {
              label,
              processState: response.processState,
              output: '',
              isConnectingStream: false,
            };
          });
        },

        removeProcess: async (processId: string) => {
          const { success, message } = await removeProcessAction(processId);

          if (!success) {
            throw new Error(message);
          }

          set((state) => {
            delete state.processes[processId];
          });
        },

        runProcess: async (processId: string) => {
          const response = await runProcessAction(processId);

          if (!response.success) {
            throw new Error(response.message);
          }

          set((state) => {
            state.processes[processId].processState = response.processState;
          });
        },

        killProcess: async (processId: string) => {
          const response = await killProcessAction(processId);

          if (!response.success) {
            throw new Error(response.message);
          }

          set((state) => {
            state.processes[processId].processState = response.processState;
          });
        },

        connectProcessStream: async (processId: string) => {
          const currentProcess = get().processes[processId];

          // Check if process exists and if already connecting
          if (currentProcess?.isConnectingStream) {
            return; // Prevent concurrent connection attempts
          }

          set((state) => {
            state.processes[processId].isConnectingStream = true;
          });

          try {
            const response = await fetch(`/api/connect/${processId}`);

            if (!response.ok) {
              throw new Error(`Failed to connect to process ${processId}`);
            }

            if (!response.body) {
              throw new Error('Response body is null');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            let output = '';

            while (true) {
              const { done, value } = await reader.read();

              if (done) {
                break; // Exit the loop
              }

              const chunk = decoder.decode(value, { stream: true });
              set((state) => {
                output += chunk;
                state.processes[processId].output = output;
              });
            }
          } catch (error) {
            console.error(`Error connecting stream for ${processId}:`, error);
            set((state) => {
              state.processes[processId].processState = 'error';
            });
          } finally {
            set((state) => {
              // Always unset the flag when the attempt finishes (success, error, or cancellation)
              state.processes[processId].isConnectingStream = false;
              if (state.processes[processId].processState === 'running') {
                state.processes[processId].processState = 'terminated';
              }
              // console.log(`Stream finished for ${processId}`);
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
