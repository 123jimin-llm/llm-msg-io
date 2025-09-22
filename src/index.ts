export * from "./message.js";

import { type Message, type MessageArrayLike, isMessageArray, asMessageArray } from "./message.js";

export interface SerializeOptions {}

export interface DeserializeOptions {}

export function serialize(message: MessageArrayLike, options: Partial<SerializeOptions> = {}): string {
    messages = asMessageArray(message);
}

export function deserialize(source: string, options?: Partial<DeserializeOptions>): Message[] {
    
}