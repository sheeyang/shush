import { ProcessState } from '@/generated/prisma';
import prisma from '../db';
import { updateDatabase } from './helpers/update-database';
import activeProcesses from '../processes';
import spawn from 'cross-spawn';
import { cleanupProcess } from './helpers/cleanup-process';

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
