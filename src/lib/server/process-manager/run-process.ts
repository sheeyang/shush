import prisma from '../db';
import { updateDatabase } from './helpers/update-database';
import activeProcesses from '../processes';
import spawn from 'cross-spawn';
import { cleanupProcess } from './helpers/cleanup-process';

export async function runProcess(processId: string): Promise<void> {
  const processData = await prisma.processData.findUnique({
    where: { id: processId },
    select: {
      command: true,
      args: true,
      processState: true,
    },
  });

  if (!processData) {
    throw new Error(`Process ${processId} not found in database`);
  }

  const command = processData.command;
  const args = JSON.parse(processData.args);

  // Check if process already exists and clean it up first (rare)
  const existingProcess = activeProcesses.get(processId);
  if (existingProcess) {
    await cleanupProcess(processId);
  }

  const childProcess = spawn(command, args);

  const processInfo = activeProcesses
    .set(processId, {
      process: childProcess,
    })
    .get(processId);

  if (!processInfo?.process) {
    throw new Error(`Failed to spawn process ${processId}`);
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
}
