// TODO: Make this more compatible to OpenAI, supporting tool calls and etc....
export interface Message {
    role: string;
    content: string;
};

/**
 * Returns whether the given object is an array of messages.
 * @param obj The object to check.
 * @returns Whether `obj` is an array of messages.
 */
export function isMessageArray(obj: Message|Array<Message>): obj is Array<Message> {
    return Array.isArray(obj);
}
