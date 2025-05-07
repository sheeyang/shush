import 'server-only';

import { Writable } from 'stream';
import prisma from '../db';
import { ProcessOutputInfoServer } from '@/interfaces/process';

export class DatabaseStream extends Writable {
  private processId: string;

  constructor(processId: string) {
    super({ objectMode: true });
    this.processId = processId;
  }

  override async _write(
    chunk: ProcessOutputInfoServer,
    _encoding: BufferEncoding,
    callback: (error?: Error | null) => void,
  ) {
    try {
      await prisma.processOutput.create({
        data: {
          processDataId: this.processId,
          data: chunk.output,
          createdAt: chunk.createdAt,
        },
      });
      callback();
    } catch (err) {
      if (err instanceof Error) {
        console.error(`Error updating process state ${this.processId}:`, err);
        callback(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }
}
