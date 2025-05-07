import 'server-only';

import { Readable, PassThrough } from 'stream';
import { pipeline } from 'stream/promises';
import activeProcesses from '../processes';
import { FormatOutputReverseTransform } from '../node-stream-transforms/format-output-reverse-stream';
import { getHistoricalOutput } from './helpers/get-historical-output';

export async function connectProcessStream(
  processId: string,
  lastOutputTime: Date,
): Promise<Readable> {
  // Make a "copy" of eventStream because we don't want to destroy
  // processInfo.eventStream when connection to the client its lost
  const eventStream = new PassThrough({ objectMode: true });
  // Turn eventStream back into outputStream (string stream) to be sent to the client
  const outputStream = new PassThrough({ writableObjectMode: true });

  // Get data that might have been lost due to race conditions
  // This should runs before new outputs are sent to the "copied" eventStream
  const unsent = await getHistoricalOutput(processId, {
    after: lastOutputTime,
  });
  outputStream.write(unsent);

  const processInfo = activeProcesses.get(processId);
  if (!processInfo) {
    // This could happen if the process is already finished before connecting
    outputStream.end();
    return outputStream;
  }

  // Use pipe here instead of pipeline because pipeline will automatically
  // end processInfo.eventStream when eventStream ends (eg. when the client disconnects)
  processInfo.eventStream.pipe(eventStream);

  pipeline(
    eventStream,
    // new TimestampFilterStream(lastOutputTime), // TODO: this may not be needed anymore
    new FormatOutputReverseTransform(),
    outputStream,
  ).catch((err) => {
    console.error(
      `connectProcessStream: Stream pipeline error for process ${processId}:`,
      err,
    );
  });

  return outputStream;
}
