import type {Content, FunctionDeclaration, GenerateContentParameters, Part} from "@google/genai";

import type {FunctionDefinition, StepParams, WithCreateStepEncoder} from "../../api-codec-lib/index.ts";
import {Message, messageContentToText, messageContentToTextArray} from "../../message/index.ts";
import {type Nullable, unreachable} from "../../util/type.ts";
import {type GeminiExtra, getMessageExtraGemini} from "./extra.ts";

export function isGeminiSystemRole(role: string): boolean {
    switch(role) {
        case 'system': return true;
        case 'developer': return true;
    }

    return false;
}

export function toGeminiFunctionDeclaration(func_def: FunctionDefinition): FunctionDeclaration {
    return {
        ...func_def,
    } as FunctionDeclaration;
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

                const b64_sep = ';base64,';
                const b64_idx = image_url.indexOf(b64_sep);
                if(b64_idx === -1) {
                    throw new Error("toGeminiParts: image url must be a base64 data url!");
                }

                return {
                    inlineData: {
                        mimeType: image_url.slice("data:".length, b64_idx),
                        data: image_url.slice(b64_idx + b64_sep.length),
                    },
                };
            }
            case 'audio': throw new Error("toGeminiParts: audio not yet implemented!");
            case 'file': throw new Error("toGeminiParts: file not yet implemented!");
            default: return unreachable(part);
        }
    });
}

function toGeminiContent(message: Message): Content {
    if(message.role === 'tool') {
        const text = messageContentToText(message.content) ?? '';
        let response: Record<string, unknown>;
        try {
            const parsed: unknown = JSON.parse(text);
            response = (typeof parsed === 'object' && parsed !== null && !Array.isArray(parsed))
                ? parsed as Record<string, unknown>
                : {result: text};
        } catch{
            response = {result: text};
        }

        const fr: {name: string; response: Record<string, unknown>; id?: string} = {
            name: message.name ?? '',
            response,
        };
        if(message.call_id) fr.id = message.call_id;

        return {
            role: 'user',
            parts: [{functionResponse: fr}],
        };
    }

    const parts = toGeminiParts(message);

    if(message.tool_calls?.length) {
        for(const tc of message.tool_calls) {
            let args: Record<string, unknown>;
            try {
                args = JSON.parse(tc.arguments);
            } catch{
                args = {};
            }

            const fc: {name: string; args: Record<string, unknown>; id?: string} = {
                name: tc.name,
                args,
            };
            if(tc.id) fc.id = tc.id;

            parts.push({functionCall: fc});
        }
    }

    return {
        role: message.role === 'assistant' ? 'model' : 'user',
        parts,
    };
}

export interface GeminiGenerateContentRequestEncodeOptions {
    model: string;
}

export const GeminiGenerateContentRequestCodec = {
    createStepEncoder: ({model = "gemini-3-flash-preview"} = {}) => (req): GenerateContentParameters => {
        const system_instructions: string[] = [];
        const api_messages: GenerateContentParameters['contents'] = [];

        for(let i=0; i<req.messages.length; ++i) {
            const message = req.messages[i]!;

            if(isGeminiSystemRole(message.role)) {
                system_instructions.push(...messageContentToTextArray(message.content));
                continue;
            }

            api_messages.push(...req.messages.slice(i).map(toGeminiContent));
            break;
        }

        type GenerateContentParametersConfig = {config: Exclude<GenerateContentParameters['config'], undefined>};
        const api_req: GenerateContentParameters & GenerateContentParametersConfig = {
            model,
            contents: api_messages,
            config: {},
        };

        if(system_instructions.length > 0) {
            api_req.config.systemInstruction = system_instructions;
        }

        if(req.functions?.length) {
            api_req.config.tools = [{
                functionDeclarations: req.functions.map((fn) => toGeminiFunctionDeclaration(fn)),
            }];
        }

        if(req.response_schema) {
            api_req.config.responseMimeType = 'application/json';
            api_req.config.responseJsonSchema = req.response_schema.schema;
        }

        return api_req;
    },
} satisfies WithCreateStepEncoder<GenerateContentParameters, StepParams, GeminiGenerateContentRequestEncodeOptions>;
