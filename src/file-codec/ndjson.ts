/// ND-JSON format

import type { Codec } from "../message/codec/index.js";

type JsonObject = Record<string, unknown>;

function assertJsonObject(value: unknown): asserts value is JsonObject {
    if(value == null || typeof value !== 'object' || Array.isArray(value)) {
        throw new TypeError(`\`NDJSONCodec\` expected a JSON object on a line.`);
    }
}

export const NDJSONCodec = {
    createEncoder: () => (messages, metadata?) => {
        const lines: string[] = [];

        if(metadata) {
            lines.push(JSON.stringify({metadata}));
        }

        for(const message of messages) {
            lines.push(JSON.stringify(message));
        }

        return lines.join("\n");
    },
    createDecoder: () => (source) => {
        if(typeof source !== 'string') {
            throw new TypeError("`NDJSONCodec` expected serialized data to be a string.");
        }

        const lines = source.split("\n");
        const messages: unknown[] = [];

        let metadata: unknown;
        let metadata_parsed = false;

        for(const line of lines) {
            const trimmed = line.trim();

            if(trimmed === '') {
                continue;
            }

            const value = JSON.parse(trimmed) as unknown;
            assertJsonObject(value);

            if(!metadata_parsed && ('metadata' in value) && Object.keys(value).length === 1) {
                metadata = value.metadata;
                metadata_parsed = true;
                continue;
            }

            metadata_parsed = true;
            messages.push(value);
        }

        if(metadata) {
            return {metadata, messages};
        }

        return {messages};
    },
} satisfies Codec<string>;