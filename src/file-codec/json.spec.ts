import { assert } from 'chai';
import { JSONCodec } from "./json.js"

import { type Message, asDecodedData } from "../index.js";

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

describe("JSONCodec", function() {
    describe("createEncoder()", function() {
        it("encodes a message array into JSON text", function() {
            const result = JSONCodec.createEncoder()(messages);
            assert.deepStrictEqual(JSON.parse(result), messages);
        });

        it("encodes metadata when provided", function() {
            const metadata = {foo: "bar"};
            const result = JSONCodec.createEncoder()(messages, metadata);
            assert.deepStrictEqual(JSON.parse(result), {metadata, messages});
        });
    });
    
    describe("createDecoder()", function() {
        it("decodes JSON text into messages", function() {
            const serialized = JSON.stringify(messages);
            const {messages: result, metadata} = asDecodedData(JSONCodec.createDecoder()(serialized));

            assert.isUndefined(metadata);
            assert.deepStrictEqual(result, messages);
        });
        
        it("decodes JSON text with metadata", function() {
            const metadata = {foo: "bar"};
            const serialized = JSON.stringify({metadata, messages});
            const {messages: result, metadata: result_metadata} = asDecodedData(JSONCodec.createDecoder()(serialized));

            assert.deepStrictEqual(result, messages);
            assert.deepStrictEqual(result_metadata, metadata);
        });
    });
});