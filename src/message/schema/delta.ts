import type { Message } from "./message.ts";

/** Incremental tool_call delta (differs from final ToolCall shape). */
export interface ToolCallDelta {
    index: number;
    id?: string;
    name?: string;
    arguments?: string;
};

/** Extends Message delta to include streaming tool_calls. */
export type MessageDelta = Partial<Omit<Message, 'tool_calls'>> & {
    tool_calls?: ToolCallDelta[]|undefined;
};