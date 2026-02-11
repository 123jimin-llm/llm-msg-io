import {assert} from 'chai';

import {NDJSONCodec} from "./ndjson.ts";
import {type Message, asDecodedData} from "../index.ts";

const messages: Message[] = [
    {
        role: 'user',
        content: 'Hello, world!',
    },
    {
        role: 'assistant',
        content: 'Hi there!',
    },
];

describe("NDJSONCodec", () => {
    describe("createEncoder()", () => {
        it("encodes a message array into NDJSON text", () => {
            const result = NDJSONCodec.createEncoder()(messages);
            const expected = messages.map((message) => JSON.stringify(message)).join("\n");

            assert.strictEqual(result, expected);
        });

        it("encodes metadata on the first line when provided", () => {
            const metadata = {foo: "bar"};
            const result = NDJSONCodec.createEncoder()(messages, metadata);
            const expected = [JSON.stringify({metadata}), ...messages.map((message) => JSON.stringify(message))];

            assert.strictEqual(result, expected.join("\n"));
        });
    });

    describe("createDecoder()", () => {
        it("decodes NDJSON text into messages", () => {
            const serialized = messages.map((message) => JSON.stringify(message)).join("\n");
            const {messages: result, metadata} = asDecodedData(NDJSONCodec.createDecoder()(serialized));

            assert.isUndefined(metadata);
            assert.deepStrictEqual(result, messages);
        });

        it("decodes NDJSON text with metadata", () => {
            const metadata = {foo: "bar"};
            const lines = [JSON.stringify({metadata}), ...messages.map((message) => JSON.stringify(message))];
            const serialized = lines.join("\n");
            const {messages: result, metadata: result_metadata} = asDecodedData(NDJSONCodec.createDecoder()(serialized));

            assert.deepStrictEqual(result, messages);
            assert.deepStrictEqual(result_metadata, metadata);
        });

        it("ignores empty lines", () => {
            const serialized = `\n${JSON.stringify(messages[0])}\n\n${JSON.stringify(messages[1])}\n`;
            const {messages: result, metadata} = asDecodedData(NDJSONCodec.createDecoder()(serialized));

            assert.isUndefined(metadata);
            assert.deepStrictEqual(result, messages);
        });
    });
});
