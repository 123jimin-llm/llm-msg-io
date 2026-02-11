import type {
    ChatCompletionMessageParam as OpenAIChatInputMessage,
    ChatCompletionContentPart,
    ChatCompletionMessageToolCall,
    ChatCompletionCreateParams,
} from "openai/resources/chat/completions";

import type {Nullable} from "../../../util/type.ts";
import type {StepParams, WithCreateStepEncoder} from "../../../api-codec-lib/index.ts";
import {messageContentToText, type MessageContent, type ToolCall} from "../../../message/index.ts";

function toChatCompletionContent(content: Nullable<MessageContent>): OpenAIChatInputMessage['content'] {
    if(content == null) return null;

    if(typeof content === 'string') {
        return content;
    }

    return content.map((part): ChatCompletionContentPart => {
        switch(part.type) {
            case 'text':
                return {type: 'text', text: part.text};
            case 'image': {
                if(part.url) {
                    return {type: 'image_url', image_url: {url: part.url}};
                }
                if(part.data) {
                    const b64_data = (typeof part.data === 'string') ? part.data : Buffer.from(part.data).toString('base64');
                    const format = part.format ?? 'png';
                    return {
                        type: 'image_url',
                        image_url: {url: `data:image/${format};base64,${b64_data}`},
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
                return {type: 'file', file};
            }
            default:
                throw new Error(`Unknown type: '${(part as {type: string}).type}'`);
        }
    });
}

function toChatCompletionToolCall(tool_call: ToolCall): ChatCompletionMessageToolCall {
    return {
        "id": tool_call.id ?? "",
        "type": 'function',
        "function": {
            name: tool_call.name,
            arguments: tool_call.arguments,
        },
    };
}

export interface OpenAIChatRequestEncodeOptions {
    model: string;
}

export const OpenAIChatRequestCodec = {
    createStepEncoder: ({model = "gpt-5-nano"} = {}) => (req): ChatCompletionCreateParams => {
        const api_messages = req.messages.map((message): OpenAIChatInputMessage => {
            const role = message.role as OpenAIChatInputMessage['role'];
            if(role === 'tool') {
                return {
                    role: 'tool',
                    tool_call_id: message.call_id ?? message.id ?? "",
                    content: messageContentToText(message.content) ?? "",
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
                (msg as {refusal?: string}).refusal = messageContentToText(message.refusal) ?? "";
            }

            return msg;
        });

        return {
            model,
            messages: api_messages,
            stream: false,
        };
    },
} satisfies WithCreateStepEncoder<ChatCompletionCreateParams, StepParams, OpenAIChatRequestEncodeOptions>;
