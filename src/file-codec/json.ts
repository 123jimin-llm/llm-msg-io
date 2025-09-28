/// JSON support

import type { Codec } from "../message/codec.js";

export const codec: Codec<unknown> = {
    createSerializer() {
        return (messages, metadata) => {
            if(metadata === (void 0)) {
                return JSON.stringify(messages);
            }

            return JSON.stringify({
                metadata,
                messages,
            });
        };
    },
    createDeserializer() {
        return (source) => {
            return (typeof source === 'string' ? JSON.parse(source) : source) as unknown;
        };
    },
};