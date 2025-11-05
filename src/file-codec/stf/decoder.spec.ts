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

        context("line handling", () => {
            it("should decode an empty STF file as an empty array", () => {
                for(const serialized of ["", " ", "\t", "\n", " \n "]) {
                    assert.deepStrictEqual(decoder(serialized), { messages: []});
                }
            });

            it("should treat lines with leading blanks before ';' as data lines", () => {
                const serialized = [
                    ";user",
                    " ; this is not a command",
                ].join('\n');

                const { messages } = decoder(serialized);
                assert.deepStrictEqual(messages, [
                    {role: 'user', content: " ; this is not a command"},
                ] satisfies Message[]);
            });

            it("should handle escaped data lines", () => {
                const serialized = [
                    ";user",
                    ";;this is not a command",
                ].join('\n');

                const { messages } = decoder(serialized);
                assert.deepStrictEqual(messages, [
                    {role: 'user', content: ";this is not a command"},
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

        context("message arguments", () => {
            it("should handle key-value arguments for commands", () => {
                const serialized = ";msg role=user name=\"John Doe\" id=123";
                const { messages } = decoder(serialized);
                assert.deepStrictEqual(messages, [
                    {
                        role: 'user',
                        name: 'John Doe',
                        id: '123',
                        content: "",
                    },
                ] satisfies Message[]);
            });

            it("should handle JSON5 arguments for commands", () => {
                const serialized = ";msg {role: 'user', name: 'John Doe', id: '456'}";
                const { messages } = decoder(serialized);
                assert.deepStrictEqual(messages, [
                    {
                        role: 'user',
                        name: 'John Doe',
                        id: '456',
                        content: "",
                    },
                ] satisfies Message[]);
            });
        });
        
        context("message commands", () => {
            it("should decode role-specific commands and role inheritance", () => {
                const serialized = [
                    ";system",
                    "You are a helpful assistant.",
                    ";user",
                    "Hello!",
                    ";msg",
                    "Hello again!",
                    ";dev",
                    "Developer message.",
                    ";tool",
                    "Tool message.",
                ].join('\n');

                const { messages } = decoder(serialized);
                assert.deepStrictEqual(messages, [
                    {role: 'system', content: "You are a helpful assistant."},
                    {role: 'user', content: "Hello!"},
                    {role: 'user', content: "Hello again!"},
                    {role: 'developer', content: "Developer message."},
                    {role: 'tool', content: "Tool message."},
                ] satisfies Message[]);
            });

            it("should decode a 'raw' message", () => {
                const serialized = [
                    ";raw",
                    "{",
                    "  role: 'user',",
                    "  content: 'raw content',",
                    "}",
                    ";end",
                ].join('\n');
                const { messages } = decoder(serialized);
                assert.deepStrictEqual(messages, [
                    {
                        role: 'user',
                        content: "raw content",
                    },
                ] satisfies Message[]);
            });
        });

        context("misc commands", () => {
            it("should handle the 'flush' command", () => {
                const serialized = [
                    ";user",
                    "Hello!",
                    ";flush",
                    "   ",
                    ";assistant",
                    "Hi!",
                ].join('\n');
                const { messages } = decoder(serialized);
                assert.deepStrictEqual(messages, [
                    {role: 'user', content: 'Hello!'},
                    {role: 'assistant', content: 'Hi!'},
                ]);
            });
        })

        context("error handling", () => {
            it("should throw an error for data lines without a message", () => {
                const serialized = "some content";
                assert.throws(() => decoder(serialized));
            });
    
            it("should throw an error for unmatched block comments", () => {
                assert.throws(() => decoder(";/* this is an unterminated block comment"));
                assert.throws(() => decoder(";*/ this is a closing block comment without an opening one"));
            });

            it("should throw an error for using role inheritance without a previous message", () => {
                assert.throws(() => decoder(";msg"));
            });

            it("should throw an error for an unexpected 'end' command", () => {
                assert.throws(() => decoder(";end"));
            });
        });
    });
});