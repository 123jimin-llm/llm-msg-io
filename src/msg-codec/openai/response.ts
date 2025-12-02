import {
    ResponseInputItem,
    ResponseOutputMessage,
    ResponseFunctionToolCall,
    ResponseInputContent,
    Response,
} from "openai/resources/responses/responses.mjs";

import { Message, MessageContent, ContentPart, WithCreateEncoder, WithCreateDecoder, concatContentsTo, ToolCall } from "../../message/index.js";

type InputContentItem = Extract<ResponseInputItem, {content: unknown}>['content'][number];
type OutputContentItem = ResponseOutputMessage['content'][number];

function makeTextInputContent(role: string, content: string): InputContentItem {
    if(role === 'assistant') return {type: 'output_text', text: content, annotations: []};
    else return {type: 'input_text', text: content};
}

function toResponseInputContent(role: string, content: MessageContent|null|undefined): InputContentItem[] {
    if(!content) return [];

    if(typeof content === 'string') {
        return [makeTextInputContent(role, content)];
    }

    return content.map((part): InputContentItem => {
        switch(part.type) {
            case 'text':
                return makeTextInputContent(role, part.text);
            case 'image': {
                if(part.url) return {type: 'input_image', image_url: part.url, detail: 'auto'};
                if(part.data) {
                    const b64_data = (typeof part.data === 'string') ? part.data : Buffer.from(part.data).toString('base64');
                    const format = part.format ?? 'png';
                    return {
                        type: 'input_image',
                        image_url: `data:image/${format};base64,${b64_data}`,
                        detail: 'auto',
                    };
                }
                throw new Error("Image content part must have url or data.");
            }
            default:
                throw new Error(`Unknown type: '${(part as {type: string}).type}'`);
        }
    });
}

function fromResponseOutputContent(contents: OutputContentItem[]|null|undefined): MessageContent {
    if(!contents?.length) return "";

    if(contents.length === 1) {
        const [part] = contents;
        if(part.type === 'output_text' && !(part.annotations?.length)) return part.text;
    }

    return contents.map((part): ContentPart => {
        switch(part.type) {
            case 'output_text': return { type: 'text', text: part.text };
            case 'refusal': return { type: 'text', text: part.refusal };
        }
    });
}

function toResponseInputToolCalls(tool_calls: ToolCall[]|null|undefined): ResponseInputItem[] {
    if(!tool_calls?.length) return [];

    return tool_calls.map((tool_call): ResponseInputItem => {
        const func_call: ResponseFunctionToolCall = {
            type: 'function_call',
            name: tool_call.name,
            call_id: tool_call.call_id ?? "",
            arguments: tool_call.arguments,
        };

        if(tool_call.id != null) func_call.id = tool_call.id;

        return func_call;
    });
}

function fromResponseToolCall(api_tool_call: ResponseFunctionToolCall): ToolCall {
    const tool_call: ToolCall = {
        call_id: api_tool_call.call_id,
        name: api_tool_call.name,
        arguments: api_tool_call.arguments,
    };

    if(api_tool_call.id) tool_call.id = api_tool_call.id;

    return tool_call;
}

export const OpenAIResponsesInputCodec = {
    createEncoder: () => (messages) => {
        const input_items: ResponseInputItem[] = [];

        for(const message of messages) {
            const role = message.role;

            if(role === 'tool') {
                const content = (typeof message.content === 'string')
                    ? message.content
                    : message.content.map((p) => p.type === 'text' ? p.text : "").join("");

                input_items.push({
                    type: 'function_call_output',
                    call_id: message.call_id ?? message.id ?? "",
                    output: content,
                });

                continue;
            }

            const content = toResponseInputContent(role, message.content);

            if(content.length > 0 || !message.tool_calls?.length) {
                const input_role = role as Extract<ResponseInputItem, {role: string}>['role'];
                if(role === 'assistant') {
                    input_items.push({
                        type: 'message',
                        id: message.id ?? "",
                        role: 'assistant',
                        content: content as OutputContentItem[],
                        status: 'completed',
                    } satisfies ResponseOutputMessage);
                } else {
                    input_items.push({
                        type: 'message',
                        role: input_role as 'user'|'system'|'developer',
                        content: content as ResponseInputContent[],
                    });
                }
            }
            
            if(role === 'assistant' && message.tool_calls?.length) {
                input_items.push(...toResponseInputToolCalls(message.tool_calls));
            }
        }

        return input_items;
    },
} satisfies WithCreateEncoder<ResponseInputItem[]>;

export const OpenAIResponsesOutputCodec = {
    createDecoder: () => (response) => {
        const messages: Message[] = [];

        let curr_msg: Message|null = null;
        const flushMessage = () => {
            if(curr_msg) {
                messages.push(curr_msg);
                curr_msg = null;
            }
        };

        const getOrCreateMessage = (): Message => {
            if(!curr_msg) {
                curr_msg = {
                    role: 'assistant',
                    content: "",
                };
            }

            return curr_msg;
        };

        for(const item of response.output) {
            switch(item.type) {
                case 'message': {
                    const msg = getOrCreateMessage();
                    msg.id = item.id;
                    msg.role = item.role;

                    msg.content = fromResponseOutputContent(item.content);

                    break;
                }
                case 'function_call': {
                    const msg = getOrCreateMessage();

                    if(!msg.tool_calls) msg.tool_calls = [];
                    msg.tool_calls.push(fromResponseToolCall(item));

                    break;
                }
                case 'reasoning': {
                    const msg = getOrCreateMessage();
                    
                    if(item.summary?.length) {
                        msg.reasoning = concatContentsTo(msg.reasoning ?? "", ...item.summary.map(({text}) => text));
                    }
                    break;
                }
                default: {
                    throw new Error(`Unknown response item type: '${item.type}'!`);
                }
            }
        }

        flushMessage();

        if(messages.length === 1) {
            messages[0].id = response.id;
        }

        return { messages };
    },
} satisfies WithCreateDecoder<Response>;

export const OpenAIResponsesCodec = {
    createEncoder: OpenAIResponsesInputCodec.createEncoder,
    createDecoder: OpenAIResponsesOutputCodec.createDecoder,
};