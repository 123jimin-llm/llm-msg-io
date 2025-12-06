import type { Message } from "../../message/index.ts";

export interface StepRequest {
    messages: Message[];
}

export type StepEncoder<EncodedType, DecodedType extends StepRequest = StepRequest> = (req: DecodedType) => EncodedType;

export type CodecStepEncoder<EncodedType, DecodedType extends StepRequest = StepRequest, EncodeOptions extends object=object> = (options?: Partial<EncodeOptions>) => StepEncoder<EncodedType, DecodedType>;

export interface WithCreateStepEncoder<EncodedType, DecodedType extends StepRequest = StepRequest, EncodeOptions extends object=object> {
    createStepEncoder: CodecStepEncoder<EncodedType, DecodedType, EncodeOptions>;
};

export type CodecStepEncoderLike<EncodedType, DecodedType extends StepRequest = StepRequest, EncodeOptions extends object=object>
    = CodecStepEncoder<EncodedType, DecodedType, EncodeOptions>
    | WithCreateStepEncoder<EncodedType, DecodedType, EncodeOptions>;

export function createStepEncoder<EncodedType, DecodedType extends StepRequest = StepRequest, EncodeOptions extends object=object>(
    codec: CodecStepEncoderLike<EncodedType, DecodedType, EncodeOptions>,
    options?: EncodeOptions,
): StepEncoder<EncodedType, DecodedType> {
    return (typeof codec === 'function' ? codec : codec.createStepEncoder)(options);
}