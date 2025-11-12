import { concatContentsTo } from "./content.js";
import type { Message, ToolCall } from "./message.js";

export interface MessageDeltaMessage {
    type: 'message';
    msg_index: number;
    message: Partial<Message>;
}

export interface MessageDeltaToolCall {
    type: 'tool_call';
    msg_index: number;
    tool_index: number;
    tool_call: Partial<ToolCall>;
}

export type MessageDelta = MessageDeltaMessage | MessageDeltaToolCall;

function getMessageAt(messages: Message[], index: number): Message {
    while(messages.length <= index) {
        messages.push({
            role: "",
            content: "",
        } satisfies Message);
    }

    return messages[index];
}

function getToolCallAt(message: Message, index: number): ToolCall {
    const tool_calls = message.tool_calls ?? [];
    message.tool_calls = tool_calls;

    while(tool_calls.length <= index) {
        tool_calls.push({
            name: "",
            arguments: "",
        });
    }

    return tool_calls[index];
}

/**
 * Merges a partial message to the given message, modifying the original.
 * @param message 
 * @param delta 
 */
export function mergePartialMessageTo(message: Message, delta: Partial<Message>): Message {
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

export function mergePartialToolCallTo(tool_call: ToolCall, delta: Partial<ToolCall>): ToolCall {
    if(delta.id != null) tool_call.id = delta.id;
    if(delta.name != null) tool_call.name = delta.name;
    
    if(delta.arguments) tool_call.arguments += delta.arguments;

    return tool_call;
}

/**
 * Merges the delta to the given message, modifying the original.
 * @param message 
 * @param delta 
 */
export function mergeMessageDeltaTo(messages: Message[], delta: MessageDelta): Message[] {
    const message = getMessageAt(messages, delta.msg_index);

    switch(delta.type) {
        case 'message':
            mergePartialMessageTo(message, delta.message);
            break;
        case 'tool_call': {
            const tool_call = getToolCallAt(message, delta.tool_index);
            mergePartialToolCallTo(tool_call, delta.tool_call);
            break;
        }
    }

    return messages;
}