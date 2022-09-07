# message-subscriber

[![NPM version][npm-image]][npm-url]
[![Build status][ci-image]][ci-url]
![TypeScript types][typescript-image]
[![Maintainability][codeclimate-image]][codeclimate-url]
[![Coverage Status][coverage-image]][coverage-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![FOSSA Status][fossa-badge-image]][fossa-badge-url]

Async message subscriber for receiving messages from queueing services available in cloud services. Gives the option to implement your own MessageAdapter to plug new services and use the core message-subscriber. Can handle hundreds of parallel processing using Node async nature, the messages are delivered by subscribing to an Event dispatched from Node EventEmitter. 

## Installation

```sh
npm install --save message-subscriber
```

## MessageSubscriber

The MessageSubscriber is the main interface to manage and receive the messages from the queueing service. 

```ts
const messageSubscriber = new MessageSubscriber({
    messageAdapter: sqsAdapter,
    parallelism: 100,
    refreshInterval: 10
});
```

- `messageAdapter` - **required**, message adapter that will be called to send de commands to the cloud queue service (E.g.: SQSAdapter)
- `parallelism` - **required** the number of parallel messages that you will receive to process
- `refreshInterval` - _optional_, when you receive one message from the queue service it becomes unavailable for a period of time, using the refresh interval the MessageSubscriber will delay the message using the interval passed (in seconds) (E.g.: Using aws sqs when you receive a message it becomes invisible for 30 seconds, if your processing takes more than 30 seconds, the message will become available and you can have duplicity, with refreshInterval the code will call delay on the message from time to time and the message will not become available when processing).

### Events

The MessageSubscriber emits the following events:

- `message`: Comes with the message received
    - Message:
        - `id: string` - The id of the message
        - `receipt?: string` - The receipt of the message (Generally used to delete)
        - `payload: any` - The payload of the message
        - `attributes?: any` - The attributes of the message
        - `receivedTimestamp: number` - The timestamp that the message was received
        - `delete: async function` - The function to delete message
        - `delay:  async function` - The function to delay message

- `empty`: When the queue is empty this event is emitted
- `error`: If any operation errors this event will be dispatched with the error
- `drained`: When gracefulShutdown() is called the code will wait all the messages that are queued to be processed, when all are processed this event is called
- `paused`: When pause() is called this event is emitted
- `resumed`: When resume() is called this event is emitted
- `stoped`: `When stop() is called this event is emitter. (Note: when the queue is stoped it **CAN NOT** start again, this **DO NOT** wait for the queued messages to be processed)

## MessageAdapters

The message adapters are interfaces to communicate with the queueing services at the cloud. 
You can use the MessageAdapter Interface to create your own adapter and plug at the MessageSubscriber to use the queueing service that you need.

### SQSAdapter
To use this package with AWS, you need to have at least one SQS queue created in your account. You'll need the queue URL to pass as a parameter to the SQSAdapter. E.g.: `https://sqs.us-east-1.amazonaws.com/000000000000/your-queue`.

Authentication to AWS can be done using any methods of [setting credentials in the AWS Javascript SDK](https://docs.aws.amazon.com/sdk-for-javascript/v3/developer-guide/setting-credentials-node.html). Your credential must have the following permissions in the queues that you are going to use in this package:

- `sqs:ReceiveMessage`
- `sqs:DeleteMessage`
- `sqs:ChangeMessageVisibility`

```ts
const sqsAdapter = new SQSAdapter({
    queueURL: 'QUEUE_URL',
    maxNumberOfMessages: 10,
    sqs: {
        region: 'us-east-1'
    }
})
```
- `queueURL` - **required**, the url of the AWS SQS Queue
- `maxNumberOfMessages` - _optional_ the max number of messages to receive at one SQS receiveMessage call, default: 10
- `sqs` - **required**, the params to configure the aws sqs queue (these are the params that are passed to aws-sdk sqs client).

## Usage

This example uses que SQSAdapter to subscribe for messages using de AWS SQS.
```ts
import { Message, MessageSubscriber, SQSAdapter } from 'message-subscriber';

const sqsAdapter = new SQSAdapter({
    queueURL: 'QUEUE_URL',
    maxNumberOfMessages: 10,
    sqs: {
        region: 'us-east-1'
    }
})

const messageSubscriber = new MessageSubscriber({
    messageAdapter: sqsAdapter,
    parallelism: 100,
    refreshInterval: 10 // This will automatically refresh the delay of the message visibility at the queue.
});

// Registering event listeners

messageSubscriber.on('message', (message: Message) => {
  console.log('messageReceived', message);
  console.log('queue length', messageSubscriber.length); // You can see the length of the queue that the messages are being dispatched
  await message.delete(); // You can call delete directly from message
});

messageSubscriber.on('empty', () => {
  console.log('queue is empty');
});

messageSubscriber.on('error', (err: Error) => {
  console.log('messageSubscriber error', err);
});

// Handling process termination

const handleShutdown = async () => {
  try {
    await messageSubscriber.gracefulShutdown(); // This will wait for queue to process all pending messages.
  } catch (err) {
    console.log(err);
    process.exit(1);
  }

  process.exit(0);
};

process.on('SIGINT', handleShutdown);
process.on('SIGTERM', handleShutdown);

// Starting message-subscriber
messageSubscriber.start();
```

## License

MIT

[![FOSSA Status][fossa-large-image]][fossa-large-url]

[coverage-image]: https://coveralls.io/repos/github/CamiloAvelar/message-subscriber/badge.svg?branch=main
[coverage-url]: https://coveralls.io/github/CamiloAvelar/message-subscriber?branch=main
[ci-image]: https://github.com/CamiloAvelar/message-subscriber/actions/workflows/validations.yml/badge.svg
[ci-url]: https://github.com/CamiloAvelar/message-subscriber/actions/workflows/validations.yml
[npm-image]: https://img.shields.io/npm/v/message-subscriber.svg?style=flat-square
[npm-url]: https://npmjs.org/package/message-subscriber
[fossa-badge-image]: https://app.fossa.com/api/projects/custom%2B33191%2Fgit%40github.com%3ACamiloAvelar%2Fmessage-subscriber.git.svg?type=shield
[fossa-badge-url]: https://app.fossa.com/projects/custom%2B33191%2Fgit%40github.com%3ACamiloAvelar%2Fmessage-subscriber.git?ref=badge_shield
[fossa-large-image]: https://app.fossa.com/api/projects/custom%2B33191%2Fgit%40github.com%3ACamiloAvelar%2Fmessage-subscriber.git.svg?type=large
[fossa-large-url]: https://app.fossa.com/projects/custom%2B33191%2Fgit%40github.com%3ACamiloAvelar%2Fmessage-subscriber.git?ref=badge_large/
[snyk-image]: https://snyk.io/test/npm/message-subscriber/badge.svg
[snyk-url]: https://snyk.io/test/npm/message-subscriber
[typescript-image]: https://badgen.net/npm/types/tslib
[codeclimate-url]: https://codeclimate.com/github/CamiloAvelar/message-subscriber/maintainability
[codeclimate-image]: https://api.codeclimate.com/v1/badges/3ad1972472d6e93e3add/maintainability