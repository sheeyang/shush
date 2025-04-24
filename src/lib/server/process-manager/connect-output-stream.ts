import StreamQueue from '@/lib/stream-queue';
import activeProcesses from '../processes';
import prisma from '../db';

type ConnectCommandStreamReturn = Promise<
  | {
      success: true;
      stream: ReadableStream;
    }
  | {
      success: false;
      message: string;
    }
>;

export async function connectOutputStream(
  processId: string,
): ConnectCommandStreamReturn {
  let streamEventListeners:
    | {
        onStdout: (data: Buffer) => void;
        onStderr: (data: Buffer) => void;
        onClose: (code: number) => void;
        onError: (err: Error) => void;
      }
    | undefined;

  let queue: StreamQueue;

  try {
    const stream = new ReadableStream({
      async start(controller) {
        queue = new StreamQueue(controller);

        const processInfo = activeProcesses.get(processId);
        if (processInfo?.process) {
          streamEventListeners = {
            onStdout: (data: Buffer) => {
              queue.enqueue(data.toString());
            },
            onStderr: (data: Buffer) => {
              const errorOutput = `Error: ${data.toString()}`;
              queue.enqueue(errorOutput);
            },
            onClose: (code: number) => {
              const closeMessage = `\nProcess exited with code ${code}\nEnded at: ${new Date().toISOString()}\n`;
              queue.enqueue(closeMessage);
              queue.close();
            },
            onError: (err: Error) => {
              const errorMessage = `\nProcess error: ${err.message}`;
              queue.enqueue(errorMessage);
              queue.close();
            },
          };

          // Add event listeners with null checks
          processInfo.process.stdout?.on('data', streamEventListeners.onStdout);
          processInfo.process.stderr?.on('data', streamEventListeners.onStderr);
          processInfo.process.on('close', streamEventListeners.onClose);
          processInfo.process.on('error', streamEventListeners.onError);
        }

        const processData = await prisma.processData.findUnique({
          where: { id: processId },
          select: {
            processState: true,
            output: {
              orderBy: {
                createdAt: 'asc', // Ensure output is in the correct order
              },
            },
          },
        });

        if (!processData) {
          return {
            success: false,
            message: 'Process not found',
            stream: null,
          };
        }

        processData.output.forEach((outputRecord) => {
          queue.enqueue(outputRecord.data, outputRecord.createdAt);
        });

        queue.start();

        if (!processInfo?.process) {
          queue.close();
          return;
        }
      },
      async cancel() {
        const processInfo = activeProcesses.get(processId);
        if (processInfo?.process && streamEventListeners) {
          processInfo.process.stdout?.off(
            'data',
            streamEventListeners.onStdout,
          );
          processInfo.process.stderr?.off(
            'data',
            streamEventListeners.onStderr,
          );
          processInfo.process.off('close', streamEventListeners.onClose);
          processInfo.process.off('error', streamEventListeners.onError);
        }

        queue.close();
      },
    });

    return {
      success: true,
      stream,
    };
  } catch (error) {
    console.error(`Error connecting stream for process ${processId}:`, error);

    // Clean up in case of error
    const processInfo = activeProcesses.get(processId);
    if (processInfo?.process && streamEventListeners) {
      processInfo.process.stdout?.off('data', streamEventListeners.onStdout);
      processInfo.process.stderr?.off('data', streamEventListeners.onStderr);
      processInfo.process.off('close', streamEventListeners.onClose);
      processInfo.process.off('error', streamEventListeners.onError);
    }

    return {
      success: false,
      message: `Error connecting stream: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}
