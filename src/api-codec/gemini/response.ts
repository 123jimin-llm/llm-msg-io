import type { Content, FinishReason, GenerateContentResponse, Blob as GeminiBlob } from "@google/genai";

import type { StepResult, WithCreateStepDecoder } from "../../api-codec-lib/index.ts";
import { concatContentsTo, type ContentPart, type Message, type MessageContent } from "../../message/index.ts";
import { getMessageExtraGemini } from "./extra.ts";

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

export function fromGeminiBlob(blob: GeminiBlob): ContentPart|null {
    if(blob.mimeType?.startsWith("image/")) {
        return {
            type: 'image',
            url: `data:${blob.mimeType};base64,${blob.data}`,
        };
    }

    return null;
}

export function fromGeminiContent(api_content: Content): Message {
    const thought_signatures: string[] = [];

    let content: MessageContent = "";
    const reasoning_arr: string[] = [];

    for(const part of api_content.parts ?? []) {
        if(part.thoughtSignature) {
            thought_signatures.push(part.thoughtSignature);
        }

        if(part.inlineData) {
            const blob_part = fromGeminiBlob(part.inlineData);
            if(blob_part) {
                content = concatContentsTo(content, [blob_part]);
            }
        }

        if(!part.text) continue;
        
        if(part.thought) {
            reasoning_arr.push(part.text);
        } else {
            content = concatContentsTo(content, part.text);
        }
    }

    const message: Message = {
        role: 'assistant',
        content,
    };

    if(reasoning_arr.length) {
        message.reasoning = reasoning_arr.join('\n');
    }

    if(thought_signatures.length) {
        const extra = getMessageExtraGemini(message, true);
        extra.thought_signatures = thought_signatures;
    }

    return message;
}

export const GeminiGenerateContentResponseCodec = {
    createStepDecoder: () => (api_res) => {
        const res: StepResult = {
            messages: [],
        };

        const candidate = api_res.candidates?.[0];
        if(candidate?.content) {
            res.messages.push(fromGeminiContent(candidate.content));
        }

        return res;
    },
} satisfies WithCreateStepDecoder<GenerateContentResponse>;