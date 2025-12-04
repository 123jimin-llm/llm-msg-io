import type { Codec } from "../../message/codec/index.ts";

import { createEncoder } from "./encoder.ts";
import { createDecoder } from "./decoder.ts";

export const STFCodec = {
    createEncoder,
    createDecoder,
} satisfies Codec<string>;