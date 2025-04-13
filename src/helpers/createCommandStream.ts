import 'server-only';

import {
  spawn,
  ChildProcess,
  ChildProcessWithoutNullStreams,
} from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

type ProcessState = 'intialized' | 'running' | 'terminated';

type ProcessInfo = {
  process: ChildProcessWithoutNullStreams | null;
  processId: string;
  command: string;
  args: string[];
  output: string;
  createdAt: number;
  state: ProcessState;
};

// Store active processes with their IDs
// Using a global variable with Symbol ensures it's a singleton
const globalActiveProcesses = global as any;
const ACTIVE_PROCESSES_KEY = Symbol.for('activeProcesses');

// Initialize the map if it doesn't exist
if (!globalActiveProcesses[ACTIVE_PROCESSES_KEY]) {
  globalActiveProcesses[ACTIVE_PROCESSES_KEY] = new Map<string, ProcessInfo>();
}

// Get the active processes map
const activeProcesses: Map<string, ProcessInfo> =
  globalActiveProcesses[ACTIVE_PROCESSES_KEY];

// Helper function to create a stream from a command
export function addProcess(command: string, args: string[]) {
  // Generate a unique process ID
  const processId = crypto.randomUUID();

  // Create process info before storing
  const processInfo: ProcessInfo = {
    process: null,
    processId,
    command,
    args,
    output: '',
    createdAt: Date.now(),
    state: 'intialized',
  };

  // Store the process with its ID
  activeProcesses.set(processId, processInfo);

  console.log(`Process created with ID: ${processId}`);
  console.log(
    `Active processes after creation: ${Array.from(activeProcesses.keys())}`,
  );

  return {
    success: true,
    message: 'Successfully added process',
    processId,
    processState: processInfo.state,
  };
}

export function runProcess(processId: string) {
  const processInfo = activeProcesses.get(processId);
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

  processInfo.process = spawn(command, args, { shell: true });

  const child = processInfo.process;

  processInfo.state = 'running';

  child.stdout.on('data', (data) => {
    const output = data.toString();

    // Log to server
    logStream.write(output);

    // Save to output history
    processInfo.output += output;
  });

  child.stderr.on('data', (data) => {
    const errorOutput = `Error: ${data.toString()}`;

    // Log to server
    logStream.write(errorOutput);

    // Save to output history
    processInfo.output += errorOutput;
  });

  child.on('close', (code) => {
    const closeMessage = `\nProcess exited with code ${code}`;

    // Log to server
    logStream.write(`${closeMessage}\nEnded at: ${new Date().toISOString()}\n`);
    logStream.end();

    // Save to output history
    processInfo.output += closeMessage;
  });

  child.on('error', (err) => {
    const errorMessage = `\nProcess error: ${err.message}`;

    // Log to server
    logStream.write(`${errorMessage}\nEnded at: ${new Date().toISOString()}\n`);
    logStream.end();

    // Save to output history
    processInfo.output += errorMessage;
  });

  return {
    success: true,
    message: 'Successfully ran process',
    processState: processInfo.state,
  };
}

// Function to kill a process by its ID
export function killProcess(processId: string) {
  const processInfo = activeProcesses.get(processId);
  if (processInfo?.process) {
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
      activeProcesses.delete(processId);
      return {
        success: true,
        message: 'Process terminated',
        processState: processInfo.state,
      };
    } catch (error) {
      console.error('Error killing process:', error);
      return {
        success: false,
        message: 'Error killing process',
        processState: processInfo.state,
      };
    }
  }
  return {
    success: false,
    message: 'Process not found',
    processState: 'terminated',
  };
}

export function removeProcess(processId: string) {
  const processInfo = activeProcesses.get(processId);

  if (!processInfo) {
    return {
      success: false,
      message: 'Process not found',
    };
  }

  killProcess(processInfo.processId);

  activeProcesses.delete(processId);
  return {
    success: true,
    message: 'Process removed',
  };
}

export function connectCommandStream(processId: string) {
  const processInfo = activeProcesses.get(processId);

  console.log('Active processes:', Array.from(activeProcesses.keys()));
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
      const { process } = processInfo;

      if (!process) {
        return {
          success: false,
          message: `Process ${processId} not found`,
          stream: null,
          processState: processInfo.state,
        };
      }

      // Send the existing output to the client
      if (processInfo.output) {
        controller.enqueue(processInfo.output);
      }

      process.stdout.on('data', (data) => {
        controller.enqueue(data.toString());
      });

      process.stderr.on('data', (data) => {
        controller.enqueue(`Error: ${data.toString()}`);
      });

      process.on('close', (code) => {
        controller.enqueue(`\nProcess exited with code ${code}`);
        controller.close();
      });

      process.on('error', (err) => {
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
    processState: processInfo.state,
  };
}
