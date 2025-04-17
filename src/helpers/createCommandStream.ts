import 'server-only';

import spawn from 'cross-spawn';
import crypto from 'crypto';

import {
  ProcessInfoClient,
  ProcessInfoServer,
  ProcessState,
} from '@/interfaces/process';
import prisma from '@/lib/db';
import { ProcessOutput } from '@/generated/prisma';

// Create a singleton for managing active processes
const getChildProcessesMap = (): Map<string, ProcessInfoServer> => {
  const CHILD_PROCESSES_KEY = Symbol.for('childProcesses');

  // Initialize the map if it doesn't exist in the global scope
  if (!(CHILD_PROCESSES_KEY in global)) {
    (global as Record<symbol, Map<string, ProcessInfoServer>>)[
      CHILD_PROCESSES_KEY
    ] = new Map<string, ProcessInfoServer>();
  }

  return (global as Record<symbol, Map<string, ProcessInfoServer>>)[
    CHILD_PROCESSES_KEY
  ];
};

// Get the active processes map
const childProcesses = getChildProcessesMap();

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
          processInfoId: processId,
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

function combineProcessOutput(outputRecords: ProcessOutput[]): string {
  return outputRecords.map((outputRecord) => outputRecord.data).join('');
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

  const processInfo = childProcesses
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

    childProcesses.delete(processId);
  });

  processInfo.process.on('error', async (err) => {
    const errorMessage = `\nProcess error: ${err.message}`;

    await updateDatabase(processId, {
      appendOutput: errorMessage,
      state: 'terminated',
    });

    childProcesses.delete(processId);
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
  const processInfo = childProcesses.get(processId);

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

  childProcesses.delete(processId);
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
    where: { processInfoId: processId },
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
  processState: ProcessState;
}> {
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
      processState: 'error',
    };
  }

  const stream = new ReadableStream({
    async start(controller) {
      if (processData) {
        const combinedOutput = combineProcessOutput(processData.output);
        try {
          controller.enqueue(combinedOutput);
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === 'Invalid state: Controller is already closed'
          ) {
            return;
          }
          console.error('Error sending output to stream:', error);
        }
      }

      const processInfo = childProcesses.get(processId);
      if (!processInfo?.process) {
        controller.close();
        return;
      }

      processInfo.process.stdout?.on('data', (data) => {
        try {
          controller.enqueue(data.toString());
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === 'Invalid state: Controller is already closed'
          ) {
            return;
          }
          console.error('Error sending output to stream:', error);
        }
      });

      processInfo.process.stderr?.on('data', (data) => {
        const errorOutput = `Error: ${data.toString()}`;
        try {
          controller.enqueue(errorOutput);
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === 'Invalid state: Controller is already closed'
          ) {
            return;
          }
          console.error('Error sending error message to stream:', error);
        }
      });

      processInfo.process.on('close', (code) => {
        const closeMessage = `\nProcess exited with code ${code}\nEnded at: ${new Date().toISOString()}\n`;

        try {
          controller.enqueue(closeMessage);
          controller.close();
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === 'Invalid state: Controller is already closed'
          ) {
            return;
          }
          console.error('Error sending close message to stream:', error);
        }
      });

      processInfo.process.on('error', (err) => {
        const errorMessage = `\nProcess error: ${err.message}`;
        try {
          controller.enqueue(errorMessage);
          controller.close();
        } catch (error) {
          if (
            error instanceof Error &&
            error.message === 'Invalid state: Controller is already closed'
          ) {
            return;
          }
          console.error('Error sending error message to stream:', error);
        }
      });
    },
  });

  return {
    success: true,
    message: 'Successfully connected to process stream',
    stream,
    processState: processData.processState,
  };
}
