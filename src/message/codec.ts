
import { type } from 'arktype';

import { Message } from "./schema.js";

export type DeserializedData<MetadataType=unknown> = {metadata?: MetadataType, messages: Message[]};

export type MessageSerializer<SerializedType=string, MetadataType=unknown> = (messages: Message[], metadata?: MetadataType) => SerializedType;
export type MessageDeserializer<SerializedType=string, MetadataType=unknown> = (serialized: SerializedType) => DeserializedData<MetadataType>;
export type RawMessageDeserializer<SerializedType=string> = (serialized: SerializedType) => unknown;

export type CodecSerializer<SerializedType=string, SerializeOptions=object, MetadataType=unknown> = (options?: Partial<SerializeOptions>) => MessageSerializer<SerializedType, MetadataType>;
export type CodecDeserializer<SerializedType=string, DeserializeOptions=object> = (options?: Partial<DeserializeOptions>) => RawMessageDeserializer<SerializedType>;

export interface WithCreateSerializer<SerializedType=string, SerializeOptions=object, MetadataType=unknown> {
    createSerializer: CodecSerializer<SerializedType, SerializeOptions, MetadataType>;
};

export interface WithCreateDeserializer<SerializedType=string, DeserializeOptions=object> {
    createDeserializer: CodecDeserializer<SerializedType, DeserializeOptions>;
};

export type Codec<SerializedType=string, SerializeOptions=object, DeserializeOptions=object, MetadataType=unknown>
    = WithCreateSerializer<SerializedType, SerializeOptions, MetadataType>
    & WithCreateDeserializer<SerializedType, DeserializeOptions>;

export function validateMessage(value: unknown): Message {
    const res = Message(value);
    if(res instanceof type.errors) {
        throw res;
    }

    return res;
}

export function validateMessageArray(value: unknown): Message[] {
    if(!Array.isArray(value)) throw new Error(`Value of type ${typeof value} is not an array!`);
    return value.map((v) => validateMessage(v));
}

/** Objects that can be converted to an array of messages. */
export type MessageArrayLike = Message | Array<Message>;

/**
 * Returns whether the given object is an array of messages.
 * @param obj The object to check.
 * @returns Whether `obj` is an array of messages.
 */
export function isMessageArray(obj: MessageArrayLike): obj is Array<Message> {
    return Array.isArray(obj);
}

/**
 * Converts the given object to an array of messages.
 * @param obj Either a message or an array of messages.
 * @returns Either `obj` or `[obj]`, depending on whether `obj` is an array of messages.
 */
export function asMessageArray(obj: MessageArrayLike): Array<Message> {
    return isMessageArray(obj) ? obj : [obj];
}

export function asDeserializedData(obj: unknown): DeserializedData<unknown> {
    if(obj == null) {
        throw new TypeError("`asDeserializedData` expected an object or an array of messages.");
    }

    if(Array.isArray(obj)) {
        return {
            messages: validateMessageArray(obj),
        };
    }

    if(typeof obj !== 'object') {
        throw new TypeError("`asDeserializedData` expected an object or an array of messages.");
    }

    if('messages' in obj) {
        const messages = validateMessageArray(obj.messages);

        if('metadata' in obj) {
            return {
                metadata: obj.metadata,
                messages,
            };
        } else {
            return {
                messages,
            };
        }
    }

    return {
        messages: [validateMessage(obj)],
    };
}
