import { SQS } from 'aws-sdk';
import { MessageAdapter, Message, MessageAdapterParams } from './MessageAdapter';

export interface SQSAdapterParams extends MessageAdapterParams {
    queueURL: string
    sqs?: SQS.Types.ClientConfiguration
}

export class SQSAdapter implements MessageAdapter {
  public maxNumberOfMessages: number;
  private _sqs: SQS;
  private _queueURL: string;

  constructor(params: SQSAdapterParams) {
    this.maxNumberOfMessages = params.maxNumberOfMessages;
    this._queueURL = params.queueURL;
    this._sqs = new SQS({
      apiVersion: '2012-11-05',
      ...(params.sqs ? params.sqs : undefined),
    });
  }

  public async receive(maxMessages?: number): Promise<Message[]> {
    const response = await this._sqs.receiveMessage({
      MaxNumberOfMessages: maxMessages || 10,
      QueueUrl: this._queueURL,
      VisibilityTimeout: 30,
      WaitTimeSeconds: 20,
    }).promise();

    if(!response.Messages) {
      return [];
    }

    return response.Messages.map((message: SQS.Message) => {
      return {
        id: message.MessageId,
        receipt: message.ReceiptHandle,
        payload: message.Body,
        receivedTimestamp: Date.now(),
        delete: async () => {
          return this.delete(message.ReceiptHandle as string);
        },
        delay: async (seconds: number) => {
          return this.delay(message.ReceiptHandle as string, seconds);
        },
      } as Message;
    });
  }

  public async delete(id: string): Promise<void> {
    await this._sqs.deleteMessage({
      QueueUrl: this._queueURL,
      ReceiptHandle: id,
    }).promise();
  }

  public async delay(id: string, seconds: number): Promise<void> {
    await this._sqs.changeMessageVisibility({
      QueueUrl: this._queueURL,
      ReceiptHandle: id,
      VisibilityTimeout: seconds,
    }).promise();
  }
}