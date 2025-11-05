import type { Codec } from "../../message/index.js";

import { createEncoder } from "./encoder.js";
import { createDecoder } from "./decoder.js";

export const STFCodec = {
    createEncoder,
    createDecoder,
} satisfies Codec<string>;