import { Readable, PassThrough } from 'stream';
import activeProcesses from '../processes';

type ProcessStreamResult =
  | { success: true; stream: Readable }
  | { success: false; message: string };

export function connectProcessStream(processId: string): ProcessStreamResult {
  const processInfo = activeProcesses.get(processId);
  if (!processInfo) {
    return { success: false, message: `Process ${processId} not found` };
  }

  // Create a new PassThrough stream to avoid locking the original event stream
  const stream = new PassThrough();
  processInfo.eventStream.pipe(stream);

  return {
    success: true,
    stream,
  };
}
