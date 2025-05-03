import prisma from '../db';
import activeProcesses from '../processes';
import spawn from 'cross-spawn';
import { PassThrough } from 'stream';
import { DatabaseStream } from '../node-stream-transforms/database-stream';
import { ProcessOutputEventStream } from '../node-stream-transforms/chunk-to-object-stream';

export async function runProcess(processId: string): Promise<void> {
  console.log(`[Process ${processId}] Starting process execution`);

  const processData = await prisma.processData.findUnique({
    where: { id: processId },
    select: {
      command: true,
      args: true,
      processState: true,
    },
  });

  if (!processData) {
    console.log(`[Process ${processId}] Not found in database`);
    throw new Error(`Process ${processId} not found in database`);
  }

  const command = processData.command;
  const args = JSON.parse(processData.args);
  console.log(
    `[Process ${processId}] Executing command: ${command} with args:`,
    args,
  );

  const outputStream = new PassThrough();
  const eventStream = new PassThrough({ objectMode: true });

  outputStream.pipe(new DatabaseStream(processId));
  console.log(`[Process ${processId}] Database stream initialized`);

  outputStream.pipe(new ProcessOutputEventStream(processId)).pipe(eventStream);
  console.log(`[Process ${processId}] Event stream initialized`);

  const childProcess = spawn(command, args);
  console.log(`[Process ${processId}] Child process spawned`);

  outputStream.write(
    `Command: ${command} ${args.join(' ')}\nStarted at: ${new Date().toISOString()}\n\n`,
  );

  childProcess.stdout?.pipe(outputStream, { end: false });
  childProcess.stderr?.pipe(outputStream, { end: false });

  childProcess.once('close', async (code: number) => {
    console.log(`[Process ${processId}] Closed with code ${code}`);
    const closeMessage = `\nProcess exited with code ${code}\nEnded at: ${new Date().toISOString()}\n`;

    outputStream.write(closeMessage);
    eventStream.write({
      event: 'state',
      processId,
      state: 'terminated',
    });

    outputStream.end();
    eventStream.end();

    activeProcesses.delete(processId);
    console.log(`[Process ${processId}] Cleanup completed`);
  });

  childProcess.once('error', async (err: Error) => {
    console.log(`[Process ${processId}] Error occurred:`, err.message);
    const errorMessage = `\nProcess error: ${err.message}`;
    outputStream.write(errorMessage);
  });

  activeProcesses.set(processId, {
    process: childProcess,
    eventStream,
  });

  console.log(`[Process ${processId}] Added to active processes`);
  console.log('From run: ', activeProcesses);
}
