import { SQSClient, SQSClientConfig, Message as SQSMessage, ReceiveMessageCommand, DeleteMessageCommand, ChangeMessageVisibilityCommand } from '@aws-sdk/client-sqs';
import { MessageAdapter, Message, MessageAdapterParams } from './MessageAdapter';

export interface SQSAdapterParams extends MessageAdapterParams {
  queueURL: string
  sqs?: SQSClientConfig
}

export class SQSAdapter implements MessageAdapter {
  public maxNumberOfMessages: number;
  private _sqs: SQSClient;
  private _queueURL: string;

  constructor(params: SQSAdapterParams) {
    this.maxNumberOfMessages = params.maxNumberOfMessages;
    this._queueURL = params.queueURL;
    this._sqs = new SQSClient({
      ...(params.sqs ? params.sqs : undefined),
    });
  }

  public async receive(maxMessages?: number): Promise<Message[]> {
    const command = new ReceiveMessageCommand({
      MaxNumberOfMessages: maxMessages || 10,
      QueueUrl: this._queueURL,
      VisibilityTimeout: 30,
      WaitTimeSeconds: 20,
    });

    const response = await this._sqs.send(command);

    if (!response.Messages) {
      return [];
    }

    return response.Messages.map((message: SQSMessage) => {
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
    const command = new DeleteMessageCommand({
      QueueUrl: this._queueURL,
      ReceiptHandle: id,
    });

    await this._sqs.send(command);
  }

  public async delay(id: string, seconds: number): Promise<void> {
    const command = new ChangeMessageVisibilityCommand({
      QueueUrl: this._queueURL,
      ReceiptHandle: id,
      VisibilityTimeout: seconds,
    });

    await this._sqs.send(command);
  }
}