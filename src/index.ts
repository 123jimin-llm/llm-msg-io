export * from "./message";

import { type Message, type MessageArrayLike, isMessageArray, asMessageArray } from "./message";

export type Format = 'json' | 'ndjson' | 'toml' | 'simple';

export interface ToStringOptions {
    format: Format;
}

export interface ParseOptions {
    format: Format;
}

export function toString(messages: MessageArrayLike, options?: Partial<ToStringOptions>): string {}

export function parse(str: string, options?: Partial<ParseOptions>): Array<Message> {}