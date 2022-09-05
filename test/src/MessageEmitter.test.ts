import { expect } from 'chai';
import sinon from 'sinon';

import { MessageEmitter } from '../../src/MessageEmitter';
import { wait } from '../../src/utils';

describe('MessageEmitter', () => {
    it('should emit finished event on async callback resolve', async () => {
        const messageEmitter = new MessageEmitter();

        const callback = async () => {
            await wait(5);
        };

        messageEmitter.on('message', callback);

        const finishedCallback = sinon.spy();

        messageEmitter.on('finished', finishedCallback);
        messageEmitter.on('finished 1', finishedCallback);

        messageEmitter.emit('message', { id: '1', });

        expect(finishedCallback).callCount(0);

        await wait(6);

        expect(finishedCallback).callCount(2);
        expect(finishedCallback.firstCall).to.be.calledWith();
        expect(finishedCallback.secondCall).to.be.calledWith('1');
    });
});