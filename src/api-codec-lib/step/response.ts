import type { Message } from "../../message/index.ts";

export interface StepResult {
    messages: Message[];
}

export type StepDecoder<EncodedType, DecodedType extends StepResult = StepResult> = (api_res: EncodedType) => DecodedType;

export type CodecStepDecoder<EncodedType, DecodedType extends StepResult = StepResult, DecodeOptions extends object=object> = (options?: Partial<DecodeOptions>) => StepDecoder<EncodedType, DecodedType>;

export interface WithCreateStepDecoder<EncodedType, DecodedType extends StepResult = StepResult, DecodeOptions extends object=object> {
    createStepDecoder: CodecStepDecoder<EncodedType, DecodedType, DecodeOptions>;
};

export type CodecStepDecoderLike<EncodedType, DecodedType extends StepResult = StepResult, DecodeOptions extends object=object>
    = CodecStepDecoder<EncodedType, DecodedType, DecodeOptions>
    | WithCreateStepDecoder<EncodedType, DecodedType, DecodeOptions>;

export function createStepDecoder<EncodedType, DecodedType extends StepResult = StepResult, DecodeOptions extends object=object>(
    codec: CodecStepDecoderLike<EncodedType, DecodedType, DecodeOptions>,
    options?: DecodeOptions,
): StepDecoder<EncodedType, DecodedType> {
    return (typeof codec === 'function' ? codec : codec.createStepDecoder)(options);
}