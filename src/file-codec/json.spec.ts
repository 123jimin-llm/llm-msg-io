import { assert } from 'chai';
import { JSONCodec } from "./json.js"

import { type Message, asDeserializedData } from "../index.js";

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
    describe("createSerializer()", function() {
        it("serializes a message array into JSON text", function() {
            const result = JSONCodec.createSerializer()(messages);
            assert.deepStrictEqual(JSON.parse(result), messages);
        });

        it("serializes metadata when provided", function() {
            const metadata = {foo: "bar"};
            const result = JSONCodec.createSerializer()(messages, metadata);
            assert.deepStrictEqual(JSON.parse(result), {metadata, messages});
        });
    });
    
    describe("createDeserializer()", function() {
        it("deserializes JSON text into messages", function() {
            const serialized = JSON.stringify(messages);
            const {messages: result, metadata} = asDeserializedData(JSONCodec.createDeserializer()(serialized));

            assert.isUndefined(metadata);
            assert.deepStrictEqual(result, messages);
        });
        
        it("deserializes JSON text with metadata", function() {
            const metadata = {foo: "bar"};
            const serialized = JSON.stringify({metadata, messages});
            const {messages: result, metadata: result_metadata} = asDeserializedData(JSONCodec.createDeserializer()(serialized));

            assert.deepStrictEqual(result, messages);
            assert.deepStrictEqual(result_metadata, metadata);
        });
    });
});