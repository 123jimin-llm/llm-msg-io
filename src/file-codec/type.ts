import { type Message } from "@/message.js";

export interface FileCodec<SerializeOptions=object, DeserializeOptions=object> {
    serialize(messages: Message[], options?: Partial<SerializeOptions>): string;
    deserialize(source: string, options?: Partial<DeserializeOptions>): Message[];
}