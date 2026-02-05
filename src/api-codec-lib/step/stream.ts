import type { ToolCallDelta } from "../../message/index.ts";
import { applyDeltaToStepStreamState, finalizeStepStreamState, createStepStreamState } from "../../message/stream/index.ts";
import type { StepStreamEvent } from "../../message/stream/index.ts";
import type { StepResult } from "./response.ts";

export type StepStreamGenerator<DecodedType extends StepResult = StepResult> = AsyncGenerator<StepStreamEvent, DecodedType>;

export type StepStreamDecoder<
    EncodedType,
    DecodedType extends StepResult = StepResult,
> = (api_stream: EncodedType) => StepStreamGenerator<DecodedType>;

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