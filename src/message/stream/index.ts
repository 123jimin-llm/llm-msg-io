export * from "./event.ts";

import { Message } from "../index.ts";
import type { LLMStreamEvent, LLMStreamEventType } from "./event.ts";

export type LLMStreamEventListener<T extends LLMStreamEventType> = (event: Extract<LLMStreamEvent, {type: T}>) => void;

export interface LLMStream {
    on<T extends LLMStreamEventType>(type: T, listener: LLMStreamEventListener<T>): LLMStream;
    done(): Promise<Message[]>;
}