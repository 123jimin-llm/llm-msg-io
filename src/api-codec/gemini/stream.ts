import type {GenerateContentResponse} from "@google/genai";

import type {StepResult, TokenUsage, WithCreateStepStreamDecoder} from "../../api-codec-lib/index.ts";
import type {StepStreamEvent, StreamEndEvent, StreamStartEvent, ToolCallDelta} from "../../message/index.ts";
import {applyDeltaToStepStreamState, createStepStreamState, finalizeStepStreamState, stepStreamStateToResult} from "../../message/index.ts";
import {getMessageExtraGemini, mergeMessageExtraGemini} from "./extra.ts";
import {fromGeminiContent, fromGeminiFinishReason, fromGeminiUsageMetadata} from "./response.ts";

export const GeminiGenerateContentStreamCodec = {
    createStepStreamDecoder: () => async function* (api_stream): AsyncGenerator<StepStreamEvent, StepResult> {
        const state = createStepStreamState();

        let tool_call_counter = 0;
        let started = false;
        let finish_reason = "";
        let token_usage: TokenUsage | null = null;

        try {
            for await (const chunk of await api_stream) {
                const candidate = chunk.candidates?.[0];
                if(!candidate) continue;

                if(!started) {
                    started = true;

                    const metadata: StreamStartEvent['metadata'] = {};
                    if(chunk.responseId) metadata.id = chunk.responseId;
                    if(chunk.modelVersion) metadata.model = chunk.modelVersion;

                    yield {
                        type: 'stream.start',
                        metadata,
                    };
                }

                const {content} = candidate;
                if(content == null) continue;

                const {tool_calls: chunk_tool_calls, ...delta} = fromGeminiContent(content);
                yield* applyDeltaToStepStreamState(state, {
                    ...delta,
                    tool_calls: chunk_tool_calls?.map((tc, ind): ToolCallDelta => ({
                        ...tc,
                        index: tool_call_counter + ind,
                    })),
                });
                if(chunk_tool_calls?.length) tool_call_counter += chunk_tool_calls.length;

                const delta_extra = getMessageExtraGemini(delta);
                if(delta_extra) {
                    mergeMessageExtraGemini(getMessageExtraGemini(state.message, true), delta_extra);
                }

                if(candidate.finishReason) {
                    finish_reason = fromGeminiFinishReason(candidate.finishReason);
                }

                const chunk_usage = fromGeminiUsageMetadata(chunk.usageMetadata);
                if(chunk_usage) token_usage = chunk_usage;
            }
        } catch (err) {
            yield {type: 'stream.error', error: err instanceof Error ? err : new Error(String(err))};
        }

        yield* finalizeStepStreamState(state);

        const stream_end_event: StreamEndEvent = {type: 'stream.end'};
        if(finish_reason) stream_end_event.finish_reason = finish_reason;
        yield stream_end_event;

        const result = stepStreamStateToResult(state);
        if(token_usage) result.token_usage = token_usage;
        return result;
    },
} satisfies WithCreateStepStreamDecoder<AsyncGenerator<GenerateContentResponse>>;
