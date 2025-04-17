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
    middlewares((set, get) => ({
      // Add get to access state within actions
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
            // Initialize the new flag
            state.processes[processId] = {
              label,
              processState,
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
          // Access current state using get()
          const currentProcess = get().processes[processId];

          // Check if process exists and if already connecting
          if (!currentProcess || currentProcess.isConnectingStream) {
            console.log(
              `Stream connection for ${processId} already in progress or process removed.`,
            );
            return; // Prevent concurrent connection attempts
          }

          // Set flag to indicate connection attempt is starting
          set((state) => {
            if (state.processes[processId]) {
              state.processes[processId].isConnectingStream = true;
              // Reset output only when starting a new connection attempt
              state.processes[processId].output = '';
            }
          });

          try {
            const response = await fetch(`/api/connect/${processId}`);

            if (!response.ok) {
              throw new Error(`Failed to connect to process ${processId}`);
            }

            const processStateHeader = response.headers.get(
              'X-Process-State',
            ) as ProcessState;

            if (processStateHeader) {
              set((state) => {
                // Check process still exists before updating state
                if (state.processes[processId]) {
                  state.processes[processId].processState = processStateHeader;
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
                // Stream finished successfully
                set((state) => {
                  if (state.processes[processId]) {
                    // Only set to terminated if it was previously running
                    if (state.processes[processId].processState === 'running') {
                      state.processes[processId].processState = 'terminated';
                    }
                  }
                });
                console.log(`Stream finished for ${processId}`);
                break; // Exit the loop
              }

              const chunk = decoder.decode(value, { stream: true });
              set((state) => {
                if (state.processes[processId]) {
                  state.processes[processId].output += chunk;
                } else {
                  // Process might have been removed while streaming
                  console.warn(
                    `Process ${processId} removed while streaming output.`,
                  );
                  reader.cancel('Process removed'); // Attempt to cancel the reader
                  return; // Exit update logic
                }
              });
            }
          } catch (error) {
            console.error(`Error connecting stream for ${processId}:`, error);
            set((state) => {
              if (state.processes[processId]) {
                // Set state to terminated or a specific error state on failure
                state.processes[processId].processState = 'error'; // Or 'error' if you add that state
              }
            });
            // Re-throw the error if needed for upstream handling
            throw new Error(
              error instanceof Error
                ? error.message
                : 'An unknown error occurred during stream connection',
            );
          } finally {
            // Always unset the flag when the attempt finishes (success, error, or cancellation)
            set((state) => {
              if (state.processes[processId]) {
                state.processes[processId].isConnectingStream = false;
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
