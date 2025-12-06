import type { FileCodec } from "../../file-codec-lib/index.ts";

import { createEncoder } from "./encoder.ts";
import { createDecoder } from "./decoder.ts";

export const STFCodec = {
    createEncoder,
    createDecoder,
} satisfies FileCodec<string>;