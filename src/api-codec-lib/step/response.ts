import type { Message } from "../../message/index.ts";

export interface StepResponse {
    messages: Message[];
}

export type StepDecoder<EncodedType, DecodedType extends StepResponse = StepResponse> = (api_res: EncodedType) => DecodedType;

export type CodecStepDecoder<EncodedType, DecodedType extends StepResponse = StepResponse, DecodeOptions extends object=object> = (options?: Partial<DecodeOptions>) => StepDecoder<EncodedType, DecodedType>;

export interface WithCreateStepDecoder<EncodedType, DecodedType extends StepResponse = StepResponse, DecodeOptions extends object=object> {
    createStepDecoder: CodecStepDecoder<EncodedType, DecodedType, DecodeOptions>;
};

export type CodecStepDecoderLike<EncodedType, DecodedType extends StepResponse = StepResponse, DecodeOptions extends object=object>
    = CodecStepDecoder<EncodedType, DecodedType, DecodeOptions>
    | WithCreateStepDecoder<EncodedType, DecodedType, DecodeOptions>;

export function createStepDecoder<EncodedType, DecodedType extends StepResponse = StepResponse, DecodeOptions extends object=object>(
    codec: CodecStepDecoderLike<EncodedType, DecodedType, DecodeOptions>,
    options?: DecodeOptions,
): StepDecoder<EncodedType, DecodedType> {
    return (typeof codec === 'function' ? codec : codec.createStepDecoder)(options);
}