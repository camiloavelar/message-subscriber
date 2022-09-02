export interface Message {
    id: string
    receipt?: string
    payload: any
    attributes?: any
    receivedTimestamp: number
    delete: () => Promise<void>
    delay: (seconds: number) => Promise<void>
}

export type MessageAdapterParams = {
    maxNumberOfMessages: number
};

export abstract class MessageAdapter {
    public abstract maxNumberOfMessages: number;
    public abstract receive(maxMessages?: number): Promise<Message[]>;
    public abstract delete(id: string): Promise<void>;
    public abstract delay(id: string, seconds: number): Promise<void>;
}