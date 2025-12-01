import {
    ChatCompletionMessageParam as OpenAIChatInputMessage,
    ChatCompletionMessage as OpenAIChatOutputMessage,
    ChatCompletionContentPart,
    ChatCompletionMessageToolCall,
} from "openai/resources/chat";

import { Message, MessageContent, ContentPart, WithCreateEncoder, WithCreateDecoder } from "../message/index.js";
import { ToolCall } from "../message/index.js";
import { ResponseInput, ResponseInputItem, ResponseInputText, ResponseInputContent, ResponseInputMessageContentList, ResponseOutputMessage, Response } from "openai/resources/responses/responses.js";

function toChatCompletionContent(content: MessageContent|null|undefined): OpenAIChatInputMessage['content'] {
    if(content == null) return null;

    if(typeof content === 'string') {
        return content;
    }

    return content.map((part): ChatCompletionContentPart => {
        switch(part.type) {
            case 'text': return { type: 'text', text: part.text };
            // TODO
            default: throw new Error(`Unknown type: '${(part as {type: string}).type}'`);
        }
    });
}

function toResponseInputContent(content: MessageContent|null|undefined): ResponseInputMessageContentList {
    if(!content) return [];

    if(typeof content === 'string') {
        return [{
            type: 'input_text',
            text: content,
        } satisfies ResponseInputText];
    }

    return content.map((part): ResponseInputContent => {
        switch(part.type) {
            case 'text': return { type: 'input_text', text: part.text };
            // TODO
            default: throw new Error(`Unknown type: '${(part as {type: string}).type}'`);
        }
    });
}

function fromChatCompletionContent(content: OpenAIChatInputMessage['content']|null|undefined): MessageContent {
    if(!content) return "";

    if(typeof content === 'string') {
        return content;
    }

    if(content.length === 1) {
        const [part] = content;
        if(part.type === 'text') return part.text;
    }

    return content.map((part): ContentPart => {
        switch(part.type) {
            case 'text': return { type: 'text', text: part.text };
            case 'refusal': return { type: 'text', text: part.refusal };
            case 'file': {
                const ret: ContentPart = { type: 'file' };
                
                if(part.file.file_id) ret.file_id = part.file.file_id;
                if(part.file.filename) ret.name = part.file.filename;
                if(part.file.file_data) ret.data = part.file.file_data;
                
                return ret;
            }
            case 'image_url': return { type: 'image', url: part.image_url.url };
            case 'input_audio': return { type: 'audio', data: part.input_audio.data, format: part.input_audio.format };
            // TODO
            default: throw new Error(`Unknown type: '${(part as {type: string}).type}'`);
        }
    });
}

function fromResponseOutputContent(content: ResponseOutputMessage['content']|null|undefined): MessageContent {
    if(!content) return "";

    if(content.length === 1) {
        const [part] = content;
        if(part.type === 'output_text' && !(part.annotations?.length)) return part.text;
    }

    return content.map((part): ContentPart => {
        switch(part.type) {
            case 'output_text': return { type: 'text', text: part.text };
            case 'refusal': return { type: 'text', text: part.refusal };
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
            const msg = {
                role: message.role as OpenAIChatInputMessage['role'],
                name: message.name,
                content: toChatCompletionContent(message.content),
            } as OpenAIChatInputMessage;

            if(message.tool_calls?.length) {
                (msg as {tool_calls: ChatCompletionMessageToolCall[]}).tool_calls = message.tool_calls.map((tool_call) => toChatCompletionToolCall(tool_call));
            }

            return msg;
        });
    },
} satisfies WithCreateEncoder<OpenAIChatInputMessage[]>;

export const OpenAIChatOutputCodec = {
    createDecoder: () => (api_messages) => {
        return api_messages.map((api_message): Message => {
            const msg: Message = {
                role: api_message.role,
                content: fromChatCompletionContent(api_message.content),
            };

            if(api_message.tool_calls?.length) {
                msg.tool_calls = api_message.tool_calls.map((tool_call) => fromChatCompletionToolCall(tool_call));
            }

            return msg;
        });
    },
} satisfies WithCreateDecoder<OpenAIChatOutputMessage[]>;

export const OpenAIChatCodec = {
    createEncoder: OpenAIChatInputCodec.createEncoder,
    createDecoder: OpenAIChatOutputCodec.createDecoder,
};

export const OpenAIResponsesInputCodec = {
    createEncoder: () => (messages) => {
        return messages.map((message): ResponseInputItem => {
            const msg = {
                type: 'message',
                role: message.role as ResponseInputItem.Message['role'],
                content: toResponseInputContent(message.content),
            } as ResponseInputItem.Message;

            return msg;
        });
    },
} satisfies WithCreateEncoder<ResponseInput>;

export const OpenAIResponsesOutputCodec = {
    createDecoder: () => (response) => {
        return response.output.map((_api_message): Message => {
            // TODO
            throw new Error("Not yet implemented!");
        });
    },
} satisfies WithCreateDecoder<Response>;

export const OpenAIResponsesCodec = {
    createEncoder: OpenAIResponsesInputCodec.createEncoder,
    createDecoder: OpenAIResponsesOutputCodec.createDecoder,
};