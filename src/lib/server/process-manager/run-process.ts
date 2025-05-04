import prisma from '../db';
import activeProcesses from '../processes';
import spawn from 'cross-spawn';
import { PassThrough } from 'stream';
import { DatabaseStream } from '../node-stream-transforms/database-stream';

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

  const outputStream = new PassThrough();

  const childProcess = spawn(command, args);

  await prisma.processData.update({
    where: { id: processId },
    data: { processState: 'running' },
  });

  outputStream.write(
    `Command: ${command} ${args.join(' ')}\nStarted at: ${new Date().toISOString()}\n\n`,
  );

  childProcess.stdout?.pipe(outputStream, { end: false });
  childProcess.stderr?.pipe(outputStream, { end: false });

  childProcess.once('close', async (code: number) => {
    const closeMessage = `\nProcess exited with code ${code}\nEnded at: ${new Date().toISOString()}\n`;

    outputStream.write(closeMessage);
    outputStream.end();

    await prisma.processData.update({
      where: { id: processId },
      data: { processState: 'terminated' },
    });

    activeProcesses.delete(processId);
  });

  childProcess.once('error', async (err: Error) => {
    const errorMessage = `\nProcess error: ${err.message}`;
    outputStream.write(errorMessage);
  });

  activeProcesses.set(processId, {
    process: childProcess,
    eventStream: outputStream.pipe(new DatabaseStream(processId)),
  });
}
