import { Transform, TransformCallback } from 'stream';

export interface ChunkObject {
  data: string;
  processId: string;
  createdAt: number;
}

export function createChunkToObjectStream(processId: string): Transform {
  return new Transform({
    readableObjectMode: true,
    transform(
      chunk: Buffer,
      _encoding: BufferEncoding,
      callback: TransformCallback,
    ) {
      const obj: ChunkObject = {
        data: chunk.toString(),
        processId,
        createdAt: Date.now(),
      };
      callback(null, obj);
    },
  });
}
