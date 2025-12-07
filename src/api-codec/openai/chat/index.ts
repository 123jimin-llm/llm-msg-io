export * from "./request.ts";
export * from "./response.ts";
export * from "./stream.ts";

import { OpenAIChatRequestCodec } from "./request.ts";
import { OpenAIChatResponseCodec } from "./response.ts";
import { OpenAIChatStreamCodec } from "./stream.ts";

export const OpenAIChatCodec = {
    ...OpenAIChatRequestCodec,
    ...OpenAIChatResponseCodec,
    ...OpenAIChatStreamCodec,
};