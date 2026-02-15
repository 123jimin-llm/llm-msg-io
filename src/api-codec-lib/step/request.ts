import type {Message} from "../../message/index.ts";
import type {FunctionDefinition} from "./function.ts";
import type {ResponseSchema} from "./schema.ts";

export interface StepParams {
    functions?: FunctionDefinition[];
    response_schema?: ResponseSchema;
    messages: Message[];
}

export type StepEncoder<EncodedType, DecodedType extends StepParams = StepParams> = (req: DecodedType) => EncodedType;

export type CodecStepEncoder<EncodedType, DecodedType extends StepParams = StepParams, EncodeOptions extends object = object> = (options?: Partial<EncodeOptions>) => StepEncoder<EncodedType, DecodedType>;

export interface WithCreateStepEncoder<EncodedType, DecodedType extends StepParams = StepParams, EncodeOptions extends object = object> {
    createStepEncoder: CodecStepEncoder<EncodedType, DecodedType, EncodeOptions>;
};

export type CodecStepEncoderLike<EncodedType, DecodedType extends StepParams = StepParams, EncodeOptions extends object = object> =
    CodecStepEncoder<EncodedType, DecodedType, EncodeOptions>
    | WithCreateStepEncoder<EncodedType, DecodedType, EncodeOptions>;

export function createStepEncoder<EncodedType, DecodedType extends StepParams = StepParams, EncodeOptions extends object = object>(
    codec: CodecStepEncoderLike<EncodedType, DecodedType, EncodeOptions>,
    options?: EncodeOptions,
): StepEncoder<EncodedType, DecodedType> {
    return (typeof codec === 'function' ? codec : codec.createStepEncoder)(options);
}
