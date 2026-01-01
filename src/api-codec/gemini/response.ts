import type { FinishReason, GenerateContentResponse } from "@google/genai";

import type { StepResult, WithCreateStepDecoder } from "../../api-codec-lib/index.ts";

// Converts to OpenAI-compatible finish reason.
export function fromGeminiFinishReason(finish_reason: FinishReason): string {
    switch(finish_reason as string) {
        case 'MAX_TOKENS': return 'length';
        case 'SAFETY':
        case 'RECITATION':
        case 'BLOCKLIST':
        case 'PROHIBITED_CONTENT':
        case 'SPII': return 'content_filter';
        case 'STOP':
        case 'OTHER':
        default: return 'stop';
    }
}

export const GeminiGenerateContentResponseCodec = {
    createStepDecoder: () => (api_res) => {
        console.log(api_res);

        // TODO
        const res: StepResult = {
            messages: [],
        };

        return res;
    },
} satisfies WithCreateStepDecoder<GenerateContentResponse>;