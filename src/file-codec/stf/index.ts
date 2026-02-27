import type {FileCodec} from "../../file-codec-lib/index.ts";

import {createEncoder, type STFEncoderOptions} from "./encoder.ts";
export type {STFEncoderOptions} from "./encoder.ts";
export {escapeStfLine, escapeStfContent} from "./encoder.ts";
import {createDecoder} from "./decoder.ts";
export type {STFDecoderOptions} from "./decoder.ts";

export const STFCodec = {
    createEncoder,
    createDecoder,
} satisfies FileCodec<string, STFEncoderOptions>;
