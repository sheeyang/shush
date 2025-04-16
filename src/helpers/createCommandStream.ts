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

export async function getAllProcesses(): Promise<
  Record<string, ProcessInfoClient>
> {
  const databaseProcesses = await prisma.processInfoDataBase.findMany();
  databaseProcesses.forEach((processInfo) => {
    childProcesses.set(processInfo.id, {
      process: null,
      command: processInfo.command,
      args: JSON.parse(processInfo.args), // Convert string back to array
      output: processInfo.output,
      createdAt: processInfo.createdAt,
      processState: processInfo.processState,
    });
  });

  // TODO: clean this up
  const clientProcesses = Object.fromEntries(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    databaseProcesses.entries().map(([_index, processInfo]) => {
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
    command,
    args,
    output: '',
    createdAt: new Date(Date.now()),
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
      output: processInfo.output,
      command: processInfo.command,
      args: JSON.stringify(processInfo.args),
      createdAt: processInfo.createdAt,
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

  const { command, args } = processInfo;

  // Create logs directory if it doesn't exist
  const logsDir = 'logs';
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }

  // Create a log file for this process
  const logFile = path.join(logsDir, `${command}-${processId}.log`);
  const logStream = fs.createWriteStream(logFile, { flags: 'a' });

  // Log the command and arguments
  logStream.write(`Command: ${command} ${args.join(' ')}\n`);
  logStream.write(`Started at: ${new Date().toISOString()}\n\n`);

  processInfo.process = spawn(command, args);

  processInfo.processState = 'running';

  await prisma.processInfoDataBase.update({
    where: { id: processId },
    data: { processState: processInfo.processState },
  });

  processInfo.process.stdout?.on('data', async (data) => {
    const output = data.toString();
    logStream.write(output);
    processInfo.output += output;

    await prisma.processInfoDataBase.update({
      where: { id: processId },
      data: {
        processState: processInfo.processState,
        output: processInfo.output,
      },
    });
  });

  processInfo.process.on('close', async (code) => {
    const closeMessage = `\nProcess exited with code ${code}`;

    // Log to server
    logStream.write(`${closeMessage}\nEnded at: ${new Date().toISOString()}\n`);
    logStream.end();

    // Save to output history
    processInfo.output += closeMessage;

    processInfo.processState = 'terminated';

    await prisma.processInfoDataBase.update({
      where: { id: processId },
      data: {
        processState: processInfo.processState,
        output: processInfo.output,
      },
    });
  });

  // Similar updates for stderr and error handlers
  processInfo.process.stderr?.on('data', async (data) => {
    const errorOutput = `Error: ${data.toString()}`;

    // Log to server
    logStream.write(errorOutput);

    // Save to output history
    processInfo.output += errorOutput;

    await prisma.processInfoDataBase.update({
      where: { id: processId },
      data: {
        processState: processInfo.processState,
        output: processInfo.output,
      },
    });
  });

  processInfo.process.on('error', async (err) => {
    const errorMessage = `\nProcess error: ${err.message}`;

    // Log to server
    logStream.write(`${errorMessage}\nEnded at: ${new Date().toISOString()}\n`);
    logStream.end();

    // Save to output history
    processInfo.output += errorMessage;

    processInfo.processState = 'terminated';

    await prisma.processInfoDataBase.update({
      where: { id: processId },
      data: {
        processState: processInfo.processState,
        output: processInfo.output,
      },
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

    // Update database
    await prisma.processInfoDataBase.update({
      where: { id: processId },
      data: { processState: processInfo.processState },
    });

    return {
      success: true,
      message: 'Process terminated',
      processState: processInfo.processState,
    };
  } catch (error) {
    console.error('Error killing process:', error);

    await prisma.processInfoDataBase.update({
      where: { id: processId },
      data: { processState: processInfo.processState },
    });

    return {
      success: false,
      message: 'Error killing process',
      processState: processInfo.processState,
    };
  }
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

  killProcess(processId);

  childProcesses.delete(processId);

  await prisma.processInfoDataBase.delete({
    where: { id: processId },
  }); // Delete from database

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
    start(controller) {
      if (!processInfo.process) {
        return {
          success: false,
          message: `Process ${processId} not found`,
          stream: null,
          processState: processInfo.processState,
        };
      }

      // Send the existing output to the client
      if (processInfo.output) {
        controller.enqueue(processInfo.output);
      }

      processInfo.process.stdout?.on('data', (data) => {
        controller.enqueue(data.toString());
      });

      processInfo.process.stderr?.on('data', (data) => {
        controller.enqueue(`Error: ${data.toString()}`);
      });

      processInfo.process.on('close', (code) => {
        controller.enqueue(`\nProcess exited with code ${code}`);
        controller.close();
      });

      processInfo.process.on('error', (err) => {
        controller.enqueue(`\nProcess error: ${err.message}`);
        controller.close();
      });
    },
    cancel() {
      // Clean up when the stream is cancelled
      if (processInfo.process) {
        processInfo.process.kill();
      }
    },
  });

  return {
    success: true,
    message: 'Successfully connected to process stream',
    stream,
    processState: processInfo.processState,
  };
}
