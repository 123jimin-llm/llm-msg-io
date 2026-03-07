export * from "./decoder.ts";
export * from "./encoder.ts";

import type {WithCreateDecoder} from "./decoder.ts";
import type {WithCreateEncoder} from "./encoder.ts";

/** An object that provides both an encoder and a decoder. */
export type FileCodec<
    EncodedType = string,
    EncodeOptions extends object = object,
    DecodeOptions extends object = object,
    MetadataType = unknown,
> =
    WithCreateEncoder<EncodedType, EncodeOptions, MetadataType>
    & WithCreateDecoder<EncodedType, DecodeOptions>;
