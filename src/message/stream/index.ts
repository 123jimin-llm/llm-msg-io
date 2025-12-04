export * from "./event.ts";
export * from "./handler.ts";

import type { Message } from "../schema/index.ts";
import type { LLMStreamEvent, LLMStreamEventType } from "./event.ts";

export type LLMStreamEventListener<T extends LLMStreamEventType> = (event: Extract<LLMStreamEvent, {type: T}>) => void;

export interface LLMStreamResult {
    messages: Message[];
}

export interface LLMStream {
    on<T extends LLMStreamEventType>(type: T, listener: LLMStreamEventListener<T>): LLMStream;
    done(): Promise<LLMStreamResult>;
}