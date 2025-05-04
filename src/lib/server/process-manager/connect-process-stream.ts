import { Readable } from 'stream';
import activeProcesses from '../processes';

type ProcessStreamResult =
  | { success: true; stream: Readable }
  | { success: false; message: string };

export function connectProcessStream(processId: string): ProcessStreamResult {
  const processInfo = activeProcesses.get(processId);
  if (!processInfo) {
    return { success: false, message: `Process ${processId} not found` };
  }

  return {
    success: true,
    stream: processInfo.eventStream,
  };
}
