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