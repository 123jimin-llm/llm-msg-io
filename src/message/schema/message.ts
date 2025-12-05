import { type } from "arktype";
import { exportType, type PublicType } from "../../util/type.ts";

import { MessageContent } from "./content.ts";

export const ToolCall = exportType(type({
    "id?": "string",
    "call_id?": "string",
    name: "string",
    arguments: "string",

    "extra?": "unknown",
}));
export type ToolCall = typeof ToolCall.infer;

export interface Message {
    /** Unique identifier for a message. */
    id?: string|undefined;

    call_id?: string|undefined;

    /** Role of the sender. */
    role: string;

    /** Name of the sender. */
    name?: string|undefined;

    /** Main content of the message (corresponds to `final` channel). */
    content: MessageContent;

    /** Reasoning data (corresponds to `analysis` channel). */
    reasoning?: MessageContent|undefined;

    /** Refusal message. */
    refusal?: MessageContent|undefined;

    /** A list of tool calls. */
    tool_calls?: ToolCall[]|undefined;

    /** Extra, provider-specific data. */
    extra?: unknown;
}

export const Message: PublicType<Message> = exportType(type({
    "id?": "string|undefined",
    "call_id?": "string|undefined",
    "name?": "string|undefined",
    role: 'string',

    content: MessageContent,
    "reasoning?": MessageContent.or("undefined"),
    "refusal?": MessageContent.or("undefined"),

    "tool_calls?": ToolCall.array().or("undefined"),

    "extra?": "unknown",
}));

export const MessageArray = exportType(Message.array());
export type MessageArray = typeof MessageArray.infer;