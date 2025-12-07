export * from "./request.ts";
export * from "./response.ts";
export * from "./stream.ts";

import type {
    ChatCompletion,
    ChatCompletionCreateParams,
} from "openai/resources/chat/completions";

import { OpenAIChatRequestCodec } from "./request.ts";
import { OpenAIChatResponseCodec } from "./response.ts";
import { OpenAIChatStreamCodec } from "./stream.ts";

import type { APIStepCodec } from "../../../api-codec-lib/step/index.ts";

export const OpenAIChatCodec = {
    ...OpenAIChatRequestCodec,
    ...OpenAIChatResponseCodec,
    ...OpenAIChatStreamCodec,
} satisfies APIStepCodec<ChatCompletionCreateParams, ChatCompletion>;