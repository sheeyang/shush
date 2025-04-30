import { Packr } from 'msgpackr';
import { Transform, TransformCallback } from 'stream';

const packr = new Packr();

export function createObjectToMsgpackStream<T>(): Transform {
  return new Transform({
    writableObjectMode: true,
    transform(obj: T, _encoding: BufferEncoding, callback: TransformCallback) {
      try {
        const buffer = packr.encode(obj);
        callback(null, buffer);
      } catch (err) {
        callback(err as Error);
      }
    },
  });
}
