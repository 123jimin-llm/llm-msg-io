import type { Codec } from "../../message/codec/index.js";

import { createEncoder } from "./encoder.js";
import { createDecoder } from "./decoder.js";

export const STFCodec = {
    createEncoder,
    createDecoder,
} satisfies Codec<string>;