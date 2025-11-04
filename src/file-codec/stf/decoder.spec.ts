import { assert } from 'chai';

import { type Message, createDecoder } from "../../message/index.js";
import { createDecoder as createSTFDecoder } from "./decoder.js";

const decoder = createDecoder(createSTFDecoder);

describe("file-codec/stf", () => {
    describe("STFCodec.createDecoder", () => {
        it("should decode an empty STF file as an empty array", () => {
            for(const serialized of ["", " ", "\t", "\n", " \n "]) {
                assert.deepStrictEqual(decoder(serialized), { messages: []});
            }
        });

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

        it("should decode messages with attributes and escaped data lines", () => {
            const serialized = [
                "",
                ";msg role=user name=\"Jane Doe\" id='123'",
                "Hello,",
                ";;Important notice",
                "",
            ].join('\n');

            const { messages } = decoder(serialized);
            assert.deepStrictEqual(messages, [
                {
                    role: 'user',
                    name: 'Jane Doe',
                    id: '123',
                    content: "Hello,\n;Important notice\n",
                },
            ] satisfies Message[]);
        });

        it("should ignore line and block comments", () => {
            const serialized = [
                ";# this is a comment",
                ";/* block comment start",
                ";developer",
                ";*/",
                ";user",
                "Hello",
                ";assistant",
                "; // comment ignored",
                "Hi",
                ";developer",
                "Howdy",
            ].join('\n');

            const { messages } = decoder(serialized);
            assert.deepStrictEqual(messages, [
                {role: 'user', content: "Hello"},
                {role: 'assistant', content: "Hi"},
                {role: 'developer', content: "Howdy"},
            ] satisfies Message[]);
        });
    });
});