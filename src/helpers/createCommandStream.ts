import 'server-only';

import spawn from 'cross-spawn';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { ProcessInfoServer, ProcessState } from '@/interfaces/process';

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

// Helper function to create a stream from a command
export function addProcess(
  command: string,
  args: string[],
): {
  success: boolean;
  message: string;
  processId: string;
  processState: ProcessState;
} {
  // Generate a unique process ID
  const processId = crypto.randomUUID();

  // Create process info before storing
  const processInfo: ProcessInfoServer = {
    process: null,
    command,
    args,
    output: '',
    createdAt: Date.now(),
    processState: 'initialized',
  };

  // Store the process with its ID
  childProcesses.set(processId, processInfo);

  console.log(`Process created with ID: ${processId}`);
  console.log(
    `Active processes after creation: ${Array.from(childProcesses.keys())}`,
  );

  return {
    success: true,
    message: 'Successfully added process',
    processId,
    processState: processInfo.processState,
  };
}

export function runProcess(processId: string): {
  success: boolean;
  message: string;
  processState: ProcessState;
} {
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

  processInfo.process.stdout?.on('data', (data) => {
    const output = data.toString();

    // Log to server
    logStream.write(output);

    // Save to output history
    processInfo.output += output;
  });

  processInfo.process.stderr?.on('data', (data) => {
    const errorOutput = `Error: ${data.toString()}`;

    // Log to server
    logStream.write(errorOutput);

    // Save to output history
    processInfo.output += errorOutput;
  });

  processInfo.process.on('close', (code) => {
    const closeMessage = `\nProcess exited with code ${code}`;

    // Log to server
    logStream.write(`${closeMessage}\nEnded at: ${new Date().toISOString()}\n`);
    logStream.end();

    // Save to output history
    processInfo.output += closeMessage;

    processInfo.processState = 'terminated';
  });

  processInfo.process.on('error', (err) => {
    const errorMessage = `\nProcess error: ${err.message}`;

    // Log to server
    logStream.write(`${errorMessage}\nEnded at: ${new Date().toISOString()}\n`);
    logStream.end();

    // Save to output history
    processInfo.output += errorMessage;

    processInfo.processState = 'terminated';
  });

  return {
    success: true,
    message: 'Successfully ran process',
    processState: processInfo.processState,
  };
}

// TODO: check if cross spawn kills the process without taskkill workaround
// Function to kill a process by its ID
export function killProcess(processId: string): {
  success: boolean;
  message: string;
  processState: ProcessState;
} {
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
    childProcesses.delete(processId);
    return {
      success: true,
      message: 'Process terminated',
      processState: processInfo.processState,
    };
  } catch (error) {
    console.error('Error killing process:', error);
    return {
      success: false,
      message: 'Error killing process',
      processState: processInfo.processState,
    };
  }
}

export function removeProcess(processId: string): {
  success: boolean;
  message: string;
} {
  const processInfo = childProcesses.get(processId);

  if (!processInfo) {
    return {
      success: false,
      message: 'Process not found',
    };
  }

  killProcess(processId);

  childProcesses.delete(processId);
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
