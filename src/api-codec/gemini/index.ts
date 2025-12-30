export * from "./request.ts";
export * from "./response.ts";

import type { GenerateContentParameters, GenerateContentResponse } from "@google/genai";

import type { APIStepCodecWithStream } from "../../api-codec-lib/index.ts";
import { GeminiGenerateContentRequestCodec } from "./request.ts";
import { GeminiGenerateContentResponseCodec } from "./response.ts";
import { GeminiGenerateContentStreamCodec } from "./stream.ts";

export const GeminiGenerateContentCodec = {
    ...GeminiGenerateContentRequestCodec,
    ...GeminiGenerateContentResponseCodec,
    ...GeminiGenerateContentStreamCodec,
} satisfies APIStepCodecWithStream<GenerateContentParameters, GenerateContentResponse, AsyncGenerator<GenerateContentResponse>>;