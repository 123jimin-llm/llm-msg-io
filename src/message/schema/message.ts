import { type } from "arktype";
import { exportType, type PublicType } from "../../util/type.js";

import { MessageContent } from "./content.js";

export const ToolCall = exportType(type({
    "id?": "string",    
    name: "string",
    arguments: "string",
}));
export type ToolCall = typeof ToolCall.infer;

export interface Message {
    id?: string;
    name?: string;
    role: string;

    content: MessageContent;
    reasoning?: MessageContent;

    tool_calls?: ToolCall[];
}

export const Message: PublicType<Message> = exportType(type({
    "id?": "string|undefined",
    "name?": "string|undefined",
    role: 'string',

    content: MessageContent,
    "reasoning?": MessageContent.or("undefined"),

    "tool_calls?": ToolCall.array().or("undefined"),
}));

export const MessageArray = exportType(Message.array());
export type MessageArray = typeof MessageArray.infer;

/** Objects that can be converted to an array of messages. */
export type MessageArrayLike = Message|MessageArray;

/**
 * Returns whether the given object is an array of messages.
 * @param obj The object to check.
 * @returns Whether `obj` is an array of messages.
 */
export function isMessageArray(obj: MessageArrayLike): obj is MessageArray {
    return Array.isArray(obj);
}

/**
 * Converts the given object to an array of messages.
 * @param obj Either a message or an array of messages.
 * @returns Either `obj` or `[obj]`, depending on whether `obj` is an array of messages.
 */
export function asMessageArray(obj: MessageArrayLike): MessageArray {
    return isMessageArray(obj) ? obj : [obj];
}
