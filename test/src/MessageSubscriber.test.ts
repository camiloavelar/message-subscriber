import { expect } from 'chai';
import sinon from 'sinon';
import { MessageAdapter } from '../../src/messageAdapters';
import { MessageSubscriber } from '../../src/MessageSubscriber';
import { wait } from '../../src/utils';

let messageAdapter = {
    maxNumberOfMessages: 10,
    receive: sinon.stub(),
    delete: sinon.stub(),
    delay: sinon.stub(),
};

describe('MessageSubscriber', () => {
    beforeEach(() => {
        sinon.reset();
    });

    describe('errors', () => {
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
            const sub = new MessageSubscriber({
                parallelism: 1, messageAdapter: {
                    receive: sinon.stub().rejects(),
                },
            } as any);

            sub.on('message', async () => { });

            const errorSpy = sinon.spy();

            sub.on('error', errorSpy);

            sub.start();

            await wait(100);

            sub.stop();

            expect(errorSpy.callCount).to.be.greaterThan(1);
        });
    });

    it('should receive messages', async () => {
        const sub = new MessageSubscriber({
            refreshInterval: 1,
            parallelism: 10,
            messageAdapter: <unknown>messageAdapter as MessageAdapter,
        });

        const delayStub = sinon.stub();

        messageAdapter.receive.resolves([{ id: '1', delay: delayStub, }]);

        let messageMock: any;

        sub.on('message', async (message: any) => {
            await wait(1100);
            messageMock = message;
        });

        sub.start();

        await sub.gracefulShutdown();

        expect(messageMock.id).to.be.eql('1');
        expect(delayStub).callCount(2);
        expect(delayStub).to.be.calledWith(1);
    });

    it('should emit empty queue', async () => {
        const sub = new MessageSubscriber({
            refreshInterval: 1,
            parallelism: 10,
            messageAdapter: <unknown>messageAdapter as MessageAdapter,
        });

        const emptyStub = sinon.stub();

        messageAdapter.receive.resolves([]);

        sub.on('message', sinon.stub());
        sub.on('empty', emptyStub);

        sub.start();

        await wait(10);

        sub.stop();

        expect(emptyStub.callCount).to.be.greaterThan(0);
    });

    it('should not refresh messages', async () => {
        const sub = new MessageSubscriber({
            refreshInterval: 0,
            parallelism: 10,
            messageAdapter: <unknown>messageAdapter as MessageAdapter,
        });

        const delayStub = sinon.stub();

        messageAdapter.receive.resolves([{ id: '1', delay: delayStub, }]);

        let messageMock: any;

        sub.on('message', async (message: any) => {
            await wait(1100);
            messageMock = message;
        });

        sub.start();

        await sub.gracefulShutdown();

        expect(messageMock.id).to.be.eql('1');
        expect(delayStub).callCount(0);
    });

    it('should emit delete event', async () => {
        const sub = new MessageSubscriber({
            refreshInterval: 1,
            parallelism: 10,
            messageAdapter: <unknown>messageAdapter as MessageAdapter,
        });

        const deleteCallbackStub = sinon.stub();

        messageAdapter.receive.resolves([{ id: '1', receipt: '2', }]);

        let messageMock: any;

        sub.on('message', async (message: any) => {
            await wait(1100);
            await messageAdapter.delete(message.receipt);
            messageMock = message;
        });

        sub.on('deleted 2', deleteCallbackStub);
        sub.on('deleted', deleteCallbackStub);

        sub.start();

        await sub.gracefulShutdown();

        expect(messageMock.id).to.be.eql('1');
        expect(deleteCallbackStub).callCount(2);
        expect(deleteCallbackStub.getCall(1)).to.be.calledWith('2');
    });

    it('should emit paused event', async () => {
        const sub = new MessageSubscriber({
            refreshInterval: 1,
            parallelism: 10,
            messageAdapter: <unknown>messageAdapter as MessageAdapter,
        });

        const pausedCallbackStub = sinon.stub();

        messageAdapter.receive.resolves([{ id: '1', receipt: '2', }]);

        sub.on('message', sinon.stub());

        sub.on('paused', pausedCallbackStub);

        sub.start();

        sub.pause();

        await wait(10);

        expect(pausedCallbackStub).callCount(1);

        sub.stop();
    });

    it('should emit resumed event', async () => {
        const sub = new MessageSubscriber({
            refreshInterval: 1,
            parallelism: 10,
            messageAdapter: <unknown>messageAdapter as MessageAdapter,
        });

        const resumedCallbackStub = sinon.stub();

        messageAdapter.receive.resolves([{ id: '1', receipt: '2', }]);

        sub.on('message', sinon.stub());

        sub.on('resumed', resumedCallbackStub);

        sub.start();

        sub.pause();

        await wait(10);

        sub.resume();

        expect(resumedCallbackStub).callCount(1);

        sub.stop();
    });

    it('should take long to process messages and not request any', async () => {
        const sub = new MessageSubscriber({
            refreshInterval: 0,
            parallelism: 1,
            messageAdapter: <unknown>messageAdapter as MessageAdapter,
        });

        messageAdapter.receive.resolves([{ id: '1', receipt: '2', }]);

        sub.on('message', async () => {
            await wait(500);
        });

        sub.start();

        expect(sub.length).to.be.eql(0);

        await sub.gracefulShutdown();
    });
});