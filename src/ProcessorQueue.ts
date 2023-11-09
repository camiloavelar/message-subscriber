import { Message } from './messageAdapters';
import { queue, QueueObject } from 'async';
import { wait } from './utils';

export class ProcessorQueue {
  private _queue: QueueObject<any>;
  private _parallelism: number;

  constructor(params: any) {
    this._parallelism = params.parallelism;

    this._queue = this._startQueue(params.queueFunction);
  }

  set parallelism(newParallelism: number) {
    this._parallelism = newParallelism;
    this._queue.concurrency = this._parallelism;
  }

  get parallelism(): number {
    return this._parallelism;
  }

  get length(): number {
    return this._queue.length();
  }

  get paused(): boolean {
    return this._queue.paused;
  }

  private _startQueue(queueFunction: any) {
    return queue(
      queueFunction,
      this._parallelism
    );
  }

  public push(messages: Message[]) {
    this._queue.push(messages);
  }

  public async drain(): Promise<void> {
    if(!this._queue.started) {
      await wait(100); // Wait for the subscriber to run
      if(!this._queue.started) {
        return Promise.resolve();
      }
    }

    await this._queue.drain();
  }

  public pause() {
    this._queue.pause();
  }

  public resume() {
    this._queue.resume();
  }

  public stop() {
    this._queue.kill();
  }
}