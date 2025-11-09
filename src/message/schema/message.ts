import { type } from "arktype";
import { exportType, type PublicType } from "../../util/type.js";

import { concatContentsTo, MessageContent } from "./content.js";

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

/**
 * Merges the delta to the given message, modifying the original.
 * @param message 
 * @param delta 
 */
export function mergeMessageDeltaTo(message: Message, delta: Partial<Message>): Message {
    if(delta.id != null) message.id = delta.id;
    if(delta.name != null) message.name = delta.name;
    if(delta.role != null) message.role = delta.role;

    if(delta.content != null) {
        message.content = concatContentsTo(message.content, delta.content);
    }

    if(delta.reasoning != null) {
        message.reasoning = concatContentsTo(message.reasoning ?? "", delta.reasoning);
    }

    if(delta.tool_calls != null) {
        if(message.tool_calls == null) message.tool_calls = [];
        message.tool_calls.push(...delta.tool_calls);
    }

    return message;
}