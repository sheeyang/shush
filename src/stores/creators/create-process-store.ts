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
function createJsonObjectTransformStream() {
  let buffer = '';
  let openBraces = 0;
  let inString = false;
  let escapeNext = false;
  let start: number | null = null;

  return new TransformStream({
    async transform(chunk, controller) {
      buffer +=
        typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString();

      for (let i = 0; i < buffer.length; i++) {
        const char = buffer[i];

        // Handle string state and escape sequences
        if (char === '"' && !escapeNext) {
          inString = !inString;
        }

        escapeNext = inString && char === '\\' && !escapeNext;

        // Only count braces when not in a string
        if (!inString) {
          if (char === '{') {
            if (openBraces === 0) {
              start = i;
            }
            openBraces++;
          } else if (char === '}') {
            openBraces--;
            if (openBraces === 0 && start !== null) {
              const jsonString = buffer.slice(start, i + 1);
              try {
                const obj = JSON.parse(jsonString);
                controller.enqueue(obj);
              } catch (err) {
                controller.error(err);
                return;
              }
              buffer = buffer.slice(i + 1);
              i = -1;
              start = null;
            }
          }
        }
      }
    },

    async flush(controller) {
      if (buffer.trim()) {
        try {
          const obj = JSON.parse(buffer);
          controller.enqueue(obj);
        } catch (err) {
          controller.error(err);
        }
      }
    },
  });
}

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

            const jsonTransformStream = createJsonObjectTransformStream();

            const transformedStream =
              response.body.pipeThrough(jsonTransformStream);
            const reader = transformedStream.getReader();

            while (true) {
              const { done, value: message } = await reader.read();

              if (done) break;

              set((state) => {
                if (message.event === 'close') {
                  state.processes[processId].processState = 'terminated';
                  state.processes[processId].isConnectingStream = false;
                }
                if (message.data) {
                  state.processes[processId].output += message.data;
                }
              });
            }
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
