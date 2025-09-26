import { assert } from 'chai';
import { codec as JSONCodec } from "./json.js"
import type { Message } from "../index.js";

describe("JSONCodec", function() {
    describe("createSerializer()", function() {
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

        it("serializes a message array into JSON text", function() {
            const result = JSONCodec.createSerializer()(messages);
            assert.strictEqual(result, JSON.stringify(messages));
        });
    });
    
    describe("createDeserializer()", function() {});
});