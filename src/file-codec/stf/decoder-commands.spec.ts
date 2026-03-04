import {assert} from 'chai';

import {type Message} from "../../message/index.ts";
import {createDecoder} from '../../file-codec-lib/index.ts';
import {createDecoder as createSTFDecoder} from "./decoder.ts";

const decoder = createDecoder(createSTFDecoder);

describe("file-codec/stf", () => {
    describe("STFCodec.createDecoder", () => {
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

                const {messages} = decoder(serialized);
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
                const {messages} = decoder(serialized);
                assert.deepStrictEqual(messages, [
                    {
                        role: 'user',
                        content: "raw content",
                    },
                ] satisfies Message[]);
            });
        });

        context("field commands", () => {
            it("should decode an extra block with a JSON5 object", () => {
                const serialized = [
                    ";ai",
                    "Hello!",
                    ";extra",
                    "{",
                    "  model: 'gpt-4o',",
                    "  usage: {prompt_tokens: 10, completion_tokens: 3},",
                    "}",
                    ";end",
                ].join('\n');

                const {messages} = decoder(serialized);
                assert.deepStrictEqual(messages, [
                    {
                        role: 'assistant',
                        content: "Hello!",
                        extra: {
                            model: 'gpt-4o',
                            usage: {prompt_tokens: 10, completion_tokens: 3},
                        },
                    },
                ] satisfies Message[]);
            });

            it("should shallow-merge multiple extra blocks", () => {
                const serialized = [
                    ";user",
                    "Hi",
                    ";extra",
                    "{a: 1, b: 2}",
                    ";end",
                    ";extra",
                    "{b: 99, c: 3}",
                    ";end",
                ].join('\n');

                const {messages} = decoder(serialized);
                assert.deepStrictEqual(messages, [
                    {
                        role: 'user',
                        content: "Hi",
                        extra: {a: 1, b: 99, c: 3},
                    },
                ] satisfies Message[]);
            });

            it("should replace non-object extra with a new value", () => {
                const serialized = [
                    ";user",
                    "Hi",
                    ";extra",
                    "42",
                    ";end",
                ].join('\n');

                const {messages} = decoder(serialized);
                assert.deepStrictEqual(messages, [
                    {
                        role: 'user',
                        content: "Hi",
                        extra: 42,
                    },
                ] satisfies Message[]);
            });

            it("should decode extra on an empty-content message", () => {
                const serialized = [
                    ";ai",
                    ";extra",
                    "{stop_reason: 'length'}",
                    ";end",
                ].join('\n');

                const {messages} = decoder(serialized);
                assert.deepStrictEqual(messages, [
                    {
                        role: 'assistant',
                        content: "",
                        extra: {stop_reason: 'length'},
                    },
                ] satisfies Message[]);
            });

            it("should throw when extra is used without an active message", () => {
                const serialized = [
                    ";extra",
                    "{foo: 1}",
                    ";end",
                ].join('\n');
                assert.throws(() => decoder(serialized), /requires an active message/);
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
                const {messages} = decoder(serialized);
                assert.deepStrictEqual(messages, [
                    {role: 'user', content: 'Hello!'},
                    {role: 'assistant', content: 'Hi!'},
                ]);
            });
        });
    });
});
