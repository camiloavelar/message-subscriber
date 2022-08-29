import { ProcessorQueue } from './ProcessorQueue';
import { MessageAdapter, Message } from './messageAdapters';
import { whilst, times } from 'async';
import { wait } from './utils';

export interface MessageSubscriberParams {
  messageAdapter: MessageAdapter
  parallelism: number
  refreshInterval?: number
}

export class MessageSubscriber extends ProcessorQueue {
    private _running: boolean;
    private _paused: boolean;
    private _messageAdapter: MessageAdapter;
    private _maxNumberOfMessages: number;
    private _maxMessages: number;
    private _refreshInterval: number

    constructor(params: MessageSubscriberParams) {
        super(params);
        this._messageAdapter = params.messageAdapter;

        const originalDelete = this._messageAdapter.delete;
        const self = this;
        this._messageAdapter.delete = async function (...args: any) {
          await originalDelete.apply(this, args);
          self.emit(`deleted ${args[0]}`);
          self.emit('deleted', args[0]);
        }

        this._maxMessages = Math.ceil(params.parallelism * 1.10);
        this._refreshInterval = params.refreshInterval || 30,
        this._maxNumberOfMessages = 10;
        this._running = false;
        this._paused = false;
    }

    public async gracefulShutdown() {
        this._running = false;
        await this.drain();
        this.emit('drained');
    }

    public stop() {
      this._running = false;
    }

    public pause() {
      this._paused = true;
      this.emit('paused');
    }

    public resume() {
      this._paused = false;
      this.emit('resumed');
    }

    public start() {
      if(this.listeners('message').length === 0) {
        throw new Error('Message listener should be implemented.');
      }

      this._running = true;

      whilst (
        async () => {
          return this._running;
        },
        async () => {
          if(this._paused) {
            return;
          }

          const idleMessages = this._maxMessages - (this.length);
          const numberOfRequests = Math.ceil(idleMessages / this._maxNumberOfMessages);
          if(numberOfRequests) {
            let totalMessages = idleMessages;

            await times(numberOfRequests, async () => {
              const messagesToRequest = (totalMessages > this._maxNumberOfMessages) ? this._maxNumberOfMessages : totalMessages;

              const messages = await this._messageAdapter.receive(messagesToRequest);

              if(!messages.length) {
                this.emit('empty');
                return;
              }

              if(this._refreshInterval > 0) {
                messages.forEach(this.startRefresh.bind(this));
              }

              this.push(messages);

              totalMessages -= messages.length;
            });
          } else {
            await wait(10);
          }
        },
        async (err) => {
          console.log(err);
          this.emit('stoped');
        }
      );
    }

    private startRefresh(message: Message) {
      const refreshInterval = this._refreshInterval;
      const interval = setInterval(async () => {
        try {
          await message.delay(refreshInterval);
        } catch (err) {
          console.log(err);
        }
      }, (refreshInterval * 0.7) * 1000);

      const finishedCallback = () => {
        clearInterval(interval);
        this.removeAllListeners(`deleted ${message.id}`);
      }

      this.once(`finished ${message.id}`, finishedCallback);

      this.once(`deleted ${message.id}`, () => {
        clearInterval(interval);
        this.off(`finished ${message.id}`, finishedCallback);
      });

      interval.unref();
    }
}