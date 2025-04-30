// Deprecated

export default function createJsonParseStream() {
  let buffer = '';
  let openBraces = 0;
  let inString = false;
  let escapeNext = false;
  let start: number | null = null;

  return new TransformStream({
    async transform(chunk, controller) {
      buffer +=
        typeof chunk === 'string' ? chunk : Buffer.from(chunk).toString();

      for (let i = 0; i < buffer.length; i++) {
        const char = buffer[i];

        // Handle string state and escape sequences
        if (char === '"' && !escapeNext) {
          inString = !inString;
        }

        escapeNext = inString && char === '\\' && !escapeNext;

        // Only count braces when not in a string
        if (!inString) {
          if (char === '{') {
            if (openBraces === 0) {
              start = i;
            }
            openBraces++;
          } else if (char === '}') {
            openBraces--;
            if (openBraces === 0 && start !== null) {
              const jsonString = buffer.slice(start, i + 1);
              try {
                const obj = JSON.parse(jsonString);
                controller.enqueue(obj);
              } catch (err) {
                controller.error(err);
                return;
              }
              buffer = buffer.slice(i + 1);
              i = -1;
              start = null;
            }
          }
        }
      }
    },

    async flush(controller) {
      if (buffer.trim()) {
        try {
          const obj = JSON.parse(buffer);
          controller.enqueue(obj);
        } catch (err) {
          controller.error(err);
        }
      }
    },
  });
}
