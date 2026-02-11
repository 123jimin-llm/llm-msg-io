import type {StepResult} from "../../api-codec-lib/index.ts";
import type {Nullable} from "../../util/type.ts";
import {concatContentsTo, ToolCall} from "../schema/index.ts";
import type {Message, MessageDelta} from "../schema/index.ts";
import type {StepStreamEvent, ToolCallStartEvent} from "./event.ts";

export type StepStreamState = {
    message: Message;
    tool_calls: Map<number, ToolCall>;
    tool_call_started: Set<number>;
};

export function createStepStreamState(): StepStreamState {
    return {
        message: {role: "", content: ""},
        tool_calls: new Map(),
        tool_call_started: new Set(),
    };
}

export function stepStreamStateToResult(state: StepStreamState): StepResult {
    return {
        messages: [state.message],
    };
}

/**
 * Applies delta to state, and yields events.
 */
export function* applyDeltaToStepStreamState(
    state: StepStreamState,
    delta: Nullable<MessageDelta>,
): Generator<StepStreamEvent> {
    if(delta == null) {
        return;
    }

    const {message, tool_calls, tool_call_started} = state;

    if(delta.role && delta.role !== message.role) {
        message.role = delta.role;
        yield {
            type: "role",
            role: delta.role,
        };
    }

    if(delta.content) {
        message.content = concatContentsTo(message.content, delta.content);
        yield {
            type: "content.delta",
            delta: delta.content,
        };
    }

    if(delta.reasoning) {
        message.reasoning = concatContentsTo(message.reasoning ?? "", delta.reasoning);
        yield {
            type: "reasoning.delta",
            delta: delta.reasoning,
        };
    }

    if(delta.refusal) {
        message.refusal = concatContentsTo(message.refusal ?? "", delta.refusal);
        yield {
            type: "refusal.delta",
            delta: "",
        };
    }

    if(delta.tool_calls) {
        for(const tc of delta.tool_calls) {
            const ind = tc.index;
            let existing = tool_calls.get(ind);

            if(!existing) {
                existing = {id: "", name: "", arguments: ""};
                tool_calls.set(ind, existing);
            }

            if(tc.id) existing.id = tc.id;
            if(tc.name) existing.name += tc.name;
            if(tc.arguments) existing.arguments += tc.arguments;

            if(!tool_call_started.has(ind) && existing.name) {
                tool_call_started.add(ind);

                const event: ToolCallStartEvent = {
                    type: "tool_call.start",
                    index: ind,
                    name: existing.name,
                };

                if(existing.id != null) event.id = existing.id;

                yield event;
            }

            if(tc.arguments) {
                yield {
                    type: "tool_call.delta",
                    index: ind,
                    delta: tc.arguments,
                };
            }
        }
    }
}

export function* finalizeStepStreamState({tool_calls, message}: StepStreamState): Generator<StepStreamEvent> {
    for(const [ind, tc] of tool_calls.entries()) {
        yield {
            type: "tool_call.end",
            index: ind,
            tool_call: tc,
        };
    }

    if(!message.role) message.role = 'assistant';
    if(tool_calls.size > 0) {
        message.tool_calls = [...tool_calls.entries()]
            .sort(([a], [b]) => a - b)
            .map(([, tc]): ToolCall => tc);
    }
}
