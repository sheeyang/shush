import activeProcesses from '../processes';
import { ChildProcess } from 'child_process';
import { StreamEventListeners } from '@/interfaces/process';
import { sendHistoricalOutput } from './helpers/send-historical-output';

type ProcessStreamResult =
  | { success: true; stream: ReadableStream }
  | { success: false; message: string };

export async function connectProcessStream(
  processId: string,
): Promise<ProcessStreamResult> {
  const encoder = new TextEncoder();
  let listeners: StreamEventListeners | undefined;

  try {
    const stream = new ReadableStream({
      async start(controller) {
        const processInfo = activeProcesses.get(processId);
        const process = processInfo?.process;

        // Helper function for sending data through the stream
        function send(data: string, event?: string) {
          const formatted = JSON.stringify({ data, event });
          controller.enqueue(encoder.encode(formatted));
        }

        // Retrieve historical output from database
        await sendHistoricalOutput(processId, send);

        // If process is no longer active, close the stream and return
        if (!process) {
          send('', 'close');
          controller.close();
          return;
        }

        // Set up event listeners for the active process
        listeners = createEventListeners(send, controller);
        attachEventListeners(process, listeners);
      },

      cancel() {
        cleanupEventListeners(processId, listeners);
      },
    });

    return { success: true, stream };
  } catch (error) {
    cleanupEventListeners(processId, listeners);

    return {
      success: false,
      message: `Error connecting stream: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

function createEventListeners(
  send: (data: string, event?: string) => void,
  controller: ReadableStreamDefaultController,
): StreamEventListeners {
  return {
    onStdout: (data: Buffer) => {
      send(data.toString());
    },
    onStderr: (data: Buffer) => {
      send(`Error: ${data.toString()}`);
    },
    onClose: (code: number) => {
      const closeMessage = `\nProcess exited with code ${code}\nEnded at: ${new Date().toISOString()}\n`;
      send(closeMessage, 'close');
      controller.close();
    },
    onError: (err: Error) => {
      send(`\nProcess error: ${err.message}`, 'close');
      controller.close();
    },
  };
}

function attachEventListeners(
  process: ChildProcess,
  listeners: StreamEventListeners,
): void {
  process.stdout?.on('data', listeners.onStdout);
  process.stderr?.on('data', listeners.onStderr);
  process.on('close', listeners.onClose);
  process.on('error', listeners.onError);
}

function cleanupEventListeners(
  processId: string,
  listeners?: StreamEventListeners,
): void {
  if (!listeners) return;

  const processInfo = activeProcesses.get(processId);
  const process = processInfo?.process;

  if (!process) return;

  process.stdout?.off('data', listeners.onStdout);
  process.stderr?.off('data', listeners.onStderr);
  process.off('close', listeners.onClose);
  process.off('error', listeners.onError);
}
