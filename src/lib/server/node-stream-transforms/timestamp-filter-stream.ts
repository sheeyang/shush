import { ProcessOutputInfoServer } from '@/interfaces/process';
import { Transform, TransformCallback } from 'stream';

/**
 * Transform stream that filters out any output chunks created before the specified lastOutputTime
 */
export class TimestampFilterStream extends Transform {
  private lastOutputTime: Date;

  constructor(lastOutputTime: Date) {
    super({ objectMode: true });
    this.lastOutputTime = lastOutputTime;
  }

  override _transform(
    chunk: ProcessOutputInfoServer,
    _encoding: BufferEncoding,
    callback: TransformCallback,
  ) {
    try {
      // Debug logs to see what's happening
      console.log(this.lastOutputTime);
      console.log({ chunk });

      // Only pass through chunks that are newer than the lastOutputTime
      if (chunk.createdAt >= this.lastOutputTime) {
        callback(null, chunk);
      } else {
        // Skip this chunk by calling callback without passing data
        callback();
      }
    } catch (error) {
      console.error('Error in TimestampFilterStream:', error);
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
