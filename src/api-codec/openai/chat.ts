import type {
    ChatCompletionMessageParam as OpenAIChatInputMessage,
    ChatCompletionMessage as OpenAIChatOutputMessage,
    ChatCompletion as OpenAIChatCompletion,
    ChatCompletionContentPart,
    ChatCompletionMessageToolCall,
    ChatCompletionCreateParamsBase,
} from "openai/resources/chat/completions";

import type { Message, MessageContent, ContentPart, WithCreateEncoder, WithCreateDecoder } from "../../message/index.ts";
import { ToolCall } from "../../message/index.ts";

import { OpenAIChatStreamCodec } from "./chat-stream.ts";

function toChatCompletionContent(content: MessageContent|null|undefined): OpenAIChatInputMessage['content'] {
    if(content == null) return null;

    if(typeof content === 'string') {
        return content;
    }

    return content.map((part): ChatCompletionContentPart => {
        switch(part.type) {
            case 'text':
                return { type: 'text', text: part.text };
            case 'image': {
                if(part.url) {
                    return { type: 'image_url', image_url: { url: part.url } };
                }
                if(part.data) {
                    const b64_data = (typeof part.data === 'string') ? part.data : Buffer.from(part.data).toString('base64');
                    const format = part.format ?? 'png';
                    return {
                        type: 'image_url',
                        image_url: { url: `data:image/${format};base64,${b64_data}` },
                    };
                }
                throw new Error("Image content part must have url or data.");
            }
            case 'audio': {
                if(!part.data) throw new Error("Audio content part must have data.");
                const b64_data = (typeof part.data === 'string') ? part.data : Buffer.from(part.data).toString('base64');
                return {
                    type: 'input_audio',
                    input_audio: {
                        data: b64_data,
                        format: part.format as 'wav' | 'mp3' ?? 'wav',
                    },
                };
            }
            case 'file': {
                const file: ChatCompletionContentPart.File.File = {};
                if(part.file_id) file.file_id = part.file_id;
                if(part.name) file.filename = part.name;
                if(part.data) {
                    const b64_data = (typeof part.data === 'string') ? part.data : Buffer.from(part.data).toString('base64');
                    file.file_data = b64_data;
                }
                return { type: 'file', file };
            }
            default:
                throw new Error(`Unknown type: '${(part as {type: string}).type}'`);
        }
    });
}

function toChatCompletionTextContent(content: MessageContent|null|undefined): string|null {
    if(content == null) return null;

    if(typeof content === 'string') return content;

    return content.map((v) => v.type === 'text' ? v.text : "").join("");
}

function fromChatCompletionContent(content: OpenAIChatInputMessage['content']|null|undefined): MessageContent {
    if(!content) return "";

    if(typeof content === 'string') {
        return content;
    }

    if(content.length === 1) {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const part = content[0]!;
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
        const api_messages = messages.map((message): OpenAIChatInputMessage => {
            const role = message.role as OpenAIChatInputMessage['role'];
            if(role === 'tool') {
                return {
                    role: 'tool',
                    tool_call_id: message.call_id ?? message.id ?? "",
                    content: toChatCompletionTextContent(message.content) ?? "",
                } satisfies OpenAIChatInputMessage;
            }
            const msg = {
                role: message.role as OpenAIChatInputMessage['role'],
                content: toChatCompletionContent(message.content),
            } as OpenAIChatInputMessage;

            if(message.name != null) {
                (msg as {name?: string}).name = message.name;
            }

            if(message.tool_calls?.length) {
                (msg as {tool_calls: ChatCompletionMessageToolCall[]}).tool_calls = message.tool_calls.map((tool_call) => toChatCompletionToolCall(tool_call));
            }

            if(message.refusal != null) {
                (msg as {refusal?: string}).refusal = toChatCompletionTextContent(message.refusal) ?? "";
            }

            return msg;
        });

        return {messages: api_messages};
    },
} satisfies WithCreateEncoder<Pick<ChatCompletionCreateParamsBase, 'messages'>>;

export const OpenAIChatOutputMessagesCodec = {
    createDecoder: () => (api_messages) => {
        const messages = api_messages.map((api_message): Message => {
            const msg: Message = {
                role: api_message.role,
                content: fromChatCompletionContent(api_message.content),
            };

            if(api_message.tool_calls?.length) {
                msg.tool_calls = api_message.tool_calls.map((tool_call) => fromChatCompletionToolCall(tool_call));
            }

            if('refusal' in api_message && api_message.refusal != null) {
                msg.refusal = api_message.refusal;
            }

            return msg;
        });

        return {
            messages,
        };
    },
} satisfies WithCreateDecoder<OpenAIChatOutputMessage[]>;

export const OpenAIChatOutputCodec = {
    createDecoder: () => ({id, created, model, choices}) => {
        return {
            metadata: {
                id,
                created_at: new Date(created*1000),
                model,
            },
            messages: OpenAIChatOutputMessagesCodec.createDecoder()(choices.map(({message}) => message)).messages,
        };
    },
} satisfies WithCreateDecoder<OpenAIChatCompletion>;

export const OpenAIChatCodec = {
    createEncoder: OpenAIChatInputCodec.createEncoder,
    createDecoder: OpenAIChatOutputCodec.createDecoder,
    createStreamDecoder: OpenAIChatStreamCodec.createStreamDecoder,
};