import type { ToolCallDelta } from "../../message/index.ts";
import { addStepStreamEventHandler, invokeStepStreamEventHandlers, applyDeltaToStepStreamState, finalizeStepStreamState, createStepStreamState } from "../../message/stream/index.ts";
import type { StepStreamEvent, StepStreamEventHandler, StepStreamEventHandlersRecord, StepStreamEventType } from "../../message/stream/index.ts";
import { createGeneratorController } from "../../util/generator.ts";
import type { StepResult } from "./response.ts";

export interface StepStream<DecodedType extends StepResult = StepResult> {
    on<T extends StepStreamEventType>(type: T, handler: StepStreamEventHandler<T>): this;
    events(): AsyncIterable<StepStreamEvent>;
    
    done(): Promise<DecodedType>;
}

export type StepStreamDecoder<
    EncodedType,
    DecodedType extends StepResult = StepResult,
> = (api_stream: EncodedType) => StepStream<DecodedType>;

export type CodecStepStreamDecoder<
    EncodedType,
    DecodedType extends StepResult = StepResult,
    DecodeOptions extends object = object,
> = (options?: Partial<DecodeOptions>) => StepStreamDecoder<EncodedType, DecodedType>;

export interface WithCreateStepStreamDecoder<
    EncodedType,
    DecodedType extends StepResult = StepResult,
    DecodeOptions extends object = object,
> {
    createStepStreamDecoder: CodecStepStreamDecoder<EncodedType, DecodedType, DecodeOptions>;
}

export type CodecStepStreamDecoderLike<
    EncodedType,
    DecodedType extends StepResult = StepResult,
    DecodeOptions extends object = object,
>
    = CodecStepStreamDecoder<EncodedType, DecodedType, DecodeOptions>
    | WithCreateStepStreamDecoder<EncodedType, DecodedType, DecodeOptions>;

export function createStepStreamDecoder<
    EncodedType,
    DecodedType extends StepResult = StepResult,
    DecodeOptions extends object = object,
>(
    codec: CodecStepStreamDecoderLike<EncodedType, DecodedType, DecodeOptions>,
    options?: DecodeOptions,
): StepStreamDecoder<EncodedType, DecodedType> {
    return (typeof codec === 'function' ? codec : codec.createStepStreamDecoder)(options);
}

export function toStepStream<DecodedType extends StepResult = StepResult>(
    event_generator: AsyncGenerator<StepStreamEvent, DecodedType>,
): StepStream<StepResult> {
    const handlers: StepStreamEventHandlersRecord = {};
    const events = createGeneratorController<StepStreamEvent, DecodedType>();

    void (async() => {
        for await(const event of events.entries()) {
            invokeStepStreamEventHandlers(handlers, event);
        }
    })();

    void (async() => {
        let result: DecodedType;

        try {
            while(true) {
                const {done, value} = await event_generator.next();
                if(done) {
                    result = value;
                    break;
                }

                events.yeet(value);
            }
        } catch(err) {
            events.fail(err);
            return;
        }

        return result;
    });
    
    const stream: StepStream<DecodedType> = {
        on<T extends StepStreamEventType>(type: T, handler: StepStreamEventHandler<T>) {
            addStepStreamEventHandler(handlers, type, handler);
            return stream;
        },
        events() {
            return events.entries();
        },
        done() {
            return events.result();
        }
    };

    return stream;
}

export async function* stepResultPromiseToEvents<DecodedType extends StepResult>(
    result_promise: Promise<DecodedType>,
): AsyncGenerator<StepStreamEvent, DecodedType> {
    yield { type: 'stream.start' };

    const res = await result_promise;
    for(const message of res.messages) {
        const state = createStepStreamState();
        
        yield* applyDeltaToStepStreamState(state, {
            ...message,
            tool_calls: message.tool_calls?.map((tool_call, ind): ToolCallDelta => {
                return {
                    ...tool_call,
                    index: ind,
                };
            }),
        });

        yield* finalizeStepStreamState(state);
    }

    yield { type: 'stream.end' };

    return res;
}