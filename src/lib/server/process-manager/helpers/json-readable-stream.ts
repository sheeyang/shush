// TODO: not in use

/**
 * JsonReadableStream extends ReadableStream to automatically convert objects to JSON strings
 * This makes it easy to stream JSON data in a web application
 */
export class JsonReadableStream<T> extends ReadableStream<string> {
  constructor(
    source?: UnderlyingSource<T>,
    strategy?: QueuingStrategy<string>,
  ) {
    // Create our own source that transforms objects to JSON
    const jsonSource: UnderlyingSource<string> = {
      start(controller) {
        // Store the original source's start method if it exists
        if (source?.start) {
          source.start(
            controller as unknown as ReadableStreamDefaultController<T>,
          );
        }
      },
      //   pull(controller) {
      //     // If the original source has a pull method, call it
      //     // and transform its output to JSON
      //     if (source?.pull) {
      //       return Promise.resolve(
      //         source.pull(
      //           controller as unknown as ReadableStreamDefaultController<T>,
      //         ),
      //       ).then((chunk) => {
      //         if (chunk !== undefined && chunk !== null) {
      //           // Convert the chunk to JSON and enqueue it
      //           const jsonChunk = JSON.stringify(chunk);
      //           controller.enqueue(jsonChunk);
      //         }
      //         return null;
      //       });
      //     }
      //     return Promise.resolve();
      //   },
      cancel(reason) {
        // Pass cancellation to the original source if it has a cancel method
        if (source?.cancel) {
          return source.cancel(reason);
        }
      },
    };

    // Initialize the parent ReadableStream with our JSON transformer
    super(jsonSource, strategy);
  }

  /**
   * Helper method to create a JsonReadableStream from an array of objects
   * @param items Array of items to convert to a JSON stream
   * @returns A JsonReadableStream that will output each item as JSON
   */
  static fromArray<T>(items: T[]): JsonReadableStream<T> {
    let index = 0;

    return new JsonReadableStream<T>({
      pull(controller) {
        if (index < items.length) {
          const item = items[index++];
          controller.enqueue(item);
        } else {
          controller.close();
        }
      },
    });
  }

  /**
   * Helper method to create a JsonReadableStream from an async iterable
   * @param iterable An async iterable that yields items to convert to JSON
   * @returns A JsonReadableStream that will output each yielded item as JSON
   */
  static fromAsyncIterable<T>(
    iterable: AsyncIterable<T>,
  ): JsonReadableStream<T> {
    const iterator = iterable[Symbol.asyncIterator]();

    return new JsonReadableStream<T>({
      async pull(controller) {
        try {
          const { value, done } = await iterator.next();

          if (done) {
            controller.close();
          } else {
            controller.enqueue(value);
          }
        } catch (error) {
          controller.error(error);
        }
      },
    });
  }
}
