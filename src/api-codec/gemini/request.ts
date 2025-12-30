import type { GenerateContentParameters } from "@google/genai";

import type { WithCreateStepEncoder } from "../../api-codec-lib/index.ts";

export const GeminiGenerateContentRequestCodec = {
    createStepEncoder: () => (req): GenerateContentParameters => {
        // TODO

        return {
            model: "gemini-3-flash-preview",
            contents: [],
        };
    },
} satisfies WithCreateStepEncoder<GenerateContentParameters>;