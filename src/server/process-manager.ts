import 'server-only';

import spawn from 'cross-spawn';
import crypto from 'crypto';

import { ProcessInfoClient, ProcessState } from '@/interfaces/process';
import prisma from '@/server/db';
import activeProcesses from './processes';
import StreamQueue from '@/lib/stream-queue';

//TODO: dont call data base so many times
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

export async function getAllProcesses(): Promise<
  Record<string, ProcessInfoClient>
> {
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

  const clientProcesses = databaseProcesses.reduce(
    (acc, processData) => {
      // const combinedOutput = combineProcessOutput(processData.output);

      acc[processData.id] = {
        label: processData.label,
        output: '',
        processState: processData.processState,
        isConnectingStream: false,
      };
      return acc;
    },
    {} as Record<string, ProcessInfoClient>,
  );

  return clientProcesses;
}

// Helper function to create a stream from a command
export async function addProcess(
  command: string,
  args: string[],
  label: string,
): Promise<{
  success: boolean;
  message: string;
  processId: string;
  processState: ProcessState;
}> {
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
    message: 'Successfully added process',
    processId,
    processState: 'initialized',
  };
}

export async function runProcess(
  processId: string,
): Promise<{ success: boolean; message: string; processState: ProcessState }> {
  const processData = await prisma.processData.findUnique({
    where: { id: processId },
    select: {
      command: true,
      args: true,
      processState: true,
    },
  });

  if (!processData) {
    return {
      success: false,
      message: 'Process data not found in database',
      processState: 'error',
    };
  }

  const command = processData.command;
  const args = JSON.parse(processData.args);

  const processInfo = activeProcesses
    .set(processId, {
      process: spawn(command, args),
    })
    .get(processId);

  if (!processInfo?.process) {
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

  processInfo.process.stdout?.on('data', async (data) => {
    const output = data.toString();
    await updateDatabase(processId, {
      appendOutput: output,
    });
  });

  processInfo.process.stderr?.on('data', async (data) => {
    const errorOutput = `Error: ${data.toString()}`;
    await updateDatabase(processId, {
      appendOutput: errorOutput,
    });
  });

  processInfo.process.on('close', async (code) => {
    const closeMessage = `\nProcess exited with code ${code}\nEnded at: ${new Date().toISOString()}\n`;

    await updateDatabase(processId, {
      appendOutput: closeMessage,
      state: 'terminated',
    });

    activeProcesses.delete(processId);
  });

  processInfo.process.on('error', async (err) => {
    const errorMessage = `\nProcess error: ${err.message}`;

    await updateDatabase(processId, {
      appendOutput: errorMessage,
      state: 'terminated',
    });

    activeProcesses.delete(processId);
  });

  return {
    success: true,
    message: 'Successfully ran process',
    processState: 'running',
  };
}

// TODO: check if cross spawn kills the process without taskkill workaround
// Function to kill a process by its ID
export async function killProcess(
  processId: string,
): Promise<{ success: boolean; message: string; processState: ProcessState }> {
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

    processInfo.process.stdout?.removeAllListeners('data');
    processInfo.process.stderr?.removeAllListeners('data');
    processInfo.process.removeAllListeners('close');
    processInfo.process.removeAllListeners('error');
  } catch (error) {
    console.error('Error killing process:', error);

    return {
      success: false,
      message: `Error killing process: ${error instanceof Error ? error.message : 'Unknown error'}`,
      processState: 'error',
    };
  }

  activeProcesses.delete(processId);
  await updateDatabase(processId, { state: 'terminated' });

  return {
    success: true,
    message: 'Successfully killed process',
    processState: 'terminated',
  };
}

export async function removeProcess(processId: string): Promise<{
  success: boolean;
  message: string;
}> {
  await killProcess(processId);

  // Delete associated output records
  await prisma.processOutput.deleteMany({
    where: { processDataId: processId },
  });

  // Delete the process data record
  await prisma.processData.delete({
    where: { id: processId },
  });

  return {
    success: true,
    message: 'Process removed',
  };
}

export async function connectCommandStream(processId: string): Promise<{
  success: boolean;
  message: string;
  stream: ReadableStream | null;
}> {
  let onStdout: (data: Buffer) => void;
  let onStderr: (data: Buffer) => void;
  let onClose: (code: number) => void;
  let onError: (err: Error) => void;

  const stream = new ReadableStream({
    async start(controller) {
      const queue = new StreamQueue(controller);

      const processInfo = activeProcesses.get(processId);
      if (processInfo?.process) {
        onStdout = (data: Buffer) => {
          queue.enqueue(data.toString());
        };
        onStderr = (data: Buffer) => {
          const errorOutput = `Error: ${data.toString()}`;
          queue.enqueue(errorOutput);
        };
        onClose = (code: number) => {
          const closeMessage = `\nProcess exited with code ${code}\nEnded at: ${new Date().toISOString()}\n`;
          queue.enqueue(closeMessage);
          queue.close();
        };
        onError = (err: Error) => {
          const errorMessage = `\nProcess error: ${err.message}`;
          queue.enqueue(errorMessage);
          queue.close();
        };

        processInfo.process.stdout?.on('data', onStdout);
        processInfo.process.stderr?.on('data', onStderr);
        processInfo.process.on('close', onClose);
        processInfo.process.on('error', onError);
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
      if (processInfo?.process) {
        processInfo.process.stdout?.off('data', onStdout);
        processInfo.process.stderr?.off('data', onStderr);
        processInfo.process.off('close', onClose);
        processInfo.process.off('error', onError);
      }
    },
  });

  return {
    success: true,
    message: 'Successfully connected to process stream',
    stream,
  };
}
