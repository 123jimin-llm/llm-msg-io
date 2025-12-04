export * from "./event.js";

import { Message } from "../index.js";
import { LLMStreamEvent, LLMStreamEventType } from "./event.js";

export type LLMStreamEventListener<T extends LLMStreamEventType> = (event: Extract<LLMStreamEvent, {type: T}>) => void;

export interface LLMStream {
    on<T extends LLMStreamEventType>(type: T, listener: LLMStreamEventListener<T>): LLMStream;
    done(): Promise<Message[]>;
}