export function createDebugStream(label = 'Debug') {
  return new TransformStream({
    transform(chunk, controller) {
      console.log(`[${label}]:`, chunk);
      controller.enqueue(chunk);
    },
  });
}
