import type {
    ChatCompletionMessageParam as OpenAIChatInputMessage,
    ChatCompletionMessage as OpenAIChatOutputMessage,
    ChatCompletion,
    ChatCompletionMessageToolCall,
} from "openai/resources/chat/completions";

import type { Nullable } from "../../../util/type.ts";
import { Message, ToolCall, type ContentPart, type MessageContent } from "../../../message/index.js";
import type { WithCreateDecoder } from "../../../file-codec-lib/decoder.ts";
import type { WithCreateStepDecoder } from "../../../api-codec-lib/step/response.ts";

function fromChatCompletionContent(content: Nullable<OpenAIChatInputMessage['content']>): MessageContent {
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

export const OpenAIChatMessagesCodec = {
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

export const OpenAIChatResponseCodec = {
    createStepDecoder: () => ({id, created, model, choices}) => {
        return {
            metadata: {
                id,
                created_at: new Date(created*1000),
                model,
            },
            messages: OpenAIChatMessagesCodec.createDecoder()(choices.map(({message}) => message)).messages,
        };
    },
} satisfies WithCreateStepDecoder<ChatCompletion>;