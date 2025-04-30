import { unpackMultiple } from 'msgpackr';

export function createMsgpackToObjectStream(): TransformStream<
  Uint8Array,
  unknown
> {
  let buffer = new Uint8Array();

  return new TransformStream<Uint8Array, unknown>({
    transform(chunk, controller) {
      const combined = new Uint8Array(buffer.length + chunk.length);
      combined.set(buffer);
      combined.set(chunk, buffer.length);

      let lastOffset = 0;

      unpackMultiple(combined, (value, _start, end) => {
        if (typeof end !== 'number') {
          return false; // Stop parsing if we can't track offset
        }

        controller.enqueue(value);
        lastOffset = end;
        return true;
      });

      buffer = combined.subarray(lastOffset);
    },
  });
}
