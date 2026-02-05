import type { ChatCompletionChunk } from "openai/resources/chat/completions";

import type { StepResult, WithCreateStepStreamDecoder } from "../../../api-codec-lib/step/index.ts";
import { toStepStream } from "../../../api-codec-lib/step/index.ts";
import type { MessageDelta, ToolCallDelta, StepStreamEvent, StreamEndEvent } from "../../../message/index.ts";
import { applyDeltaToStepStreamState, createStepStreamState, finalizeStepStreamState, stepStreamStateToResult } from "../../../message/index.ts";
import type { Stream } from "openai/streaming";

export type OpenAIChatCompletionStream = Stream<ChatCompletionChunk>;
type OpenAIDelta = ChatCompletionChunk.Choice.Delta & {reasoning?: string};

export function fromOpenAIDelta(api_delta: OpenAIDelta): MessageDelta {
    const delta: MessageDelta = {};
    
    if(api_delta.role) delta.role = api_delta.role;
    if(api_delta.content) delta.content = api_delta.content;
    if(api_delta.reasoning) delta.reasoning = api_delta.reasoning;
    if(api_delta.refusal) delta.refusal = api_delta.refusal;
    if(api_delta.tool_calls) {
        delta.tool_calls = api_delta.tool_calls.map((api_tool_call): ToolCallDelta => {
            const tool_call: ToolCallDelta = {
                index: api_tool_call.index,
            };

            if(api_tool_call.id != null) tool_call.id = api_tool_call.id;
            if(api_tool_call.function?.name != null) tool_call.name = api_tool_call.function.name;
            if(api_tool_call.function?.arguments != null) tool_call.arguments = api_tool_call.function.arguments;

            return tool_call;
        });
    }

    return delta;
}

export const OpenAIChatStreamCodec = {
    createStepStreamDecoder: () => (api_stream) => {
        return toStepStream((async function*(): AsyncGenerator<StepStreamEvent, StepResult> {
            const state = createStepStreamState();
            
            let started = false;
            let finish_reason = "";

            for await(const chunk of api_stream) {
                if(!started) {
                    started = true;
                    yield {
                        type: 'stream.start',
                        metadata: {
                            id: chunk.id,
                            model: chunk.model,
                        },
                    };
                }

                const choice = chunk.choices[0];
                if(choice == null) continue;

                const delta = fromOpenAIDelta(choice.delta);
                yield* applyDeltaToStepStreamState(state, delta);

                if (choice.finish_reason) {
                    finish_reason = choice.finish_reason;
                }
            }

            yield* finalizeStepStreamState(state);
            
            const stream_end_event: StreamEndEvent = {type: 'stream.end'};
            if(finish_reason) stream_end_event.finish_reason = finish_reason;
            yield stream_end_event;

            return stepStreamStateToResult(state);
        })());
    },
} satisfies WithCreateStepStreamDecoder<OpenAIChatCompletionStream>;