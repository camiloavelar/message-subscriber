import { expect } from 'chai';

import { MessageSubscriber } from '../../src/MessageSubscriber';

describe('index', () => {
    it('should export public API', () => {
        expect(MessageSubscriber).to.be.ok
    })
})