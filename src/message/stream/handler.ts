import type { LLMStreamEvent, LLMStreamEventType } from "./event.ts";

export type LLMStreamEventHandler<K extends LLMStreamEventType> = (event: Extract<LLMStreamEvent, {type: K}>) => void;

export type LLMStreamEventHandlersRecord = {
    [K in LLMStreamEventType]?: Array<LLMStreamEventHandler<K>>;
};

export function addLLMStreamEventHandler<K extends LLMStreamEventType>(
    record: LLMStreamEventHandlersRecord,
    type: K,
    handler: LLMStreamEventHandler<K>
) {
    const handlers: Array<LLMStreamEventHandler<K>> = (record[type] ??= []);
    handlers.push(handler);
}

export function invokeLLMStreamEventHandlers<K extends LLMStreamEventType>(
    record: LLMStreamEventHandlersRecord,
    event: Extract<LLMStreamEvent, {type: K}>,
) {
    const handlers = record[event.type];
    if(handlers?.length) {
        for(const handler of handlers) handler(event);
    }
}