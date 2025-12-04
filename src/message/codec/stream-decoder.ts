import type { LLMStream } from "../stream/index.ts";

/** Converts an API stream type into a stream object. */
export type StreamDecoder<StreamType> = (stream: StreamType) => LLMStream;

/** A function that returns a stream decoder. */
export type CodecStreamDecoder<StreamType, DecodeOptions extends object=object> = (options?: Partial<DecodeOptions>) => StreamDecoder<StreamType>;

/** An object that provides a stream decoder. */
export interface WithCreateStreamDecoder<StreamType, DecodeOption extends object=object> {
    createStreamDecoder: CodecStreamDecoder<StreamType, DecodeOption>;
}