import { Transform } from 'stream';
import prisma from '../db';

export function createDatabaseStream(processId: string) {
  return new Transform({
    transform(chunk: Buffer, encoding, callback) {
      const output = chunk.toString();

      prisma.processOutput
        .create({
          data: {
            data: output,
            processDataId: processId,
          },
        })
        .then(() => {
          this.push(chunk);
          callback();
        })
        .catch((err) => {
          console.error(`Error writing output for process ${processId}:`, err);
          callback(err);
        });
    },

    flush(callback) {
      prisma.processData
        .update({
          where: { id: processId },
          data: {
            processState: 'terminated',
          },
        })
        .then(() => {
          callback();
        })
        .catch((err) => {
          console.error(`Error updating process state ${processId}:`, err);
          callback(err);
        });
    },
  });
}
