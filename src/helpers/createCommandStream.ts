import 'server-only';

import {
  spawn,
  ChildProcess,
  ChildProcessWithoutNullStreams,
} from 'child_process';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

type ProcessInfo = {
  process: ChildProcessWithoutNullStreams;
  processId: string;
  command: string;
  args: string[];
  output: string;
};

// Store active processes with their IDs
const activeProcesses = new Map<string, ProcessInfo>();

// Helper function to create a stream from a command
export function createCommandStream(command: string, args: string[]) {
  // Generate a unique process ID
  const processId = crypto.randomUUID();

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

  const process = spawn(command, args, { shell: true });

  // Store the process with its ID
  activeProcesses.set(processId, {
    process,
    processId,
    command,
    args,
    output: '',
  });

  const processInfo = activeProcesses.get(processId);

  if (processInfo === undefined) {
    return { processId: null };
  }

  process.stdout.on('data', (data) => {
    const output = data.toString();

    // Log to server
    logStream.write(output);

    // Save to output history
    processInfo.output += output;
  });

  process.stderr.on('data', (data) => {
    const errorOutput = `Error: ${data.toString()}`;

    // Log to server
    logStream.write(errorOutput);

    // Save to output history
    processInfo.output += errorOutput;
  });

  process.on('close', (code) => {
    const closeMessage = `\nProcess exited with code ${code}`;

    // Log to server
    logStream.write(`${closeMessage}\nEnded at: ${new Date().toISOString()}\n`);
    logStream.end();

    // Save to output history
    processInfo.output += closeMessage;
  });

  process.on('error', (err) => {
    const errorMessage = `\nProcess error: ${err.message}`;

    // Log to server
    logStream.write(`${errorMessage}\nEnded at: ${new Date().toISOString()}\n`);
    logStream.end();

    // Save to output history
    processInfo.output += errorMessage;
  });

  return { processId };
}

// Function to kill a process by its ID
export function killProcess(processId: string): boolean {
  const { process } = activeProcesses.get(processId) || {};
  if (process) {
    // Windows-specific process termination
    if (process.pid) {
      try {
        // On Windows, we need to use taskkill to ensure the process tree is killed
        spawn('taskkill', ['/pid', process.pid.toString(), '/f', '/t']);
        // activeProcesses.delete(processId);
        return true;
      } catch (error) {
        console.error('Error killing process:', error);
        return false;
      }
    }
    process.kill();
    // activeProcesses.delete(processId);
    return true;
  }
  return false;
}

export function connectCommandStream(processId: string) {
  // Create logs directory if it doesn't exist
  const logsDir = 'logs';
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
  }
  const stream = new ReadableStream({
    start(controller) {
      const processInfo = activeProcesses.get(processId);
      if (processInfo === undefined) {
        return;
      }
      const { process } = processInfo;

      // Send the existing output to the client
      controller.enqueue(processInfo.output);

      process.stdout.on('data', (data) => {
        const output = data.toString();

        // Send to client
        controller.enqueue(output);
      });

      process.stderr.on('data', (data) => {
        const errorOutput = `Error: ${data.toString()}`;

        // Send to client
        controller.enqueue(errorOutput);
      });

      process.on('close', (code) => {
        const closeMessage = `\nProcess exited with code ${code}`;

        // Send to client
        controller.enqueue(closeMessage);
        // activeProcesses.delete(processId);
        controller.close();
      });

      process.on('error', (err) => {
        const errorMessage = `\nProcess error: ${err.message}`;

        // Send to client
        controller.enqueue(errorMessage);
        // activeProcesses.delete(processId);
        controller.close();
      });
    },
  });

  return { stream };
}
