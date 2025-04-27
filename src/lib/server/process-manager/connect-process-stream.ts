import activeProcesses from '../processes';
import prisma from '../db';

type ConnectProcessStreamReturn = Promise<
  | {
      success: true;
      stream: ReadableStream;
    }
  | {
      success: false;
      message: string;
    }
>;

export async function connectProcessStream(
  processId: string,
): ConnectProcessStreamReturn {
  let streamEventListeners:
    | {
        onStdout: (data: Buffer) => void;
        onStderr: (data: Buffer) => void;
        onClose: (code: number) => void;
        onError: (err: Error) => void;
      }
    | undefined;

  const encoder = new TextEncoder();

  try {
    const stream = new ReadableStream({
      async start(controller) {
        const processInfo = activeProcesses.get(processId);
        function send(data: string, event?: string) {
          // const formatted =
          //   data
          //     .split('\n')
          //     .map((line) => {
          //       if (event) {
          //         return `event: ${event}\ndata: ${line}`;
          //       }
          //       return `data: ${line}`;
          //     })
          //     .join('\n') + '\n\n';

          const formatted = JSON.stringify({
            data,
            event,
          });

          console.log(formatted);

          controller.enqueue(encoder.encode(formatted));
        }

        if (processInfo?.process) {
          streamEventListeners = {
            onStdout: (data: Buffer) => {
              send(data.toString());
            },
            onStderr: (data: Buffer) => {
              const errorOutput = `Error: ${data.toString()}`;
              send(errorOutput);
            },
            onClose: (code: number) => {
              const closeMessage = `\nProcess exited with code ${code}\nEnded at: ${new Date().toISOString()}\n`;
              send(closeMessage, 'close');
              controller.close();
            },
            onError: (err: Error) => {
              const errorMessage = `\nProcess error: ${err.message}`;
              send(errorMessage, 'close');
              controller.close();
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
          return;
        }

        processData.output.forEach((outputRecord) => {
          send(outputRecord.data);
        });

        // ensure that the stream is closed if the process is already terminated
        if (!processInfo?.process) {
          send('', 'close');
          controller.close();
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
