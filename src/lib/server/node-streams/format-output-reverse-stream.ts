import 'server-only';

import { ProcessOutputInfoServer } from '@/interfaces/process';
import { Transform, TransformCallback } from 'stream';

/**
 * Transform stream that converts formatted objects back to original output text
 */
export class FormatOutputReverseTransform extends Transform {
  constructor(options = {}) {
    super({
      ...options,
      writableObjectMode: true,
    });
  }

  _transform(
    chunk: ProcessOutputInfoServer,
    _encoding: BufferEncoding,
    callback: TransformCallback,
  ) {
    try {
      // Extract just the output string from the object
      const originalOutput = chunk.output;

      // Push the plain text output
      callback(null, originalOutput);
    } catch (error) {
      // Log the error and pass it to the callback
      console.error('Error in FormatOutputReverseTransform:', error);
      callback(error instanceof Error ? error : new Error(String(error)));
    }
  }
}
