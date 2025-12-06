import type { StepStreamEvent, StepStreamEventType } from "./event.ts";

export type LLMStreamEventHandler<K extends StepStreamEventType> = (event: Extract<StepStreamEvent, {type: K}>) => void;

export type LLMStreamEventHandlersRecord = {
    [K in StepStreamEventType]?: Array<LLMStreamEventHandler<K>>;
};

export function addLLMStreamEventHandler<K extends StepStreamEventType>(
    record: LLMStreamEventHandlersRecord,
    type: K,
    handler: LLMStreamEventHandler<K>
) {
    const handlers: Array<LLMStreamEventHandler<K>> = (record[type] ??= []);
    handlers.push(handler);
}

export function invokeLLMStreamEventHandlers<K extends StepStreamEventType>(
    record: LLMStreamEventHandlersRecord,
    event: Extract<StepStreamEvent, {type: K}>,
) {
    const handlers = record[event.type];
    if(handlers?.length) {
        for(const handler of handlers) handler(event);
    }
}

export type StepStreamEventListener<T extends StepStreamEventType> = (event: Extract<StepStreamEvent, {type: T}>) => void;