export * from "./encoder.ts";
export * from "./decoder.ts";
export * from "./stream-decoder.ts";

import type { WithCreateEncoder } from "./encoder.ts";
import type { WithCreateDecoder } from "./decoder.ts";

/** An object that provides both an encoder and a decoder. */
export type Codec<EncodedType=string, EncodeOptions extends object=object, DecodeOptions extends object=object, MetadataType=unknown>
    = WithCreateEncoder<EncodedType, EncodeOptions, MetadataType>
    & WithCreateDecoder<EncodedType, DecodeOptions>;
