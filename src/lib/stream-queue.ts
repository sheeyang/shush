import { ProcessOutput } from '@/generated/prisma';
import EventEmitter from 'events';

export default class StreamQueue {
  private queue: Pick<ProcessOutput, 'createdAt' | 'data'>[];
  private controller: ReadableStreamDefaultController;
  private emitter: EventEmitter;
  private running: boolean;

  constructor(controller: ReadableStreamDefaultController) {
    this.queue = [];
    this.controller = controller;
    this.emitter = new EventEmitter();
    this.running = false;

    this.processQueue = this.processQueue.bind(this);
  }

  enqueue(data: string, createdAt = new Date()) {
    this.queue.push({ data, createdAt });
    this.emitter.emit('data');
    // console.log('queued: ', data);
  }

  start() {
    this.running = true;
    this.processQueue();
    this.emitter.on('data', this.processQueue);
  }

  stop() {
    this.running = false;
    this.emitter.off('data', this.processQueue);
  }

  close() {
    if (this.running && this.queue.length > 0) {
      this.emitter.once('end', () => {
        this.controller.close();
        this.emitter.removeAllListeners();
      });
    } else {
      this.controller.close();
      this.emitter.removeAllListeners();
    }
  }

  private processQueue() {
    // Sort the queue by date in ascending order
    this.queue.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

    // Process the sorted queue
    while (this.queue.length > 0) {
      const data = this.queue.shift(); // Get and remove the first item
      if (!data) continue;
      this.controller.enqueue(data.data);

      // console.log('processed: ', data);
    }

    this.emitter.emit('end');
  }
}
