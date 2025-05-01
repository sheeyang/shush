import { Readable } from 'stream';
import activeProcesses from '../processes';
import { createChunkToObjectStream } from '../node-stream-transforms/create-chunk-to-object-stream';
import { PackrStream } from 'msgpackr';

type ProcessStreamResult =
  | { success: true; stream: ReadableStream }
  | { success: false; message: string };

export function connectProcessStream(processId: string): ProcessStreamResult {
  const processInfo = activeProcesses.get(processId);
  if (!processInfo) {
    return { success: false, message: `Process ${processId} not found` };
  }

  const { outputStream } = processInfo;

  const readable = outputStream
    .pipe(createChunkToObjectStream(processId))
    .pipe(new PackrStream());

  return { success: true, stream: nodeReadableToWebReadable(readable) };
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
