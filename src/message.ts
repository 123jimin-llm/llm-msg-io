// TODO: Make this more compatible to OpenAI, supporting tool calls and etc....
export interface Message {
    role: string;
    content: string;
};

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