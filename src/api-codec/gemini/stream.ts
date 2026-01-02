import type { GenerateContentResponse } from "@google/genai";
import type { StepResult, StepStream, WithCreateStepStreamDecoder } from "../../api-codec-lib/index.ts";
import type { Message, StepStreamEventHandler, StepStreamEventHandlersRecord, StepStreamEventType, StreamStartEvent } from "../../message/index.ts";
import { addStepStreamEventHandler, invokeStepStreamEventHandler, invokeStepStreamEventHandlerFromDelta } from "../../message/index.ts";

import { fromGeminiContent, fromGeminiFinishReason } from "./response.ts";
import { getMessageExtraGemini, mergeMessageExtraGemini } from "./extra.ts";

export const GeminiGenerateContentStreamCodec = {
    createStepStreamDecoder: () => (api_stream) => {
        const handlers: StepStreamEventHandlersRecord = {};

        const process_promise = (async(): Promise<StepResult> => {
            const message: Message = {
                role: "",
                content: "",
            };

            let started = false;
            let finish_reason = "";

            for await(const chunk of api_stream) {
                const candidate = chunk.candidates?.[0];
                if(!candidate) continue;

                if(!started) {
                    started = true;

                    const metadata: StreamStartEvent['metadata'] = {};
                    if(chunk.responseId) metadata.id = chunk.responseId;
                    if(chunk.modelVersion) metadata.model = chunk.modelVersion;

                    invokeStepStreamEventHandler(handlers, {
                        type: 'stream.start',
                        metadata,
                    });
                }

                const {content} = candidate;
                if(content == null) continue;

                const delta = fromGeminiContent(content);
                invokeStepStreamEventHandlerFromDelta(handlers, message, delta);

                const delta_extra = getMessageExtraGemini(delta);
                if(delta_extra) {
                    mergeMessageExtraGemini(getMessageExtraGemini(message, true), delta_extra);
                }

                if(candidate.finishReason) {
                    finish_reason = fromGeminiFinishReason(candidate.finishReason);
                }
            }

            invokeStepStreamEventHandler(handlers, {
                type: "stream.end",
                finish_reason: finish_reason,
            });
            
            message.role = message.role || "assistant";

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
} satisfies WithCreateStepStreamDecoder<AsyncGenerator<GenerateContentResponse>>;