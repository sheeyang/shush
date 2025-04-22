import 'server-only';

import spawn from 'cross-spawn';
import crypto from 'crypto';

import { ProcessInfoClient, ProcessState } from '@/interfaces/process';
import prisma from '@/server/db';
import activeProcesses from './processes';
import StreamQueue from '@/lib/stream-queue';

async function updateDatabase(
  processId: string,
  {
    appendOutput = null,
    state = null,
  }: { appendOutput?: string | null; state?: ProcessState | null } = {},
) {
  try {
    if (appendOutput !== null) {
      await prisma.processOutput.create({
        data: {
          data: appendOutput,
          processDataId: processId,
        },
      });
    }

    if (state !== null) {
      await prisma.processData.update({
        where: { id: processId },
        data: {
          processState: state,
        },
      });
    }

    return true;
  } catch (error) {
    console.error(`Error updating database for process ${processId}:`, error);
    return false;
  }
}

type GetAllProcessesReturn = Promise<
  | {
      success: true;
      processes: Record<string, ProcessInfoClient>;
    }
  | {
      success: false;
      message: string;
    }
>;

export async function getAllProcesses(): GetAllProcessesReturn {
  try {
    const databaseProcesses = await prisma.processData.findMany({
      select: {
        id: true,
        label: true,
        processState: true,
        output: {
          orderBy: {
            createdAt: 'asc', // make sure the output is in the correct order
          },
        },
      },
    });

    const processes = databaseProcesses.reduce(
      (acc, processData) => {
        acc[processData.id] = {
          label: processData.label,
          output: processData.output.map((output) => output.data).join(''),
          processState: processData.processState,
          isConnectingStream: false,
        };
        return acc;
      },
      {} as Record<string, ProcessInfoClient>,
    );

    return { processes, success: true };
  } catch (error) {
    console.error('Error retrieving processes:', error);
    return { success: false, message: 'Failed to retrieve processes' };
  }
}

type AddProcessReturn = Promise<
  | {
      success: true;
      processId: string;
      processState: ProcessState;
    }
  | {
      success: false;
      message: string;
    }
>;

export async function addProcess(
  command: string,
  args: string[],
  label: string,
): AddProcessReturn {
  try {
    const processId = crypto.randomUUID();

    // Store in database
    await prisma.processData.create({
      data: {
        id: processId,
        label,
        processState: 'initialized',
        command: command,
        args: JSON.stringify(args),
      },
    });

    return {
      success: true,
      processId,
      processState: 'initialized',
    };
  } catch (error) {
    console.error('Error adding process:', error);
    return { success: false, message: 'Failed to add process' };
  }
}

type RunProcessReturn = Promise<
  | {
      success: true;
      processState: ProcessState;
    }
  | {
      success: false;
      processState: ProcessState;
      message: string;
    }
>;

export async function runProcess(processId: string): RunProcessReturn {
  try {
    const processData = await prisma.processData.findUnique({
      where: { id: processId },
      select: {
        command: true,
        args: true,
        processState: true,
      },
    });

    if (!processData) {
      await updateDatabase(processId, {
        state: 'error',
      });
      return {
        success: false,
        message: 'Process data not found in database',
        processState: 'error',
      };
    }

    const command = processData.command;
    const args = JSON.parse(processData.args);

    // Check if process already exists and clean it up first (rare)
    const existingProcess = activeProcesses.get(processId);
    if (existingProcess) {
      await cleanupProcess(processId, existingProcess);
    }

    const childProcess = spawn(command, args);

    const processInfo = activeProcesses
      .set(processId, {
        process: childProcess,
      })
      .get(processId);

    if (!processInfo?.process) {
      await updateDatabase(processId, {
        appendOutput: 'Failed to start process',
        state: 'error',
      });
      return {
        success: false,
        message: `Failed to run process ${processId}`,
        processState: 'error',
      };
    }

    await updateDatabase(processId, {
      appendOutput: `Command: ${command} ${args.join(' ')}\nStarted at: ${new Date().toISOString()}\n`,
      state: 'running',
    });

    const onStdout = async (data: Buffer) => {
      const output = data.toString();
      await updateDatabase(processId, {
        appendOutput: output,
      });
    };

    const onStderr = async (data: Buffer) => {
      const errorOutput = `Error: ${data.toString()}`;
      await updateDatabase(processId, {
        appendOutput: errorOutput,
      });
    };

    const onClose = async (code: number) => {
      const closeMessage = `\nProcess exited with code ${code}\nEnded at: ${new Date().toISOString()}\n`;

      await updateDatabase(processId, {
        appendOutput: closeMessage,
        state: 'terminated',
      });

      cleanupProcess(processId);
    };

    const onError = async (err: Error) => {
      const errorMessage = `\nProcess error: ${err.message}`;

      await updateDatabase(processId, {
        appendOutput: errorMessage,
        state: 'terminated',
      });

      cleanupProcess(processId);
    };

    processInfo.eventListeners = { onStdout, onStderr, onClose, onError };

    processInfo.process.stdout?.on('data', onStdout);
    processInfo.process.stderr?.on('data', onStderr);
    processInfo.process.on('close', onClose);
    processInfo.process.on('error', onError);

    return {
      success: true,
      processState: 'running',
    };
  } catch (error) {
    console.error(`Error running process ${processId}:`, error);
    await updateDatabase(processId, { state: 'error' });
    return {
      success: false,
      message: `Error running process: ${error instanceof Error ? error.message : 'Unknown error'}`,
      processState: 'error',
    };
  }
}

// Helper function to clean up process resources
async function cleanupProcess(
  processId: string,
  processInfo = activeProcesses.get(processId),
) {
  if (!processInfo) return;

  try {
    // Remove event listeners
    if (processInfo.eventListeners) {
      const { onStdout, onStderr, onClose, onError } =
        processInfo.eventListeners;

      processInfo.process?.stdout?.off('data', onStdout);
      processInfo.process?.stderr?.off('data', onStderr);
      processInfo.process?.off('close', onClose);
      processInfo.process?.off('error', onError);
    }

    // Delete from active processes map
    activeProcesses.delete(processId);
  } catch (error) {
    console.error(`Error cleaning up process ${processId}:`, error);
  }
}

type KillProcessReturn = Promise<
  | {
      success: true;
      processState: ProcessState;
    }
  | {
      success: false;
      processState: ProcessState;
      message: string;
    }
>;

export async function killProcess(processId: string): KillProcessReturn {
  try {
    const processInfo = activeProcesses.get(processId);

    if (!processInfo) {
      return {
        success: false,
        message: 'Process not found',
        processState: 'error',
      };
    }

    if (!processInfo?.process) {
      return {
        success: false,
        message: `Process ${processId} is not running`,
        processState: 'error',
      };
    }

    try {
      // Kill the process using appropriate method
      if (processInfo.process.pid) {
        spawn('taskkill', [
          '/pid',
          processInfo.process.pid.toString(),
          '/f',
          '/t',
        ]);
      } else {
        processInfo.process.kill();
      }
    } catch (error) {
      console.error('Error killing process:', error);
      return {
        success: false,
        message: `Error killing process: ${error instanceof Error ? error.message : 'Unknown error'}`,
        processState: 'error',
      };
    }

    await cleanupProcess(processId, processInfo);
    await updateDatabase(processId, { state: 'terminated' });

    return {
      success: true,
      processState: 'terminated',
    };
  } catch (error) {
    console.error(`Error killing process ${processId}:`, error);
    return {
      success: false,
      message: `General error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      processState: 'error',
    };
  }
}

type RemoveProcessReturn = Promise<{
  success: boolean;
  message: string;
}>;

export async function removeProcess(processId: string): RemoveProcessReturn {
  try {
    await killProcess(processId);

    // Use transaction to ensure atomic deletion
    await prisma.$transaction([
      // Delete associated output records
      prisma.processOutput.deleteMany({
        where: { processDataId: processId },
      }),
      // Delete the process data record
      prisma.processData.delete({
        where: { id: processId },
      }),
    ]);

    return {
      success: true,
      message: 'Process removed',
    };
  } catch (error) {
    console.error(`Error removing process ${processId}:`, error);
    return {
      success: false,
      message: `Failed to remove process: ${error instanceof Error ? error.message : 'Unknown error'}`,
    };
  }
}

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

export async function connectCommandStream(
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
