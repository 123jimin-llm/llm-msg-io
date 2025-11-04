import { assert } from 'chai';

import { type Message, createDecoder } from "../../message/index.js";
import { createDecoder as createSTFDecoder } from "./decoder.js";

const decoder = createDecoder(createSTFDecoder);

describe("file-codec/stf", () => {
    describe("STFCodec.createDecoder", () => {
        it("should decode a simple STF file", () => {
            const serialized = [
                ";user",
                "Hello!",
                ";assistant",
                "Hi there!",
            ].join('\n');

            const { messages } = decoder(serialized);
            assert.deepStrictEqual(messages, [
                {role: 'user', content: "Hello!"},
                {role: 'assistant', content: "Hi there!"},
            ] satisfies Message[]);
        });
    });
});