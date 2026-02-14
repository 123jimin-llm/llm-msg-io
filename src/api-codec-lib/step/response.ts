import type {Message} from "../../message/index.ts";

export interface TokenUsage {
    /** Number of input/prompt tokens. */
    input_tokens: number;

    /** Number of output/completion tokens. */
    output_tokens: number;

    /** Total tokens (may include reasoning, caching overhead, etc.). */
    total_tokens?: number;

    /** Input tokens served from cache. */
    cache_read_tokens?: number;

    /** Tokens consumed by reasoning/thinking. */
    reasoning_tokens?: number;
}

export interface StepResult {
    messages: Message[];
    token_usage?: TokenUsage;
}

export type StepDecoder<EncodedType, DecodedType extends StepResult = StepResult> = (api_res: EncodedType) => DecodedType;

export type CodecStepDecoder<EncodedType, DecodedType extends StepResult = StepResult, DecodeOptions extends object = object> = (options?: Partial<DecodeOptions>) => StepDecoder<EncodedType, DecodedType>;

export interface WithCreateStepDecoder<EncodedType, DecodedType extends StepResult = StepResult, DecodeOptions extends object = object> {
    createStepDecoder: CodecStepDecoder<EncodedType, DecodedType, DecodeOptions>;
};

export type CodecStepDecoderLike<EncodedType, DecodedType extends StepResult = StepResult, DecodeOptions extends object = object> =
    CodecStepDecoder<EncodedType, DecodedType, DecodeOptions>
    | WithCreateStepDecoder<EncodedType, DecodedType, DecodeOptions>;

export function createStepDecoder<EncodedType, DecodedType extends StepResult = StepResult, DecodeOptions extends object = object>(
    codec: CodecStepDecoderLike<EncodedType, DecodedType, DecodeOptions>,
    options?: DecodeOptions,
): StepDecoder<EncodedType, DecodedType> {
    return (typeof codec === 'function' ? codec : codec.createStepDecoder)(options);
}
