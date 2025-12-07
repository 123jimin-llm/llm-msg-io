export * from "./request.ts";
export * from "./response.ts";
export * from "./stream.ts";

import type {
    Completions,
    ChatCompletion,
    ChatCompletionCreateParamsBase,
    ChatCompletionCreateParams,
} from "openai/resources/chat/completions";

import { OpenAIChatRequestCodec } from "./request.ts";
import { OpenAIChatResponseCodec } from "./response.ts";
import { OpenAIChatStreamCodec, type OpenAIChatCompletionStream } from "./stream.ts";

import { wrapAPIStep, type APIStep, type APIStepCodecWithStream, type StepRequest, type StepResponse, type StepStream } from "../../../api-codec-lib/step/index.ts";

export const OpenAIChatCodec = {
    ...OpenAIChatRequestCodec,
    ...OpenAIChatResponseCodec,
    ...OpenAIChatStreamCodec,
} satisfies APIStepCodecWithStream<ChatCompletionCreateParamsBase, ChatCompletion, OpenAIChatCompletionStream>;

export function wrapOpenAIChat(
    api: (req: ChatCompletionCreateParams) => ReturnType<typeof Completions.prototype.create>,
): APIStep<StepRequest, StepResponse, StepStream<StepResponse>> {
    return wrapAPIStep(OpenAIChatCodec, api as APIStep<ChatCompletionCreateParamsBase, ChatCompletion, OpenAIChatCompletionStream>);
}