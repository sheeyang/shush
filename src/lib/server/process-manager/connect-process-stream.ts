import { Readable } from 'stream';
import activeProcesses from '../processes';
import { PackrStream } from 'msgpackr';

type ProcessStreamResult =
  | { success: true; stream: ReadableStream }
  | { success: false; message: string };

export function connectProcessStream(processId: string): ProcessStreamResult {
  const processInfo = activeProcesses.get(processId);
  if (!processInfo) {
    return { success: false, message: `Process ${processId} not found` };
  }

  return {
    success: true,
    stream: nodeReadableToWebReadable(
      processInfo.eventStream.pipe(new PackrStream()),
    ),
  };
}

export function nodeReadableToWebReadable(nodeStream: Readable) {
  const reader = nodeStream[Symbol.asyncIterator]();

  return new ReadableStream({
    async pull(controller) {
      const { value, done } = await reader.next();
      if (done) {
        controller.close();
      } else {
        controller.enqueue(value);
      }
    },
    cancel() {
      if (nodeStream.destroy) nodeStream.destroy();
    },
  });
}
