/// JSON support

import type { Codec } from "../message/codec.js";

export const JSONCodec = {
    createSerializer: () => (messages, metadata?) => {
        if(metadata === (void 0)) {
            return JSON.stringify(messages);
        }

        return JSON.stringify({
            metadata,
            messages,
        });
    },
    createDeserializer: () => (source) => {
        return (typeof source === 'string' ? JSON.parse(source) : source) as unknown;
    },
} satisfies Codec<unknown>;