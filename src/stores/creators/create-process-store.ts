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
import createJsonParseStream from '@/lib/create-json-parse-stream';

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
          const processId = await addProcessAction(command, args, label); // Update to pass label

          set((state) => {
            // Initialize the new flag
            state.processes[processId] = {
              label,
              processState: 'initialized',
              output: '',
              isConnectingStream: false,
            };
          });
        },

        removeProcess: async (processId: string) => {
          await removeProcessAction(processId);

          set((state) => {
            delete state.processes[processId];
          });
        },

        runProcess: async (processId: string) => {
          await runProcessAction(processId);

          set((state) => {
            state.processes[processId].processState = 'running';
          });
        },

        killProcess: async (processId: string) => {
          await killProcessAction(processId);

          set((state) => {
            state.processes[processId].processState = 'terminated';
          });
        },

        connectProcessStream: async (processId: string) => {
          const currentProcess = get().processes[processId];

          if (currentProcess?.isConnectingStream) {
            return;
          }

          set((state) => {
            state.processes[processId].isConnectingStream = true;
          });

          try {
            const response = await fetch(`/api/connect/${processId}`);
            if (!response.body) {
              throw new Error('No response body available');
            }

            const writableStream = new WritableStream({
              write(chunk) {
                set((state) => {
                  if (chunk.event === 'close') {
                    state.processes[processId].processState = 'terminated';
                    state.processes[processId].isConnectingStream = false;
                  }
                  if (chunk.data) {
                    state.processes[processId].output += chunk.data;
                  }
                });
              },
            });

            await response.body
              .pipeThrough(createJsonParseStream())
              .pipeTo(writableStream);
          } catch (error) {
            console.error('Error reading process stream:', error);
          } finally {
            set((state) => {
              state.processes[processId].isConnectingStream = false;
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
