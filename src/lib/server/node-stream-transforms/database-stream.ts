import { Transform, TransformCallback } from 'stream';
import prisma from '../db';

export class DatabaseStream extends Transform {
  private processId: string;

  constructor(processId: string) {
    super();
    this.processId = processId;
  }

  override async _transform(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: TransformCallback,
  ) {
    const output = chunk.toString();

    try {
      await prisma.processOutput.create({
        data: {
          data: output,
          processDataId: this.processId,
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

  override async _flush(callback: TransformCallback) {
    try {
      await prisma.processData.update({
        where: { id: this.processId },
        data: {
          processState: 'terminated',
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
