import {
    ResponseInputItem,
    ResponseOutputMessage,
    ResponseOutputItem,
} from "openai/resources/responses/responses.mjs";

import { Message, MessageContent, ContentPart, WithCreateEncoder, WithCreateDecoder, concatContentsTo } from "../../message/index.js";

function toResponseInputContent(role: string, content: MessageContent|null|undefined): Array<Extract<ResponseInputItem, {content: unknown}>['content'][number]> {
    if(!content) return [];

    const makeTextContent = (content: string): {type: 'input_text', text: string}|{type: 'output_text', text: string, annotations: never[]} => {
        if(role !== 'assistant') return {type: 'input_text', text: content};
        
        return {
            type: 'output_text',
            text: content,
            annotations: [],
        };
    };

    if(typeof content === 'string') {
        return [makeTextContent(content)];
    }

    return content.map((part) => {
        switch(part.type) {
            case 'text': return makeTextContent(part.text);
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

export const OpenAIResponsesInputCodec = {
    createEncoder: () => (messages) => {
        const input_items: ResponseInputItem[] = [];

        for(const message of messages) {
            input_items.push({
                type: 'message',
                role: message.role as Extract<ResponseInputItem, {role: string}>['role'],
                content: toResponseInputContent(message.role, message.content),
            } as ResponseInputItem);
        }

        return input_items;
    },
} satisfies WithCreateEncoder<ResponseInputItem[]>;

export const OpenAIResponsesOutputCodec = {
    createDecoder: () => (outputs) => {
        const messages: Message[] = [];

        let message: Message|null = null;

        const getMessage = (): Message => {
            if(message == null) {
                message = {
                    role: "", content: "",
                };
                messages.push(message);
            }

            return message;
        };

        for(const output_item of outputs) {
            switch(output_item.type) {
                case 'reasoning': {
                    const msg = getMessage();
                    const reasoning_content: string = output_item.content?.map((part) => part.text).join("") ?? output_item.summary?.map((part) => part.text).join("\n\n") ?? "";
                    msg.reasoning = concatContentsTo(msg.reasoning ?? "", reasoning_content);
                    break;
                }
                case 'message': {
                    const msg = getMessage();
                    msg.id = output_item.id;
                    msg.role = output_item.role;
                    msg.content = concatContentsTo(msg.content, fromResponseOutputContent(output_item.content));
                    break;
                }
                default: throw new Error("Not yet implemented!")
            }
        }

        return messages;
    },
} satisfies WithCreateDecoder<ResponseOutputItem[]>;

export const OpenAIResponsesCodec = {
    createEncoder: OpenAIResponsesInputCodec.createEncoder,
    createDecoder: OpenAIResponsesOutputCodec.createDecoder,
};