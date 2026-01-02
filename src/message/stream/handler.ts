import type { Nullable } from "../../util/type.ts";
import { concatContentsTo } from "../schema/content.ts";
import type { Message } from "../schema/message.ts";
import type { StepStreamEvent, StepStreamEventType } from "./event.ts";

export type StepStreamEventHandler<K extends StepStreamEventType> = (event: Extract<StepStreamEvent, {type: K}>) => void;

export type StepStreamEventHandlersRecord = {
    [K in StepStreamEventType]?: Array<StepStreamEventHandler<K>>;
};

export function addStepStreamEventHandler<K extends StepStreamEventType>(
    record: StepStreamEventHandlersRecord,
    type: K,
    handler: StepStreamEventHandler<K>
) {
    const handlers: Array<StepStreamEventHandler<K>> = (record[type] ??= []);
    handlers.push(handler);
}

export function invokeStepStreamEventHandler<K extends StepStreamEventType>(
    record: StepStreamEventHandlersRecord,
    event: Extract<StepStreamEvent, {type: K}>,
) {
    const handlers = record[event.type];
    if(handlers?.length) {
        for(const handler of handlers) handler(event);
    }
}

/**
 * Handles `role`, `content`, and `refusal` updates.
 * (TODO: Handle tool calls.)
 */
export function invokeStepStreamEventHandlerFromDelta(
    record: StepStreamEventHandlersRecord,
    message: Message,
    delta: Nullable<Partial<Message>>,
) {
    if(delta == null) {
        return;
    }

    if(delta.role && delta.role !== message.role) {
        message.role = delta.role;
        invokeStepStreamEventHandler(record, {
            type: "role",
            role: delta.role,
        });
    }

    if(delta.content) {
        message.content = concatContentsTo(message.content, delta.content);
        invokeStepStreamEventHandler(record, {
            type: "content.delta",
            delta: delta.content,
        });
    }

    if(delta.refusal) {
        message.refusal = concatContentsTo(message.refusal ?? "", delta.refusal);
        invokeStepStreamEventHandler(record, {
            type: "refusal.delta",
            delta: "",
        });
    }
}