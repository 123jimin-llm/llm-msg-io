/// JSON support

import type { FileCodec } from "./type.js";

export const codec: FileCodec = {
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
            return JSON.parse(source) as unknown;
        };
    },
};