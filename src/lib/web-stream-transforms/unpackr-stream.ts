import { Unpackr, Options } from 'msgpackr';

export class UnpackrStream extends TransformStream<Uint8Array, unknown> {
  constructor(options: Options = {}) {
    let incompleteBuffer: Uint8Array | null = null;
    options.structures = [];

    const unpackr = new Unpackr(options);

    super({
      transform(chunk, controller) {
        if (incompleteBuffer) {
          const combined = new Uint8Array(
            incompleteBuffer.length + chunk.length,
          );
          combined.set(incompleteBuffer);
          combined.set(chunk, incompleteBuffer.length);
          chunk = combined;
          incompleteBuffer = null;
        }

        let values;
        try {
          values = unpackr.unpackMultiple(chunk);
          // msgpackr does not export a type for this error, so we need to use any
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
          if (error.incomplete) {
            incompleteBuffer = chunk.slice(error.lastPosition);
            values = error.values;
          } else {
            throw error;
          }
        }

        for (const value of values || []) {
          controller.enqueue(value);
        }
      },
    });
  }
}
