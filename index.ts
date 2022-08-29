import { SQSAdapter } from './SQSAdapter';
import { MessageSubscriber } from './MessageSubscriber';
import { wait } from './utils';
import { setTimeout } from 'node:timers';

const queueURL = 'https://sqs.sa-east-1.amazonaws.com/217411580783/default-queue';
const parallelism = 5;

const sqsAdapter = new SQSAdapter({
  queueURL,
  sqs: {
    apiVersion: '2012-11-05',
    region: 'sa-east-1',
  }
});

const processorQueue = new MessageSubscriber({
  parallelism,
  maxMessages: 10,
  messageAdapter: sqsAdapter,
});

let processed = 0;

processorQueue.on('message', async (message: any) => {
  console.log('CHEGO')
  await wait(100);
  console.log('UE');
  try {
    await message.delete();
  } catch (err) {
    console.log(err);
  }
  console.log('CABO');
});

processorQueue.on('finished', () => {
  processed++;
  console.log('QUEUE LENGTH', processorQueue.length);
  console.log('PROCESSED MESSAGES', processed);
})

processorQueue.start();

// const timeout = setTimeout(() => {
//     processorQueue.stop();
//     console.log('CABO')
//   }, 10000);

// timeout.unref();



