import logger from '../logger';

export class DebugStream extends TransformStream {
  constructor(label = 'Debug') {
    super({
      transform(chunk, controller) {
        logger.debug(`[${label}]:` + chunk);
        controller.enqueue(chunk);
      },
    });
  }
}
