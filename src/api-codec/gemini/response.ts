import type {Content, FinishReason, GenerateContentResponse, GenerateContentResponseUsageMetadata, Blob as GeminiBlob} from "@google/genai";

import type {StepResult, TokenUsage, WithCreateStepDecoder} from "../../api-codec-lib/index.ts";
import type {ContentPart, Message, MessageContent, ToolCall} from "../../message/index.ts";
import {concatContentsTo} from "../../message/index.ts";
import {getMessageExtraGemini} from "./extra.ts";
import type {Nullable} from "../../util/type.ts";

export function fromGeminiUsageMetadata(usage: Nullable<GenerateContentResponseUsageMetadata>): TokenUsage | null {
    if(usage == null) return null;
    if(usage.promptTokenCount == null && usage.candidatesTokenCount == null) return null;

    const token_usage: TokenUsage = {
        input_tokens: usage.promptTokenCount ?? 0,
        output_tokens: usage.candidatesTokenCount ?? 0,
    };

    if(usage.totalTokenCount != null) {
        token_usage.total_tokens = usage.totalTokenCount;
    }

    if(usage.cachedContentTokenCount != null) {
        token_usage.cache_read_tokens = usage.cachedContentTokenCount;
    }

    if(usage.thoughtsTokenCount != null) {
        token_usage.reasoning_tokens = usage.thoughtsTokenCount;
    }

    return token_usage;
}

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
    const tool_calls: ToolCall[] = [];

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

        if(part.functionCall) {
            const fc = part.functionCall;
            const tc: ToolCall = {
                name: fc.name ?? '',
                arguments: JSON.stringify(fc.args ?? {}),
            };
            if(fc.id) tc.id = fc.id;
            tool_calls.push(tc);
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

    if(tool_calls.length) {
        message.tool_calls = tool_calls;
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

        const token_usage = fromGeminiUsageMetadata(api_res.usageMetadata ?? null);
        if(token_usage) res.token_usage = token_usage;

        return res;
    },
} satisfies WithCreateStepDecoder<GenerateContentResponse>;
