import type {RawMessageStreamEvent} from "@anthropic-ai/sdk/resources/messages";

import type {StepResult, WithCreateStepStreamDecoder} from "../../api-codec-lib/index.ts";
import type {StepStreamEvent, StreamEndEvent, ToolCallDelta} from "../../message/index.ts";
import {applyDeltaToStepStreamState, createStepStreamState, finalizeStepStreamState, stepStreamStateToResult} from "../../message/index.ts";

import {fromClaudeStopReason} from "./response.ts";
import {getMessageExtraClaude, type ClaudeRedactedThinkingBlock, type ClaudeThinkingBlock} from "./extra.ts";

export type ClaudeMessageStream = AsyncIterable<RawMessageStreamEvent>;

export const ClaudeMessagesStreamCodec = {
    createStepStreamDecoder: () => async function* (api_stream): AsyncGenerator<StepStreamEvent, StepResult> {
        const state = createStepStreamState();

        const block_types = new Map<number, string>();
        const thinking_blocks: Array<ClaudeThinkingBlock | ClaudeRedactedThinkingBlock> = [];

        let pending_thinking: {thinking: string; signature: string} | null = null;

        let tool_call_counter = 0;
        const block_to_tool_index = new Map<number, number>();

        let started = false;
        let finish_reason = '';

        for await (const event of await api_stream) {
            switch(event.type) {
                case 'message_start': {
                    started = true;

                    const metadata: {id?: string; model?: string} = {};
                    if(event.message.id) metadata.id = event.message.id;
                    if(event.message.model) metadata.model = event.message.model;

                    yield {
                        type: 'stream.start',
                        metadata,
                    };

                    yield* applyDeltaToStepStreamState(state, {
                        role: event.message.role,
                    });
                    break;
                }

                case 'content_block_start': {
                    const block = event.content_block;
                    block_types.set(event.index, block.type);

                    switch(block.type) {
                        case 'thinking':
                            pending_thinking = {thinking: '', signature: ''};
                            break;
                        case 'redacted_thinking':
                            thinking_blocks.push({type: 'redacted_thinking', data: block.data});
                            break;
                        case 'tool_use': {
                            const tc_index = tool_call_counter++;
                            block_to_tool_index.set(event.index, tc_index);

                            const tc_delta: ToolCallDelta = {
                                index: tc_index,
                                id: block.id,
                                name: block.name,
                            };
                            yield* applyDeltaToStepStreamState(state, {
                                tool_calls: [tc_delta],
                            });
                            break;
                        }
                        // text, server_tool_use, web_search_tool_result — nothing to do on start.
                    }
                    break;
                }

                case 'content_block_delta': {
                    const delta = event.delta;

                    switch(delta.type) {
                        case 'text_delta':
                            yield* applyDeltaToStepStreamState(state, {
                                content: delta.text,
                            });
                            break;
                        case 'thinking_delta':
                            if(pending_thinking) {
                                pending_thinking.thinking += delta.thinking;
                            }
                            yield* applyDeltaToStepStreamState(state, {
                                reasoning: delta.thinking,
                            });
                            break;
                        case 'signature_delta':
                            if(pending_thinking) {
                                pending_thinking.signature += delta.signature;
                            }
                            break;
                        case 'input_json_delta': {
                            const tc_index = block_to_tool_index.get(event.index);
                            if(tc_index != null) {
                                yield* applyDeltaToStepStreamState(state, {
                                    tool_calls: [{
                                        index: tc_index,
                                        arguments: delta.partial_json,
                                    }],
                                });
                            }
                            break;
                        }
                        // citations_delta — skip for now.
                    }
                    break;
                }

                case 'content_block_stop': {
                    const block_type = block_types.get(event.index);

                    if(block_type === 'thinking' && pending_thinking) {
                        thinking_blocks.push({
                            type: 'thinking',
                            thinking: pending_thinking.thinking,
                            signature: pending_thinking.signature,
                        });
                        pending_thinking = null;
                    }
                    break;
                }

                case 'message_delta': {
                    if(event.delta.stop_reason) {
                        finish_reason = fromClaudeStopReason(event.delta.stop_reason);
                    }
                    break;
                }

                // message_stop — nothing to do.
            }
        }

        // Flush any incomplete thinking block (shouldn't happen, but be safe).
        if(pending_thinking) {
            thinking_blocks.push({
                type: 'thinking',
                thinking: pending_thinking.thinking,
                signature: pending_thinking.signature,
            });
        }

        yield* finalizeStepStreamState(state);

        if(thinking_blocks.length) {
            const extra = getMessageExtraClaude(state.message, true);
            extra.thinking_blocks = thinking_blocks;
        }

        // Emit stream.start if we never got a message_start (shouldn't happen).
        if(!started) {
            yield {type: 'stream.start'};
        }

        const stream_end_event: StreamEndEvent = {type: 'stream.end'};
        if(finish_reason) stream_end_event.finish_reason = finish_reason;
        yield stream_end_event;

        return stepStreamStateToResult(state);
    },
} satisfies WithCreateStepStreamDecoder<ClaudeMessageStream>;
