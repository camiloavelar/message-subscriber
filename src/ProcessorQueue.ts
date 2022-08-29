import { MessageEmitter } from './MessageEmitter';
import { Message } from './messageAdapters';
import { queue, QueueObject } from 'async';

export class ProcessorQueue extends MessageEmitter {
    private _queue: QueueObject<any>;
    private _parallelism: number

    constructor(params: any) {
        super();
        this._parallelism = params.parallelism;

        this._queue = queue(async(message: Message) => {
             this.emit('message', message);
              return new Promise((resolve) => {
                this.once(`finished ${message.id}`, () => {
                  resolve();
                })
            });
        }, this._parallelism);
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

    protected push(messages: Message[]) {
        this._queue.push(messages);
    }

    protected async drain(): Promise<void> {
        await this._queue.drain();
    }

}