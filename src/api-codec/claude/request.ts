import type {
    MessageParam as ClaudeMessageParam,
    ContentBlockParam as ClaudeContentBlockParam,
    TextBlockParam,
    ImageBlockParam,
    ToolResultBlockParam,
    ToolUseBlockParam,
    ThinkingBlockParam,
    RedactedThinkingBlockParam,
    MessageCreateParamsNonStreaming,
    Tool as ClaudeTool,
} from "@anthropic-ai/sdk/resources/messages";

import type {Nullable} from "../../util/type.ts";
import type {FunctionDefinition, StepParams, WithCreateStepEncoder} from "../../api-codec-lib/index.ts";
import {messageContentToText, type Message, type MessageContent, type ToolCall} from "../../message/index.ts";
import {getMessageExtraClaude, type ClaudeExtra} from "./extra.ts";

export function isClaudeSystemRole(role: string): boolean {
    switch(role) {
        case 'system': return true;
        case 'developer': return true;
    }
    return false;
}

export function toClaudeTool(func_def: FunctionDefinition): ClaudeTool {
    return {
        name: func_def.name,
        description: func_def.description,
        input_schema: func_def.parameters as ClaudeTool.InputSchema,
    };
}

function toClaudeContentBlocks(content: Nullable<MessageContent>): ClaudeContentBlockParam[] {
    if(content == null) return [];

    if(typeof content === 'string') {
        return content ? [{type: 'text', text: content}] : [];
    }

    return content.map((part): ClaudeContentBlockParam => {
        switch(part.type) {
            case 'text':
                return {type: 'text', text: part.text} satisfies TextBlockParam;
            case 'image': {
                if(part.url?.startsWith('data:')) {
                    const [header, data] = part.url.split(';', 2);
                    if(data?.startsWith('base64,')) {
                        return {
                            type: 'image',
                            source: {
                                type: 'base64',
                                media_type: header!.slice('data:'.length) as ImageBlockParam['source'] extends {media_type: infer M} ? M : never,
                                data: data.slice('base64,'.length),
                            },
                        } satisfies ImageBlockParam;
                    }
                }
                if(part.url) {
                    return {
                        type: 'image',
                        source: {type: 'url', url: part.url},
                    } satisfies ImageBlockParam;
                }
                if(part.data) {
                    const b64_data = (typeof part.data === 'string') ? part.data : Buffer.from(part.data).toString('base64');
                    const format = part.format ?? 'png';
                    return {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: `image/${format}` as ImageBlockParam['source'] extends {media_type: infer M} ? M : never,
                            data: b64_data,
                        },
                    } satisfies ImageBlockParam;
                }
                throw new Error("Image content part must have url or data.");
            }
            case 'audio':
                throw new Error("Claude does not support audio content parts.");
            case 'file':
                throw new Error("Claude file content parts are not yet supported.");
            default:
                throw new Error(`Unknown type: '${(part as {type: string}).type}'`);
        }
    });
}

function toClaudeThinkingBlocks(claude_extra: Nullable<ClaudeExtra>): Array<ThinkingBlockParam | RedactedThinkingBlockParam> {
    const blocks: Array<ThinkingBlockParam | RedactedThinkingBlockParam> = [];

    if(claude_extra?.thinking_blocks) {
        for(const block of claude_extra.thinking_blocks) {
            if(block.type === 'thinking') {
                blocks.push({type: 'thinking', thinking: block.thinking, signature: block.signature});
            } else if(block.type === 'redacted_thinking') {
                blocks.push({type: 'redacted_thinking', data: block.data});
            }
        }
    }

    return blocks;
}

function toClaudeToolUseBlocks(tool_calls: ToolCall[]): ToolUseBlockParam[] {
    return tool_calls.map((tc): ToolUseBlockParam => {
        let input: unknown;
        try {
            input = JSON.parse(tc.arguments);
        } catch{
            input = {};
        }

        return {
            type: 'tool_use',
            id: tc.id ?? '',
            name: tc.name,
            input,
        };
    });
}

function toClaudeMessages(messages: Message[]): {system: string[]; api_messages: ClaudeMessageParam[]} {
    const system: string[] = [];
    const api_messages: ClaudeMessageParam[] = [];

    for(const message of messages) {
        if(isClaudeSystemRole(message.role)) {
            const text = messageContentToText(message.content);
            if(text) system.push(text);
            continue;
        }

        if(message.role === 'tool') {
            const tool_result: ToolResultBlockParam = {
                type: 'tool_result',
                tool_use_id: message.call_id ?? message.id ?? '',
                content: messageContentToText(message.content) ?? '',
            };

            // Merge into previous user message if possible.
            const last = api_messages[api_messages.length - 1];
            if(last?.role === 'user' && Array.isArray(last.content)) {
                last.content.push(tool_result);
            } else {
                api_messages.push({role: 'user', content: [tool_result]});
            }
            continue;
        }

        const role = message.role === 'assistant' ? 'assistant' as const : 'user' as const;

        const blocks: ClaudeContentBlockParam[] = [];

        if(role === 'assistant') {
            const claude_extra = getMessageExtraClaude(message);
            blocks.push(...toClaudeThinkingBlocks(claude_extra));
        }

        blocks.push(...toClaudeContentBlocks(message.content));

        if(message.tool_calls?.length) {
            blocks.push(...toClaudeToolUseBlocks(message.tool_calls));
        }

        // Merge consecutive same-role messages.
        const last = api_messages[api_messages.length - 1];
        if(last?.role === role) {
            if(typeof last.content === 'string') {
                last.content = [{type: 'text', text: last.content}, ...blocks];
            } else {
                last.content.push(...blocks);
            }
        } else {
            api_messages.push({
                role,
                content: blocks.length === 1 && blocks[0]!.type === 'text' ? (blocks[0] as TextBlockParam).text : blocks,
            });
        }
    }

    return {system, api_messages};
}

export interface ClaudeMessagesRequestEncodeOptions {
    model: string;
    max_tokens: number;
}

export const ClaudeMessagesRequestCodec = {
    createStepEncoder: ({model = 'claude-sonnet-4-5-20250929', max_tokens = 8192} = {}) => (req): MessageCreateParamsNonStreaming => {
        const {system, api_messages} = toClaudeMessages(req.messages);

        const api_req: MessageCreateParamsNonStreaming = {
            model,
            max_tokens,
            messages: api_messages,
            stream: false,
        };

        if(system.length > 0) {
            api_req.system = system.join('\n\n');
        }

        if(req.functions?.length) {
            api_req.tools = req.functions.map((fn) => toClaudeTool(fn));
        }

        if(req.response_schema) {
            api_req.output_config = {
                format: {
                    type: 'json_schema',
                    schema: req.response_schema.schema as Record<string, unknown>,
                },
            };
        }

        return api_req;
    },
} satisfies WithCreateStepEncoder<MessageCreateParamsNonStreaming, StepParams, ClaudeMessagesRequestEncodeOptions>;
