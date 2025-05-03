import { ProcessOutputEvent } from '@/interfaces/process';
import { Transform, TransformCallback } from 'stream';

export class ProcessOutputEventStream extends Transform {
  private processId: string;

  constructor(processId: string) {
    super({ readableObjectMode: true });
    this.processId = processId;
  }

  override _transform(
    chunk: Buffer,
    _encoding: BufferEncoding,
    callback: TransformCallback,
  ) {
    const obj: ProcessOutputEvent = {
      event: 'output',
      output: chunk.toString(),
      processId: this.processId,
    };
    callback(null, obj);
  }
}
