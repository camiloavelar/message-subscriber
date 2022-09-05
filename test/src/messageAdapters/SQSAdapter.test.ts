import { SQSAdapter } from '../../../src/messageAdapters/SQSAdapter';
import { ChangeMessageVisibilityCommand, DeleteMessageCommand, ReceiveMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { AwsClientStub, mockClient } from 'aws-sdk-client-mock';
import { expect } from 'chai';

let sqsMock: AwsClientStub<SQSClient>;

describe('SQSAdapter', () => {
    beforeEach(() => {
        sqsMock = mockClient(SQSClient);
    });

    afterEach(() => {
        sqsMock.restore();
    });

    it('should instanciate with sqs param', () => {
        new SQSAdapter({
            maxNumberOfMessages: 10,
            queueURL: 'url',
            sqs: {
                region: 'us-east-1',
            },
        });
    });

    describe('delete', () => {
        it('should call delete', async () => {
            const sqsAdapter = new SQSAdapter({
                maxNumberOfMessages: 10,
                queueURL: 'url',
            });

            await sqsAdapter.delete('1');

            const deleteMessageCommand = new DeleteMessageCommand({
                QueueUrl: 'url',
                ReceiptHandle: '1',
            });

            expect(sqsMock.send.callCount).to.be.eqls(1);
            expect(sqsMock.call(0).args[0].input).to.eqls(deleteMessageCommand.input);
        });

        it('should call delete on message', async () => {
            const sqsAdapter = new SQSAdapter({
                maxNumberOfMessages: 10,
                queueURL: 'url',
            });

            sqsMock.on(ReceiveMessageCommand).resolves({
                Messages: [{
                    MessageId: '1',
                    ReceiptHandle: '2',
                    Body: '1',
                }],
            });

            const deleteCommand = new DeleteMessageCommand({
                QueueUrl: 'url',
                ReceiptHandle: '2',
            });

            const messages = await sqsAdapter.receive(2);

            await messages[0].delete();

            expect(sqsMock.send.callCount).to.be.eqls(2);
            expect(sqsMock.call(1).args[0].input).to.eqls(deleteCommand.input);
        });
    });

    describe('delay', () => {
        it('should call delay', async () => {
            const sqsAdapter = new SQSAdapter({
                maxNumberOfMessages: 10,
                queueURL: 'url',
            });

            await sqsAdapter.delay('1', 2);

            const changeMessageVisibilityCommand = new ChangeMessageVisibilityCommand({
                QueueUrl: 'url',
                ReceiptHandle: '1',
                VisibilityTimeout: 2,
            });

            expect(sqsMock.send.callCount).to.be.eqls(1);
            expect(sqsMock.call(0).args[0].input).to.eqls(changeMessageVisibilityCommand.input);
        });

        it('should call delay on message', async () => {
            const sqsAdapter = new SQSAdapter({
                maxNumberOfMessages: 10,
                queueURL: 'url',
            });

            sqsMock.on(ReceiveMessageCommand).resolves({
                Messages: [{
                    MessageId: '1',
                    ReceiptHandle: '2',
                    Body: '1',
                }],
            });

            const changeMessageVisibilityCommand = new ChangeMessageVisibilityCommand({
                QueueUrl: 'url',
                ReceiptHandle: '2',
                VisibilityTimeout: 2,
            });

            const messages = await sqsAdapter.receive(2);

            await messages[0].delay(2);

            expect(sqsMock.send.callCount).to.be.eqls(2);
            expect(sqsMock.call(1).args[0].input).to.eqls(changeMessageVisibilityCommand.input);
        });
    });

    describe('receive', () => {
        it('should not receive Messages', async () => {
            const sqsAdapter = new SQSAdapter({
                maxNumberOfMessages: 10,
                queueURL: 'url',
            });

            sqsMock.on(ReceiveMessageCommand).resolves({
                Messages: undefined,
            });

            const messages = await sqsAdapter.receive(2);

            expect(messages).to.be.eql([]);
        });

        it('should receive empty Messages', async () => {
            const sqsAdapter = new SQSAdapter({
                maxNumberOfMessages: 10,
                queueURL: 'url',
            });

            sqsMock.on(ReceiveMessageCommand).resolves({
                Messages: [],
            });

            const messages = await sqsAdapter.receive(2);

            expect(messages).to.be.eql([]);
        });

        it('should receive Messages', async () => {
            const sqsAdapter = new SQSAdapter({
                maxNumberOfMessages: 10,
                queueURL: 'url',
            });

            sqsMock.on(ReceiveMessageCommand).resolves({
                Messages: [{
                    MessageId: '1',
                    ReceiptHandle: '2',
                    Body: '1',
                }],
            });

            const messages = await sqsAdapter.receive(2);

            expect(messages[0].id).to.be.eql('1');
            expect(messages[0].receipt).to.be.eql('2');
            expect(messages[0].payload).to.be.eql('1');
            expect(typeof (messages[0].delete)).to.be.eql('function');
            expect(typeof (messages[0].delay)).to.be.eql('function');
        });

        it('should receive Messages with default max', async () => {
            const sqsAdapter = new SQSAdapter({
                maxNumberOfMessages: 10,
                queueURL: 'url',
            });

            sqsMock.on(ReceiveMessageCommand).resolves({
                Messages: [{
                    MessageId: '1',
                    ReceiptHandle: '2',
                    Body: '1',
                }],
            });

            const receiveMessageCommand = new ReceiveMessageCommand({
                MaxNumberOfMessages: 10,
                QueueUrl: 'url',
                VisibilityTimeout: 30,
                WaitTimeSeconds: 20,
            });

            await sqsAdapter.receive();

            expect(sqsMock.call(0).args[0].input).to.eqls(receiveMessageCommand.input);
        });

        it('should receive Messages with max in parameter', async () => {
            const sqsAdapter = new SQSAdapter({
                maxNumberOfMessages: 10,
                queueURL: 'url',
            });

            sqsMock.on(ReceiveMessageCommand).resolves({
                Messages: [{
                    MessageId: '1',
                    ReceiptHandle: '2',
                    Body: '1',
                }],
            });

            const receiveMessageCommand = new ReceiveMessageCommand({
                MaxNumberOfMessages: 2,
                QueueUrl: 'url',
                VisibilityTimeout: 30,
                WaitTimeSeconds: 20,
            });

            await sqsAdapter.receive(2);

            expect(sqsMock.call(0).args[0].input).to.eqls(receiveMessageCommand.input);
        });
    });
});