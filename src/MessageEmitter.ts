import { EventEmitter } from 'node:events';

const eventEmitter = new EventEmitter();
const originalOn = eventEmitter.on;

export class MessageEmitter extends EventEmitter {
    constructor() {
      super();
    }

    //@ts-ignore
    public async on(...args) {
        if(args[0] === 'message') {
            const oldFn = args[1];

            args[1] = async function (...args: any) {
              try {
                var response = await oldFn.apply(this, args);
              } finally {
                //@ts-ignore
                this.emit(`finished ${args[0].id}`);
                //@ts-ignore
                this.emit('finished', args[0].id);
              }

              return response;
            };
          }

        //@ts-ignore
        return originalOn.apply(this, args);
    }
}