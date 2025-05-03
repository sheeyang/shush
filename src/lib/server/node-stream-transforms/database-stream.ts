import { Transform, TransformCallback } from 'stream';
import prisma from '../db';

export class DatabaseStream extends Transform {
  private processId: string;

  constructor(processId: string) {
    super();
    this.processId = processId;
  }

  override _transform(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: TransformCallback,
  ) {
    const output = chunk.toString();

    prisma.processOutput
      .create({
        data: {
          data: output,
          processDataId: this.processId,
        },
      })
      .then(() => {
        this.push(chunk);
        callback();
      })
      .catch((err) => {
        console.error(
          `Error writing output for process ${this.processId}:`,
          err,
        );
        callback(err);
      });
  }

  override _flush(callback: TransformCallback) {
    prisma.processData
      .update({
        where: { id: this.processId },
        data: {
          processState: 'terminated',
        },
      })
      .then(() => callback())
      .catch((err) => {
        console.error(`Error updating process state ${this.processId}:`, err);
        callback(err);
      });
  }
}
