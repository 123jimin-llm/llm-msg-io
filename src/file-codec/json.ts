/// JSON support

import type { FileCodec } from "./type.js";

export const codec: FileCodec = {
    serialize(messages, options) {
        return JSON.stringify(messages);
    },

    deserialize(source, options) {
        // TODO: use arktype
        return JSON.parse(source);
    },
};