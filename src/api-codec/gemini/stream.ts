import type { GenerateContentResponse } from "@google/genai";
import type { WithCreateStepStreamDecoder } from "../../api-codec-lib/index.ts";

export const GeminiGenerateContentStreamCodec = {
    createStepStreamDecoder: () => (api_stream) => {
        // TODO
        throw new Error("Not yet implemented!");
    },
} satisfies WithCreateStepStreamDecoder<AsyncGenerator<GenerateContentResponse>>;