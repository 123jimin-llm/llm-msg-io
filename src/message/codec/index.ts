export * from "./encoder.js";
export * from "./decoder.js";
export * from "./stream-decoder.js";

import type { WithCreateEncoder } from "./encoder.js";
import type { WithCreateDecoder } from "./decoder.js";

/** An object that provides both an encoder and a decoder. */
export type Codec<EncodedType=string, EncodeOptions extends object=object, DecodeOptions extends object=object, MetadataType=unknown>
    = WithCreateEncoder<EncodedType, EncodeOptions, MetadataType>
    & WithCreateDecoder<EncodedType, DecodeOptions>;
