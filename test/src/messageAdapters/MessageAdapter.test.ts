import { expect } from 'chai';
import { MessageAdapter } from '../../../src/messageAdapters/MessageAdapter';

describe('MessageAdapter', () => {
    it('should export MessageAdapter', () => {
        expect(MessageAdapter).to.be.ok;
    });
});