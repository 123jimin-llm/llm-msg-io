import type { StepStreamEventHandler, StepStreamEventType } from "../../message/stream/index.ts";
import type { StepResult } from "./response.ts";

export interface StepStream<DecodedType extends StepResult = StepResult> {
    on<T extends StepStreamEventType>(type: T, handler: StepStreamEventHandler<T>): this;
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