import { wait } from '../../src/utils';

describe('utils', () => {
    describe('wait', () => {
        it('should wait', async () => {
            await wait(10);
        });
    });
});