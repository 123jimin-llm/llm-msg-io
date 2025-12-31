import type { Content, GenerateContentParameters, Part } from "@google/genai";

import type { WithCreateStepEncoder } from "../../api-codec-lib/index.ts";
import { Message, messageContentToTextArray } from "../../message/index.ts";
import { getMessageExtraGemini, type GeminiExtra } from "./extra.ts";
import type { Nullable } from "../../util/type.ts";

export function isGeminiSystemRole(role: string): boolean {
    switch(role) {
        case 'system': return true;
        case 'developer': return true;
    }

    return false;
}

function createWithThoughtSignature(gemini_extra: Nullable<GeminiExtra>) {
    const thought_signature = gemini_extra?.thought_signatures?.[0] ?? null;
    if(thought_signature) {
        return (part: Part): Part => {
            part.thoughtSignature = thought_signature;
            return part;
        };
    } else {
        return (part: Part): Part => part;
    }
}

export function toGeminiParts(message: Message): Part[] {
    const content = message.content;

    const gemini_extra = getMessageExtraGemini(message);
    const withThoughtSignature = createWithThoughtSignature(gemini_extra);

    if(typeof content === 'string') {
        return [withThoughtSignature({text: content})];
    }

    return content.map((part): Part => {
        switch(part.type) {
            case 'text': return withThoughtSignature({text: part.text});
            case 'image': {
                const image_url = part.url;
                if(!image_url?.startsWith("data:image")) {
                    throw new Error("toGeminiParts: image url must be a data url!");
                }

                const [header, data] = image_url.split(';', 2);
                if(!data?.startsWith("base64,")) {
                    throw new Error("toGeminiParts: image url must be a base64 data url!");
                }

                return {
                    inlineData: {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        mimeType: header!.slice("data:".length),
                        data: data.slice("base64,".length),
                    },
                };
            }
            case 'audio': throw new Error("toGeminiParts: audio not yet implemented!");
            case 'file': throw new Error("toGeminiParts: file not yet implemented!");
        }
    });
}

export const GeminiGenerateContentRequestCodec = {
    createStepEncoder: () => (req): GenerateContentParameters => {
        const system_instructions: string[] = [];
        const api_messages: GenerateContentParameters['contents'] = [];

        for(let i=0; i<req.messages.length; ++i) {
            // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
            const message = req.messages[i]!;

            if(isGeminiSystemRole(message.role)) {
                system_instructions.push(...messageContentToTextArray(message.content));
                continue;
            }

            api_messages.push(...req.messages.slice(i).map((message): Content => {
                return {
                    role: message.role === 'assistant' ? 'model' : 'user',
                    parts: toGeminiParts(message),
                };
            }));
        }

        type GenerateContentParametersConfig = {'config': Exclude<GenerateContentParameters['config'], undefined>};
        const api_req: GenerateContentParameters & GenerateContentParametersConfig = {
            model: "gemini-3-flash-preview",
            contents: [],
            config: {},
        };

        if(system_instructions.length > 0) {
            api_req.config.systemInstruction = system_instructions;
        }

        return api_req;
    },
} satisfies WithCreateStepEncoder<GenerateContentParameters>;