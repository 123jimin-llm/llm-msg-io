import type { Codec } from "../../message/index.js";
import { createDecoder } from "./decoder.js";

export const STFCodec = {
    createEncoder: () => () => {
        throw new Error("Not yet implemented!");
    },
    createDecoder,
} satisfies Codec<string>;