import { expect } from 'chai';
import sinon from 'sinon';

import { ProcessorQueue } from '../../src/ProcessorQueue';

describe('ProcessorQueue', () => {
    it('should set parallelism', () => {
        const processorQueue = new ProcessorQueue({
            parallelism: 1,
            queueFunction: async () => {
                return Promise.resolve();
            },
        });
        const parallelismSpy = sinon
            .spy(processorQueue, 'parallelism', ['get', 'set']);

        expect(processorQueue.parallelism).to.be.eql(1);
        expect(parallelismSpy.get).callCount(1);

        processorQueue.parallelism = 2;
        expect(processorQueue.parallelism).to.be.eql(2);
        expect(parallelismSpy.set).callCount(1);
    });

    it('should pause queue', () => {
        const processorQueue = new ProcessorQueue({
            parallelism: 1,
            queueFunction: async () => {
                return Promise.resolve();
            },
        });

        expect(processorQueue.paused).to.be.false;

        processorQueue.pause();

        processorQueue.push([{ id: 1, }] as any);

        expect(processorQueue.paused).to.be.true;
        expect(processorQueue.length).to.be.eql(1);
    });

    it('should resume queue', () => {
        const processorQueue = new ProcessorQueue({
            parallelism: 1,
            queueFunction: async () => {
                return Promise.resolve();
            },
        });

        processorQueue.pause();

        expect(processorQueue.paused).to.be.true;

        processorQueue.resume();

        expect(processorQueue.paused).to.be.false;
    });

    it('should process callback when pushed', async () => {
        const queueFunction = sinon.spy((message: any, callback) => {
            callback();
        });

        const processorQueue = new ProcessorQueue({
            parallelism: 1,
            queueFunction,
        });

        processorQueue.push([{ a: 1, }] as any);

        expect(processorQueue.length).to.be.eql(1);

        await processorQueue.drain();

        expect(queueFunction).callCount(1);
        expect(queueFunction).to.be.calledWith({ a: 1, });
        expect(processorQueue.length).to.be.eql(0);
    });

    describe('should stop queue', async () => {
        const processorQueue = new ProcessorQueue({
            parallelism: 1,
            queueFunction: async () => {
                return Promise.resolve();
            },
        });

        processorQueue.stop();
        processorQueue.push([{ id: 1, }] as any);
        await processorQueue.drain();

        expect(processorQueue.length).to.be.eql(1);
    });
});