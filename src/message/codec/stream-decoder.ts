import type { LLMStream } from "../stream/index.ts";

/** Converts an API stream type into a stream object. */
export type StreamDecoder<StreamType> = (stream: StreamType) => LLMStream;

/** A function that returns a stream decoder. */
export type CodecStreamDecoder<StreamType, DecodeOptions extends object=object> = (options?: Partial<DecodeOptions>) => StreamDecoder<StreamType>;

/** An object that provides a stream decoder. */
export interface WithCreateStreamDecoder<StreamType, DecodeOption extends object=object> {
    createStreamDecoder: CodecStreamDecoder<StreamType, DecodeOption>;
}

/** Either a function that returns a stream decoder, or a codec with createStreamDecoder. */
export type CodecStreamDecoderLike<StreamType, DecodeOptions extends object=object> = CodecStreamDecoder<StreamType, DecodeOptions> | WithCreateStreamDecoder<StreamType, DecodeOptions>;

/** Invokes the function that returns a stream decoder. */
export function createStreamDecoder<StreamType, DecodeOptions extends object=object>(
    codec: CodecStreamDecoderLike<StreamType, DecodeOptions>,
    options?: DecodeOptions,
) {
    const createDecoder = (typeof codec === 'function') ? codec : codec.createStreamDecoder;
    return createDecoder(options);
}