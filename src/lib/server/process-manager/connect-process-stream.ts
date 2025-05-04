import { Readable, PassThrough } from 'stream';
import activeProcesses from '../processes';
import { FormatOutputReverseTransform } from '../node-stream-transforms/format-output-reverse-stream';
import { TimestampFilterStream } from '../node-stream-transforms/timestamp-filter-stream';

type ProcessStreamResult =
  | { success: true; stream: Readable }
  | { success: false; message: string };

export function connectProcessStream(
  processId: string,
  lastOutputTime: Date,
): ProcessStreamResult {
  const processInfo = activeProcesses.get(processId);
  if (!processInfo) {
    return { success: false, message: `Process ${processId} not found` };
  }

  const stream = new PassThrough({ objectMode: true });

  processInfo.eventStream
    .pipe(new TimestampFilterStream(lastOutputTime))
    .pipe(new FormatOutputReverseTransform())
    .pipe(stream);

  return {
    success: true,
    stream,
  };
}
