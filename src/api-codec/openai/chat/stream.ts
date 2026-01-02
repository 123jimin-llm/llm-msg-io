import type { ChatCompletionChunk } from "openai/resources/chat/completions";

import type { StepResult, StepStream, WithCreateStepStreamDecoder } from "../../../api-codec-lib/step/index.ts";
import { addStepStreamEventHandler, invokeStepStreamEventHandler, invokeStepStreamEventHandlerFromDelta, Message, type StepStreamEventHandler, type StepStreamEventHandlersRecord, type StepStreamEventType, type ToolCall } from "../../../message/index.ts";
import type { Stream } from "openai/streaming";

export type OpenAIChatCompletionStream = Stream<ChatCompletionChunk>;

export function fromOpenAIDelta(api_delta: ChatCompletionChunk.Choice.Delta): Partial<Message> {
    const delta: Partial<Message> = {};
    
    if(api_delta.role) delta.role = api_delta.role;
    if(api_delta.content) delta.content = api_delta.content;
    if(api_delta.refusal) delta.refusal = api_delta.refusal;

    

    return delta;
}

export const OpenAIChatStreamCodec = {
    createStepStreamDecoder: () => (api_stream) => {
        const handlers: StepStreamEventHandlersRecord = {};

        const process_promise = (async(): Promise<StepResult> => {
            const message: Message = {
                role: "",
                content: "",
            };
            
            let started = false;
            let finish_reason = "";

            const tool_calls = new Map<number, ToolCall>();
            const tool_call_started = new Set<number>();

            for await(const chunk of api_stream) {
                if(!started) {
                    started = true;
                    invokeStepStreamEventHandler(handlers, {
                        type: 'stream.start',
                        metadata: {
                            id: chunk.id,
                            model: chunk.model,
                        },
                    });
                }

                if(chunk.choices.length === 0) continue;

                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                const choice = chunk.choices[0]!;
                const delta = fromOpenAIDelta(choice.delta);

                invokeStepStreamEventHandlerFromDelta(handlers, message, delta);

                // TODO: Move to invokeStepStreamEventHandlerFromDelta.
                if(choice.delta.tool_calls) {
                    for(const tc of choice.delta.tool_calls) {
                        const ind = tc.index;
                        let existing = tool_calls.get(ind);
                        if(!existing) {
                            existing = { id: "", name: "", arguments: "" };
                            tool_calls.set(ind, existing);
                        }

                        if(tc.id) existing.id = tc.id;
                        if(tc.function?.name) existing.name += tc.function.name;
                        if(tc.function?.arguments) existing.arguments += tc.function.arguments;

                        if (!tool_call_started.has(ind) && existing.id && existing.name) {
                            tool_call_started.add(ind);
                            invokeStepStreamEventHandler(handlers, {
                                type: "tool_call.start",
                                index: ind,
                                id: existing.id,
                                name: existing.name,
                            });
                        }
                        
                        if (tc.function?.arguments) {
                            invokeStepStreamEventHandler(handlers, {
                                type: "tool_call.delta",
                                index: ind,
                                delta: tc.function.arguments,
                            });
                        }
                    }
                }
                
                if (choice.finish_reason) {
                    finish_reason = choice.finish_reason;
                }
            }
            
            for (const [ind, tc] of tool_calls.entries()) {
                invokeStepStreamEventHandler(handlers, {
                    type: "tool_call.end",
                    index: ind,
                    tool_call: tc,
                });
            }

            invokeStepStreamEventHandler(handlers, {
                type: "stream.end",
                finish_reason: finish_reason,
            });

            message.role = message.role || "assistant";

            if(tool_calls.size > 0) {
                message.tool_calls = Array.from(tool_calls.entries())
                    .sort(([a], [b]) => a-b)
                    .map(([, tc]): ToolCall => tc);
            }

            return { messages: [message] };
        })();

        const stream: StepStream = {
            on<T extends StepStreamEventType>(type: T, handler: StepStreamEventHandler<T>) {
                addStepStreamEventHandler(handlers, type, handler);
                return stream;
            },
            done() {
                return process_promise;
            },
        };

        return stream;
    },
} satisfies WithCreateStepStreamDecoder<OpenAIChatCompletionStream>;