import type { Stream } from "openai/streaming";
import type { ChatCompletionChunk } from "openai/resources";

import type { LLMStream, LLMStreamEventHandlersRecord, LLMStreamEventListener, LLMStreamEventType, LLMStreamResult } from "../../message/stream/index.ts";
import  { addLLMStreamEventHandler, invokeLLMStreamEventHandlers } from "../../message/stream/index.ts";
import type { WithCreateStreamDecoder } from "../../message/codec/index.ts";
import { ToolCall, type Message } from "../../message/index.ts";

export const OpenAIChatStreamCodec = {
    createStreamDecoder: () => (api_stream) => {
        const handlers: LLMStreamEventHandlersRecord = {};

        const process_promise = (async(): Promise<LLMStreamResult> => {
            let role = "";
            let content = "";
            let refusal = "";
            let finish_reason = "";
            let started = false;

            const tool_calls = new Map<number, ToolCall>();
            const tool_call_started = new Set<number>();

            for await(const chunk of api_stream) {
                if(!started) {
                    started = true;
                    invokeLLMStreamEventHandlers(handlers, {
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
                const delta = choice.delta;

                if(delta.role) {
                    role = delta.role;
                    invokeLLMStreamEventHandlers(handlers, {
                        type: "role",
                        role,
                    });
                }

                if(delta.content) {
                    content += delta.content;
                    invokeLLMStreamEventHandlers(handlers, {
                        type: 'content.delta',
                        delta: delta.content,
                    });
                }

                if(delta.refusal) {
                    refusal += delta.refusal;
                    invokeLLMStreamEventHandlers(handlers, {
                        type: 'refusal.delta',
                        delta: delta.refusal,
                    });
                }

                if(delta.tool_calls) {
                    for(const tc of delta.tool_calls) {
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
                            invokeLLMStreamEventHandlers(handlers, {
                                type: "tool_call.start",
                                index: ind,
                                id: existing.id,
                                name: existing.name,
                            });
                        }
                        
                        if (tc.function?.arguments) {
                            invokeLLMStreamEventHandlers(handlers, {
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
                invokeLLMStreamEventHandlers(handlers, {
                    type: "tool_call.end",
                    index: ind,
                    tool_call: tc,
                });
            }

            invokeLLMStreamEventHandlers(handlers, {
                type: "stream.end",
                finish_reason: finish_reason,
            });

            const message: Message = {
                role: role || "assistant",
                content,
            };

            if(refusal) message.refusal = refusal;
            if(tool_calls.size > 0) {
                message.tool_calls = Array.from(tool_calls.entries())
                    .sort(([a], [b]) => a-b)
                    .map(([, tc]): ToolCall => tc);
            }

            return { messages: [message] };
        })();

        const stream: LLMStream = {
            on<T extends LLMStreamEventType>(type: T, listener: LLMStreamEventListener<T>) {
                addLLMStreamEventHandler(handlers, type, listener);
                return stream;
            },
            done() {
                return process_promise;
            },
        };

        return stream;
    },
} satisfies WithCreateStreamDecoder<Stream<ChatCompletionChunk>>;