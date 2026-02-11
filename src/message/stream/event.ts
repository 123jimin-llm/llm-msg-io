import type {MessageContent, ToolCall} from "../schema/index.ts";

/** Emitted when content is received. */
export interface ContentDeltaEvent {
    type: "content.delta";
    delta: MessageContent;
};

/** Emitted when refusal text is received. */
export interface RefusalDeltaEvent {
    type: "refusal.delta";
    delta: string;
}

/** Emitted when reasoning/analysis content is received. */
export interface ReasoningDeltaEvent {
    type: "reasoning.delta";
    delta: MessageContent;
}

/** Emitted when a new tool call starts. */
export interface ToolCallStartEvent {
    type: "tool_call.start";
    index: number;
    id?: string;
    name: string;
}

/** Emitted when tool call arguments are received. */
export interface ToolCallDeltaEvent {
    type: "tool_call.delta";
    index: number;
    delta: string;
}

/** Emitted when a tool call is complete. */
export interface ToolCallEndEvent {
    type: "tool_call.end";
    index: number;
    tool_call: ToolCall;
}

/** Emitted when the message role is determined. */
export interface RoleEvent {
    type: "role";
    role: string;
}

/** Emitted when the stream starts. */
export interface StreamStartEvent {
    type: "stream.start";
    metadata?: {
        id?: string;
        model?: string;
    };
}

/** Emitted when the stream ends. */
export interface StreamEndEvent {
    type: "stream.end";
    finish_reason?: string;
}

/** Emitted on stream error. */
export interface StreamErrorEvent {
    type: "stream.error";
    error: Error;
}

export type StepStreamEvent = never
    | ContentDeltaEvent
    | RefusalDeltaEvent
    | ReasoningDeltaEvent
    | ToolCallStartEvent
    | ToolCallDeltaEvent
    | ToolCallEndEvent
    | RoleEvent
    | StreamStartEvent
    | StreamEndEvent
    | StreamErrorEvent
    ;

export type StepStreamEventType = StepStreamEvent['type'];
