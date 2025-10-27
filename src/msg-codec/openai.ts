import { ChatCompletionMessageParam as OpenAIChatInputMessage, ChatCompletionContentPart } from "openai/resources/chat";

import type { Codec, Message, ContentPart } from "../message/index.js";

function toChatCompletionContent(content: Message['content']|null|undefined): OpenAIChatInputMessage['content'] {
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

function fromChatCompletionContent(content: OpenAIChatInputMessage['content']|null|undefined): Message['content'] {
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

export const OpenAIChatInputCodec = {
    createEncoder: () => (messages) => {
        return messages.map((message): OpenAIChatInputMessage => {
            return {
                role: message.role as OpenAIChatInputMessage['role'],
                content: toChatCompletionContent(message.content),
            } as OpenAIChatInputMessage;
        });
    },
    createDecoder: () => (api_messages) => {
        return api_messages.map((api_message): Message => {
            return {
                role: api_message.role,
                content: fromChatCompletionContent(api_message.content),
            };
        });
    },
} satisfies Codec<OpenAIChatInputMessage[]>;

export const OpenAIChatOutputCodec = {};

export const OpenAIResponsesInputCodec = {};

export const OpenAIResponsesOutputCodec = {};