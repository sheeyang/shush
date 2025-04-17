import 'server-only';

import spawn from 'cross-spawn';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import {
  ProcessInfoClient,
  ProcessInfoServer,
  ProcessState,
} from '@/interfaces/process';
import prisma from '@/lib/db';

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
      await prisma.processInfoDataBase.update({
        where: { id: processId },
        data: {
          output: {
            set:
              (
                await prisma.processInfoDataBase.findUnique({
                  where: { id: processId },
                })
              )?.output + appendOutput,
          },
        },
      });
    }

    if (state !== null) {
      await prisma.processInfoDataBase.update({
        where: { id: processId },
        data: {
          processState: state,
        },
      });
    }

    return false;
  } catch (error) {
    console.error(`Error updating database for process ${processId}:`, error);
    return false;
  }
}

export async function getAllProcesses(): Promise<
  Record<string, ProcessInfoClient>
> {
  const databaseProcesses = await prisma.processInfoDataBase.findMany();

  childProcesses.clear();

  databaseProcesses.forEach((processInfo) => {
    childProcesses.set(processInfo.id, {
      process: null,
      processState: processInfo.processState,
    });
  });

  const clientProcesses = Object.fromEntries(
    databaseProcesses.map((processInfo) => {
      return [
        processInfo.id,
        {
          label: processInfo.label,
          output: processInfo.output,
          processState: processInfo.processState,
        },
      ];
    }),
  );

  return clientProcesses;
}

// Helper function to create a stream from a command
export async function addProcess(
  command: string,
  args: string[],
  label: string, // Add label parameter
): Promise<{
  success: boolean;
  message: string;
  processId: string;
  processState: ProcessState;
}> {
  const processId = crypto.randomUUID();

  const processInfo: ProcessInfoServer = {
    process: null,
    processState: 'initialized',
  };

  // Store in memory
  childProcesses.set(processId, processInfo);

  console.log(`Process created with ID: ${processId}`);
  console.log(
    `Active processes after creation: ${Array.from(childProcesses.keys())}`,
  );

  // Store in database
  await prisma.processInfoDataBase.create({
    data: {
      id: processId,
      label,
      processState: processInfo.processState,
      output: '',
      command: command,
      args: JSON.stringify(args),
      createdAt: new Date(Date.now()),
    },
  });

  return {
    success: true,
    message: 'Successfully added process',
    processId,
    processState: processInfo.processState,
  };
}

export async function runProcess(
  processId: string,
): Promise<{ success: boolean; message: string; processState: ProcessState }> {
  const processInfo = childProcesses.get(processId);
  if (!processInfo) {
    return {
      success: false,
      message: 'Process not found',
      processState: 'terminated',
    };
  }

  const processData = await prisma.processInfoDataBase.findUnique({
    where: { id: processId },
    select: {
      command: true,
      args: true,
    },
  });

  if (!processData) {
    return {
      success: false,
      message: 'Process data not found in database',
      processState: 'terminated',
    };
  }

  const command = processData.command;
  const args = JSON.parse(processData.args);

  // Create logs directory if it doesn't exist
  const logsDir = 'logs';
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Create a log file for this process
  const logFile = path.join(logsDir, `${command}-${processId}.log`);
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });

  processInfo.process = spawn(command, args);

  const startMessage = `Command: ${command} ${args.join(' ')}\nStarted at: ${new Date().toISOString()}\n\n`;

  await updateDatabase(processId, {
    appendOutput: startMessage,
    state: 'running',
  });
  processInfo.processState = 'running'; // Update process state in memory
  logStream.write(startMessage);

  processInfo.process.stdout?.on('data', async (data) => {
    const output = data.toString();
    await updateDatabase(processId, {
      appendOutput: output,
    });
  });

  processInfo.process.stderr?.on('data', async (data) => {
    const errorOutput = `Error: ${data.toString()}`;
    logStream.write(errorOutput);
    await updateDatabase(processId, {
      appendOutput: errorOutput,
    });
  });

  processInfo.process.on('close', async (code) => {
    const closeMessage = `\nProcess exited with code ${code}\nEnded at: ${new Date().toISOString()}\n`;

    logStream.write(closeMessage);
    logStream.end();

    await updateDatabase(processId, {
      appendOutput: closeMessage,
      state: 'terminated',
    });
  });

  processInfo.process.on('error', async (err) => {
    const errorMessage = `\nProcess error: ${err.message}`;

    // Log to server
    logStream.write(`${errorMessage}\nEnded at: ${new Date().toISOString()}\n`);
    logStream.end();

    await updateDatabase(processId, {
      appendOutput: errorMessage,
      state: 'terminated',
    });
  });

  return {
    success: true,
    message: 'Successfully ran process',
    processState: processInfo.processState,
  };
}

// TODO: check if cross spawn kills the process without taskkill workaround
// Function to kill a process by its ID
export async function killProcess(
  processId: string,
): Promise<{ success: boolean; message: string; processState: ProcessState }> {
  const processInfo = childProcesses.get(processId);
  if (!processInfo?.process) {
    return {
      success: false,
      message: 'Process not found',
      processState: 'terminated',
    };
  }

  try {
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
  } finally {
    await updateDatabase(processId, {
      state: 'terminated',
    });
  }

  return {
    success: false,
    message: 'Error killing process',
    processState: processInfo.processState,
  };
}

export async function removeProcess(processId: string): Promise<{
  success: boolean;
  message: string;
}> {
  const processInfo = childProcesses.get(processId);

  if (!processInfo) {
    return {
      success: false,
      message: 'Process not found',
    };
  }

  await killProcess(processId);

  childProcesses.delete(processId);

  await prisma.processInfoDataBase.delete({
    where: { id: processId },
  });

  return {
    success: true,
    message: 'Process removed',
  };
}

export function connectCommandStream(processId: string): {
  success: boolean;
  message: string;
  stream: ReadableStream | null;
  processState: ProcessState;
} {
  const processInfo = childProcesses.get(processId);

  console.log('Active processes:', Array.from(childProcesses.keys()));
  console.log('Requested process ID:', processId);
  console.log('Process info found:', !!processInfo);

  if (!processInfo) {
    return {
      success: false,
      message: `Process ${processId} not found`,
      stream: null,
      processState: 'terminated',
    };
  }

  const stream = new ReadableStream({
    async start(controller) {
      if (!processInfo.process) {
        return {
          success: false,
          message: `Process ${processId} is not started yet`,
          stream: null,
          processState: processInfo.processState,
        };
      }

      const processData = await prisma.processInfoDataBase.findUnique({
        where: { id: processId },
        select: {
          output: true,
        },
      });

      if (processData) {
        controller.enqueue(processData.output);
      }

      processInfo.process.stdout?.on('data', (data) => {
        controller.enqueue(data.toString());
      });

      processInfo.process.stderr?.on('data', (data) => {
        const errorOutput = `Error: ${data.toString()}`;
        controller.enqueue(errorOutput);
      });

      processInfo.process.on('close', (code) => {
        const closeMessage = `\nProcess exited with code ${code}\nEnded at: ${new Date().toISOString()}\n`;

        controller.enqueue(closeMessage);
        controller.close();
      });

      processInfo.process.on('error', (err) => {
        const errorMessage = `\nProcess error: ${err.message}`;

        controller.enqueue(errorMessage);
        controller.close();
      });
    },
  });

  return {
    success: true,
    message: 'Successfully connected to process stream',
    stream,
    processState: processInfo.processState,
  };
}
