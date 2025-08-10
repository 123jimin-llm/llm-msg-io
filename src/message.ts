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