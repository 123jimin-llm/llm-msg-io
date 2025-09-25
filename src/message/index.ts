import { type } from 'arktype';

export const ContentPart = type({
    type: 'string',
});

export type ContentPart = typeof ContentPart.infer;

export const Message = type({
    role: 'string',
    content: type("string").or(ContentPart.array()),
});

export type Message = typeof Message.infer;

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

export type DeserializedData<MetadataType=unknown> = {metadata?: MetadataType, messages: Message[]};

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

export type MessageSerializer<MetadataType=unknown> = (messages: Message[], metadata?: MetadataType) => string;
export type MessageDeserializer<MetadataType=unknown> = (source: string) => DeserializedData<MetadataType>;
export type RawMessageDeserializer = (source: string) => unknown;