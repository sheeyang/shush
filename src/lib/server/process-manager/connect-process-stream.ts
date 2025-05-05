import { Readable, PassThrough } from 'stream';
import { pipeline } from 'stream/promises';
import activeProcesses from '../processes';
import { FormatOutputReverseTransform } from '../node-stream-transforms/format-output-reverse-stream';
import { TimestampFilterStream } from '../node-stream-transforms/timestamp-filter-stream';
import { getHistoricalOutput } from './helpers/get-historical-output';

type ProcessStreamResult =
  | { success: true; stream: Readable }
  | { success: false; message: string };

export async function connectProcessStream(
  processId: string,
  lastOutputTime: Date,
): Promise<ProcessStreamResult> {
  const processInfo = activeProcesses.get(processId);
  if (!processInfo) {
    // This could happen if the process is finished before connecting
    return { success: false, message: `Process ${processId} not found` };
  }

  // make a "copy" of eventStream because we don't want to destroy
  // it when connection to the client its lost
  // Use pipe here instead of pipeline because we don't want
  // processInfo.eventStream to end when eventStream ends
  const eventStream = new PassThrough({ objectMode: true });
  processInfo.eventStream.pipe(eventStream);

  // this is the stream that will be sent to the client
  const stream = new PassThrough({ writableObjectMode: true });

  pipeline(
    eventStream,
    new TimestampFilterStream(lastOutputTime),
    new FormatOutputReverseTransform(),
    stream,
  ).catch((err) => {
    console.error(
      `connectProcessStream: Stream pipeline error for process ${processId}:`,
      err,
    );
  });

  const unsent = await getHistoricalOutput(processId, lastOutputTime);
  stream.write(unsent);

  return {
    success: true,
    stream,
  };
}
