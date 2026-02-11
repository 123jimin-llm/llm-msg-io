export * from "./extra.ts";
export * from "./request.ts";
export * from "./response.ts";
export * from "./stream.ts";

import type {GenerateContentParameters, GenerateContentResponse, HarmBlockThreshold, HarmCategory, SafetySetting} from "@google/genai";

import type {APIStepCodecWithStream} from "../../api-codec-lib/index.ts";
import {GeminiGenerateContentRequestCodec} from "./request.ts";
import {GeminiGenerateContentResponseCodec} from "./response.ts";
import {GeminiGenerateContentStreamCodec} from "./stream.ts";

export const GeminiGenerateContentCodec = {
    ...GeminiGenerateContentRequestCodec,
    ...GeminiGenerateContentResponseCodec,
    ...GeminiGenerateContentStreamCodec,
} satisfies APIStepCodecWithStream<GenerateContentParameters, GenerateContentResponse, AsyncGenerator<GenerateContentResponse>>;

export function toGeminiSafetySettings(): SafetySetting[] {
    return ([
        "HARM_CATEGORY_HARASSMENT",
        "HARM_CATEGORY_HATE_SPEECH",
        "HARM_CATEGORY_SEXUALLY_EXPLICIT",
        "HARM_CATEGORY_DANGEROUS_CONTENT",
        "HARM_CATEGORY_CIVIC_INTEGRITY",
    ] as const).map((category) => {
        let threshold = "BLOCK_NONE"; // TODO: What's the difference between `BLOCK_NONE` and `OFF`?

        if(category === "HARM_CATEGORY_CIVIC_INTEGRITY") {
            threshold = "BLOCK_MEDIUM_AND_ABOVE";
        }

        return {
            category: category as HarmCategory,
            threshold: threshold as HarmBlockThreshold,
        };
    });
}
