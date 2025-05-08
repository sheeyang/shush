export class DebugStream extends TransformStream {
  constructor(label = 'Debug') {
    super({
      transform(chunk, controller) {
        console.log(`[${label}]:`, chunk);
        controller.enqueue(chunk);
      },
    });
  }
}
