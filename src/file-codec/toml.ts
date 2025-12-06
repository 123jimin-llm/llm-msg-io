/// TOML support

import { parse, stringify } from 'smol-toml';

import type { FileCodec } from "../file-codec-lib/index.ts";

export const TOMLCodec = {
    createEncoder: () => (messages, metadata?) => {
        return stringify({
            metadata,
            messages,
        });
    },
    createDecoder: () => (source) => {
        if(typeof source !== 'string') {
            throw new TypeError("`TOMLCodec` expected serialized data to be a string.");
        }

        return parse(source) as unknown;
    },
} satisfies FileCodec<unknown>;

