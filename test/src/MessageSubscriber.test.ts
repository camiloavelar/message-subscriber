import { expect } from 'chai';
import sinon from 'sinon';
import { setTimeout } from 'timers/promises';
import { MessageSubscriber } from '../../src/MessageSubscriber';

describe('MessageSubscriber', () => {
    it('should error when message listener is not implemented', () => {
        expect(
            () => {
                new MessageSubscriber({ parallelism: 1, messageAdapter: {}, } as any).start();
            }
        ).to.throw('Message listener should be implemented before start call.');
    });

    it('should throw error calling start when already stoped', async () => {
        const sub = new MessageSubscriber({ parallelism: 1, messageAdapter: {}, } as any);

        sub.on('message', async () => { });

        sub.start();
        sub.stop();

        return new Promise((resolve) => {
            sub.on('stoped', () => {
                expect(() => {
                    sub.start();
                }).to.throw('The subscriber is in stopped state, cannot call start again.');

                resolve();
            });
        });
    });

    it('should emit error when errored getting messages', async () => {
        const sub = new MessageSubscriber({ parallelism: 1, messageAdapter: {}, } as any);

        sub.on('message', async () => { });

        const errorSpy = sinon.spy();

        sub.on('error', errorSpy);

        sub.start();

        await setTimeout(10);

        sub.stop();

        expect(errorSpy).callCount(1);
    });
});