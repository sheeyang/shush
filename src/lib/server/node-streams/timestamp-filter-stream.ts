import 'server-only';

import { ProcessOutputInfoServer } from '@/interfaces/process';
import { Transform, TransformCallback } from 'stream';
import logger from '@/lib/logger';

// TODO: this may not be needed anymore

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
      // Only pass through chunks that are newer than the lastOutputTime
      if (chunk.createdAt > this.lastOutputTime) {
        callback(null, chunk);
      } else {
        logger.warn('Skipping chunk: ' + chunk);

        // Skip this chunk
        callback();
      }
    } catch (error) {
      console.error('Error in TimestampFilterStream:', error);
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
