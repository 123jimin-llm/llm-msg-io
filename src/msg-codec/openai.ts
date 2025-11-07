import {
    ChatCompletionMessageParam as OpenAIChatInputMessage,
    ChatCompletionMessage as OpenAIChatOutputMessage,
    ChatCompletionContentPart,
    ChatCompletionMessageToolCall,
} from "openai/resources/chat";

import type { Message, MessageContent, ContentPart, WithCreateEncoder, WithCreateDecoder } from "../message/index.js";
import { ToolCall } from "../message/index.js";

function toChatCompletionContent(content: MessageContent|null|undefined): OpenAIChatInputMessage['content'] {
    if(content == null) return null;

    if(typeof content === 'string') {
        return content;
    }

    return content.map((part): ChatCompletionContentPart => {
        switch(part.type) {
            case 'text': return { type: 'text', text: part.text };
            default: throw new Error(`Unknown type: '${(part as {type: string}).type}'`);
        }
    });
}

function fromChatCompletionContent(content: OpenAIChatInputMessage['content']|null|undefined): MessageContent {
    if(!content) return "";

    if(typeof content === 'string') {
        return content;
    }

    return content.map((part): ContentPart => {
        switch(part.type) {
            case 'text': return { type: 'text', text: part.text };
            case 'refusal': return { type: 'text', text: part.refusal };
            case 'file': return { type: 'file', file_id: part.file.file_id, name: part.file.filename, data: part.file.file_data };
            case 'image_url': return { type: 'image', url: part.image_url.url };
            case 'input_audio': return { type: 'audio', data: part.input_audio.data, format: part.input_audio.format };
            default: throw new Error(`Unknown type: '${(part as {type: string}).type}'`);
        }
    });
}

function toChatCompletionToolCall(tool_call: ToolCall): ChatCompletionMessageToolCall {
    return {
        id: tool_call.id ?? "",
        type: 'function',
        function: {
            name: tool_call.name,
            arguments: tool_call.arguments,
        },
    }
}

function fromChatCompletionToolCall(tool_call: ChatCompletionMessageToolCall): ToolCall {
    switch(tool_call.type) {
        case 'function':
            return ToolCall.assert({
                id: tool_call.id,
                name: tool_call.function.name,
                arguments: tool_call.function.arguments,
            });
        case 'custom':
            return ToolCall.assert({
                id: tool_call.id,
                name: tool_call.custom.name,
                arguments: tool_call.custom.input,
            });
    }
}

export const OpenAIChatInputCodec = {
    createEncoder: () => (messages) => {
        return messages.map((message): OpenAIChatInputMessage => {
            return {
                role: message.role as OpenAIChatInputMessage['role'],
                name: message.name,
                content: toChatCompletionContent(message.content),
                tool_calls: message.tool_calls?.map((tool_call) => toChatCompletionToolCall(tool_call)),
            } as OpenAIChatInputMessage;
        });
    },
} satisfies WithCreateEncoder<OpenAIChatInputMessage[]>;

export const OpenAIChatOutputCodec = {
    createDecoder: () => (api_messages) => {
        return api_messages.map((api_message): Message => {
            return {
                role: api_message.role,
                content: fromChatCompletionContent(api_message.content),
                tool_calls: api_message.tool_calls?.map((tool_call) => fromChatCompletionToolCall(tool_call)),
            };
        });
    },
} satisfies WithCreateDecoder<OpenAIChatOutputMessage[]>;

export const OpenAIChatCodec = {
    createEncoder: OpenAIChatInputCodec.createEncoder,
    createDecoder: OpenAIChatOutputCodec.createDecoder,
};

export const OpenAIResponsesInputCodec = {};

export const OpenAIResponsesOutputCodec = {};