import type { GenerateContentResponse } from "@google/genai";
import type { StepResult, WithCreateStepStreamDecoder } from "../../api-codec-lib/index.ts";
import type { StepStreamEvent, StreamEndEvent, StreamStartEvent, ToolCallDelta } from "../../message/index.ts";
import { applyDeltaToStepStreamState, createStepStreamState, finalizeStepStreamState, stepStreamStateToResult } from "../../message/index.ts";

import { fromGeminiContent, fromGeminiFinishReason } from "./response.ts";
import { getMessageExtraGemini, mergeMessageExtraGemini } from "./extra.ts";

export const GeminiGenerateContentStreamCodec = {
    createStepStreamDecoder: () => async function*(api_stream): AsyncGenerator<StepStreamEvent, StepResult> {
        const state = createStepStreamState();

        let started = false;
        let finish_reason = "";
        
        for await(const chunk of await api_stream) {
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

            const {tool_calls, ...delta} = fromGeminiContent(content);
            yield* applyDeltaToStepStreamState(state, {
                ...delta,
                tool_calls: tool_calls?.map((tc, ind): ToolCallDelta => ({
                    ...tc,
                    index: state.tool_calls.size + ind,
                })),
            });

            const delta_extra = getMessageExtraGemini(delta);
            if(delta_extra) {
                mergeMessageExtraGemini(getMessageExtraGemini(state.message, true), delta_extra);
            }

            if(candidate.finishReason) {
                finish_reason = fromGeminiFinishReason(candidate.finishReason);
            }
        }

        yield* finalizeStepStreamState(state);

        const stream_end_event: StreamEndEvent = {type: 'stream.end'};
        if(finish_reason) stream_end_event.finish_reason = finish_reason;
        yield stream_end_event;

        return stepStreamStateToResult(state);
    },
} satisfies WithCreateStepStreamDecoder<AsyncGenerator<GenerateContentResponse>>;