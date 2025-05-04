import { ProcessOutputInfoServer } from '@/interfaces/process';
import { Transform, TransformCallback } from 'stream';

/**
 * Transform stream that converts each chunk to an object with output string and createdAt timestamp
 */
export class FormatOutputTransform extends Transform {
  constructor(options = {}) {
    super({
      ...options,
      readableObjectMode: true,
    });
  }

  _transform(
    chunk: Buffer | string,
    _encoding: BufferEncoding,
    callback: TransformCallback,
  ) {
    try {
      const output = chunk.toString();

      const formattedOutput: ProcessOutputInfoServer = {
        output,
        createdAt: new Date(),
      };

      callback(null, formattedOutput);
    } catch (error) {
      console.error('Error in FormatOutputTransform:', error);
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
