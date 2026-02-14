import type {
    Message as ClaudeMessage,
    Usage as ClaudeUsage,
} from "@anthropic-ai/sdk/resources/messages";

import type {StepResult, TokenUsage, WithCreateStepDecoder} from "../../api-codec-lib/index.ts";
import type {Message, ToolCall} from "../../message/index.ts";
import {concatContentsTo, type MessageContent} from "../../message/index.ts";
import {getMessageExtraClaude, type ClaudeRedactedThinkingBlock, type ClaudeThinkingBlock} from "./extra.ts";

import type {Nullable} from "../../util/type.ts";

export function fromClaudeUsage(usage: ClaudeUsage): TokenUsage {
    const token_usage: TokenUsage = {
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
    };

    if(usage.cache_read_input_tokens != null) {
        token_usage.cache_read_tokens = usage.cache_read_input_tokens;
    }

    return token_usage;
}

export function fromClaudeStopReason(stop_reason: Nullable<string>): string {
    switch(stop_reason) {
        case 'end_turn': return 'stop';
        case 'max_tokens': return 'length';
        case 'stop_sequence': return 'stop';
        case 'tool_use': return 'tool_calls';
        case 'pause_turn': return 'stop';
        case 'refusal': return 'content_filter';
        default: return 'stop';
    }
}

export function fromClaudeMessage(api_message: ClaudeMessage): Message {
    const thinking_blocks: (ClaudeThinkingBlock | ClaudeRedactedThinkingBlock)[] = [];
    const reasoning_arr: string[] = [];
    const tool_calls: ToolCall[] = [];
    let content: MessageContent = "";

    for(const block of api_message.content) {
        switch(block.type) {
            case 'text':
                content = concatContentsTo(content, block.text);
                break;
            case 'thinking':
                thinking_blocks.push({type: 'thinking', thinking: block.thinking, signature: block.signature});
                reasoning_arr.push(block.thinking);
                break;
            case 'redacted_thinking':
                thinking_blocks.push({type: 'redacted_thinking', data: block.data});
                break;
            case 'tool_use':
                tool_calls.push({
                    id: block.id,
                    name: block.name,
                    arguments: JSON.stringify(block.input),
                });
                break;
            default:
                // server_tool_use, web_search_tool_result, etc. — skip for now.
                break;
        }
    }

    const message: Message = {
        role: 'assistant',
        content,
    };

    if(reasoning_arr.length) {
        message.reasoning = reasoning_arr.join('\n');
    }

    if(tool_calls.length) {
        message.tool_calls = tool_calls;
    }

    if(thinking_blocks.length) {
        const extra = getMessageExtraClaude(message, true);
        extra.thinking_blocks = thinking_blocks;
    }

    return message;
}

export const ClaudeMessagesResponseCodec = {
    createStepDecoder: () => (api_res) => {
        const res: StepResult = {
            messages: [fromClaudeMessage(api_res)],
            token_usage: fromClaudeUsage(api_res.usage),
        };
        return res;
    },
} satisfies WithCreateStepDecoder<ClaudeMessage>;
