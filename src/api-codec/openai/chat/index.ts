export * from "./request.ts";
export * from "./response.ts";
export * from "./stream.ts";

import type {
    ChatCompletion,
    ChatCompletionCreateParamsBase,
} from "openai/resources/chat/completions";

import { OpenAIChatRequestCodec } from "./request.ts";
import { OpenAIChatResponseCodec } from "./response.ts";
import { OpenAIChatStreamCodec, type OpenAIChatCompletionStream } from "./stream.ts";

import type { APIStepCodecWithStream } from "../../../api-codec-lib/step/index.ts";

export const OpenAIChatCodec = {
    ...OpenAIChatRequestCodec,
    ...OpenAIChatResponseCodec,
    ...OpenAIChatStreamCodec,
} satisfies APIStepCodecWithStream<ChatCompletionCreateParamsBase, ChatCompletion, OpenAIChatCompletionStream>;