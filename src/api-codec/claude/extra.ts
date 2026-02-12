import {getMessageExtra, type Message} from "../../message/index.ts";

export const MESSAGE_EXTRA_CLAUDE = 'claude';

export interface ClaudeThinkingBlock {
    type: 'thinking';
    thinking: string;
    signature: string;
}

export interface ClaudeRedactedThinkingBlock {
    type: 'redacted_thinking';
    data: string;
}

export type ClaudeExtra = Partial<{
    thinking_blocks: Array<ClaudeThinkingBlock | ClaudeRedactedThinkingBlock>;
}>;

export function getMessageExtraClaude(message: Pick<Message, 'extra'>, init?: boolean): ClaudeExtra|null;
export function getMessageExtraClaude(message: Pick<Message, 'extra'>, init: true): ClaudeExtra;
export function getMessageExtraClaude(message: Pick<Message, 'extra'>, init = false): ClaudeExtra|null {
    return getMessageExtra<ClaudeExtra>(message, MESSAGE_EXTRA_CLAUDE, init);
}
