/// JSON support

import type { Codec } from "../message/codec/index.ts";

export const JSONCodec = {
    createEncoder: () => (messages, metadata?) => {
        if(metadata === (void 0)) {
            return JSON.stringify(messages);
        }

        return JSON.stringify({
            metadata,
            messages,
        });
    },
    createDecoder: () => (source) => {
        return (typeof source === 'string' ? JSON.parse(source) : source) as unknown;
    },
} satisfies Codec<unknown>;