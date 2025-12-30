import type { GenerateContentResponse } from "@google/genai";

import type { WithCreateStepDecoder } from "../../api-codec-lib/index.ts";

export const GeminiGenerateContentResponseCodec = {
    createStepDecoder: () => () => {
        // TODO
        throw new Error("Not yet implemented!");
    },
} satisfies WithCreateStepDecoder<GenerateContentResponse>;