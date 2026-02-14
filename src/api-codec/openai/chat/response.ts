import type {
    ChatCompletionMessageParam as OpenAIChatInputMessage,
    ChatCompletionMessage as OpenAIChatOutputMessage,
    ChatCompletion,
    ChatCompletionMessageToolCall,
} from "openai/resources/chat/completions";

import {unreachable, type Nullable} from "../../../util/type.ts";
import {Message, ToolCall, type ContentPart, type MessageContent} from "../../../message/index.js";
import type {WithCreateDecoder} from "../../../file-codec-lib/decoder.ts";
import type {StepResult, TokenUsage, WithCreateStepDecoder} from "../../../api-codec-lib/step/response.ts";
import type {CompletionUsage} from "openai/resources/completions";

function fromChatCompletionContent(content: Nullable<OpenAIChatInputMessage['content']>): MessageContent {
    if(!content) return "";

    if(typeof content === 'string') {
        return content;
    }

    if(content.length === 1) {
        const part = content[0]!;
        if(part.type === 'text') return part.text;
    }

    return content.map((part): ContentPart => {
        switch(part.type) {
            case 'text': return {type: 'text', text: part.text};
            case 'refusal': return {type: 'text', text: part.refusal};
            case 'file': {
                const ret: ContentPart = {type: 'file'};

                if(part.file.file_id) ret.file_id = part.file.file_id;
                if(part.file.filename) ret.name = part.file.filename;
                if(part.file.file_data) ret.data = part.file.file_data;

                return ret;
            }
            case 'image_url': return {type: 'image', url: part.image_url.url};
            case 'input_audio': return {type: 'audio', data: part.input_audio.data, format: part.input_audio.format};
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
        default:
            return unreachable(tool_call);
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

            // Note: Reasoning is not available for chat completion API.

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

export function fromOpenAIUsage(usage: Nullable<CompletionUsage>): TokenUsage | null {
    if(!usage) return null;

    const token_usage: TokenUsage = {
        input_tokens: usage.prompt_tokens,
        output_tokens: usage.completion_tokens,
        total_tokens: usage.total_tokens,
    };

    if(usage.prompt_tokens_details?.cached_tokens != null) {
        token_usage.cache_read_tokens = usage.prompt_tokens_details.cached_tokens;
    }

    if(usage.completion_tokens_details?.reasoning_tokens != null) {
        token_usage.reasoning_tokens = usage.completion_tokens_details.reasoning_tokens;
    }

    return token_usage;
}

export const OpenAIChatResponseCodec = {
    createStepDecoder: () => ({id, created, model, choices, usage}) => {
        const res: StepResult & {metadata: object} = {
            metadata: {
                id,
                created_at: new Date(created*1000),
                model,
            },
            messages: OpenAIChatMessagesCodec.createDecoder()(choices.map(({message}) => message)).messages,
        };

        const token_usage = fromOpenAIUsage(usage ?? null);
        if(token_usage) res.token_usage = token_usage;

        return res;
    },
} satisfies WithCreateStepDecoder<ChatCompletion>;
