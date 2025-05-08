'use server';

import 'server-only';

import prisma from '../db';
import activeProcesses from './active-processes-singleton';
import spawn from 'cross-spawn';
import { PassThrough } from 'stream';
import { pipeline } from 'stream/promises';
import { DatabaseStream } from '../node-streams/database-stream';
import { FormatOutputTransform } from '../node-streams/format-output-stream';
import { getCurrentSession } from '../auth/session';

export async function runProcessAction(processId: string): Promise<void> {
  const { session } = await getCurrentSession();
  if (session === null) {
    throw new Error('Not authenticated');
  }

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
      throw new Error(`Process ${processId} not found in database`);
    }

    const command = processData.command;
    const args = JSON.parse(processData.args);

    const outputStream = new PassThrough();
    const eventStream = new PassThrough({ objectMode: true });

    pipeline(
      outputStream,
      new FormatOutputTransform(),
      // eventStream before DatabaseStream so that chunks won't pile up, but this means
      // historical output will not be stored in the stream, which is good for memory but
      // we need another way to send historical output to the client
      eventStream,
      new DatabaseStream(processId),
    );

    const childProcess = spawn(command, args);

    await prisma.processData.update({
      where: { id: processId },
      data: { processState: 'running' },
    });

    outputStream.write(
      `Command: ${command} ${args.join(' ')}\nStarted at: ${new Date().toISOString()}\n\n`,
    );

    if (childProcess.stdout) {
      pipeline(childProcess.stdout, outputStream, { end: false });
    }

    if (childProcess.stderr) {
      pipeline(childProcess.stderr, outputStream, { end: false });
    }

    childProcess.once(
      'close',
      async (code: number | null, signal: NodeJS.Signals | null) => {
        let closeMessage = '\nProcess exited';
        if (signal !== null) {
          closeMessage += ` with signal: ${signal}`;
        }
        if (code !== null) {
          closeMessage += ` with code: ${code}`;
        }
        closeMessage += `\nEnded at: ${new Date().toISOString()}\n`;

        outputStream.write(closeMessage);
        outputStream.end();

        await prisma.processData.update({
          where: { id: processId },
          data: { processState: 'terminated' },
        });

        activeProcesses.delete(processId);
      },
    );

    childProcess.once('error', async (err: Error) => {
      const errorMessage = `\nProcess error: ${err.message}`;
      outputStream.write(errorMessage);
    });

    activeProcesses.set(processId, {
      process: childProcess,
      eventStream: eventStream,
    });
  } catch (err) {
    console.error(`runProcess: Fatal error for process ${processId}:`, err);
    throw err; // Re-throw to let the caller handle the error
  }
}
