/// JSON support

import type {FileCodec} from "../file-codec-lib/index.ts";

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
} satisfies FileCodec<unknown>;
