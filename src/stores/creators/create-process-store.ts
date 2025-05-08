'use client';

import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { getAllProcessesAction } from '@/lib/server/process-manager/get-all-processes-action';
import { addProcessAction } from '@/lib/server/process-manager/add-process-action';
import { killProcessAction } from '@/lib/server/process-manager/kill-process-action';
import { removeProcessAction } from '@/lib/server/process-manager/remove-process-action';
import { runProcessAction } from '@/lib/server/process-manager/run-process-action';
import { ProcessInfoClient } from '@/interfaces/process';
import { useShallow } from 'zustand/shallow';
import { devtools } from 'zustand/middleware';
import { StateCreator } from 'zustand';
import { connectProcessStream } from '@/lib/server/process-manager/connect-process-stream';

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

// const middlewares = (
//   f: StateCreator<ProcessStore, [['zustand/immer', never]], []>,
// ) =>
//   devtools(
//     immer(
//       persist(f, {
//         name: 'processes',
//         partialize: (state) => ({
//           processes: state.processes,
//         }),
//       }),
//     ),
//   );

const middlewares = (
  f: StateCreator<ProcessStore, [['zustand/immer', never]], []>,
) => devtools(immer(f));

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
              lastOutputTime: 0,
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
            const lastOutputTime = currentProcess?.lastOutputTime || 0;

            const outputStream = await connectProcessStream(
              processId,
              new Date(lastOutputTime),
            );

            const writableStream = new WritableStream({
              write(chunk) {
                set((state) => {
                  state.processes[processId].output += chunk;
                  state.processes[processId].lastOutputTime = Date.now();
                });
              },
            });

            outputStream
              .pipeThrough(new TextDecoderStream())
              .pipeTo(writableStream)
              .then(() => {
                set((state) => {
                  state.processes[processId].processState = 'terminated';
                  state.processes[processId].isConnectingStream = false;
                });
              });
          } catch (error) {
            console.error('Error reading process stream:', error);
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
