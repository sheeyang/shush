import { Transform, TransformCallback } from 'stream';
import prisma from '../db';
import { ProcessOutputInfoServer } from '@/interfaces/process';

export class DatabaseStream extends Transform {
  private processId: string;

  constructor(processId: string) {
    super({ objectMode: true });
    this.processId = processId;
  }

  override async _transform(
    chunk: ProcessOutputInfoServer,
    _encoding: BufferEncoding,
    callback: TransformCallback,
  ) {
    try {
      await prisma.processOutput.create({
        data: {
          processDataId: this.processId,
          data: chunk.output,
          createdAt: chunk.createdAt,
        },
      });
      callback(null, chunk);
    } catch (err) {
      if (err instanceof Error) {
        console.error(`Error updating process state ${this.processId}:`, err);
        callback(err instanceof Error ? err : new Error(String(err)));
      }
    }
  }
}
