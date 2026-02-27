import {assert} from 'chai';

import {type Message} from "../../message/index.ts";
import {createDecoder} from '../../file-codec-lib/index.ts';
import {createDecoder as createSTFDecoder} from "./decoder.ts";

const decoder = createDecoder(createSTFDecoder);

describe("file-codec/stf", () => {
    describe("STFCodec.createDecoder", () => {
        context("basics", () => {
            it("should decode a simple STF file", () => {
                const serialized = [
                    ";user",
                    "Hello!",
                    ";assistant",
                    "Hi there!",
                ].join('\n');

                const {messages} = decoder(serialized);
                assert.deepStrictEqual(messages, [
                    {role: 'user', content: "Hello!"},
                    {role: 'assistant', content: "Hi there!"},
                ] satisfies Message[]);
            });

            it("should decode a simple STF file involving nunjucks", () => {
                const serialized = [
                    ";developer",
                    "{{ prompt.game }}",
                    ";user",
                    "{{ prompt.scenario }}",
                ].join('\n');

                const {messages} = decoder(serialized);
                assert.deepStrictEqual(messages, [
                    {role: 'developer', content: "{{ prompt.game }}"},
                    {role: 'user', content: "{{ prompt.scenario }}"},
                ] satisfies Message[]);
            });

            it("should handle multiline content", () => {
                const serialized = [
                    ";user",
                    "Line 1",
                    "Line 2",
                    "Line 3",
                ].join('\n');

                const {messages} = decoder(serialized);
                assert.deepStrictEqual(messages, [
                    {role: 'user', content: "Line 1\nLine 2\nLine 3"},
                ] satisfies Message[]);
            });

            it("should handle content with a trailing newline", () => {
                const serialized = [
                    ";user",
                    "Hello",
                    "",
                ].join('\n');

                const {messages} = decoder(serialized);
                assert.deepStrictEqual(messages, [
                    {role: 'user', content: "Hello\n"},
                ] satisfies Message[]);
            });

            it("should handle content with blank lines", () => {
                const serialized = [
                    ";user",
                    "Line 1",
                    "",
                    "Line 3",
                ].join('\n');
                const {messages} = decoder(serialized);
                assert.deepStrictEqual(messages, [
                    {role: 'user', content: "Line 1\n\nLine 3"},
                ]);
            });

            it("should ignore leading and trailing blank data lines when message state is nil", () => {
                const serialized = [
                    "",
                    "  ",
                    "\t",
                    ";user",
                    "Hello!",
                    ";assistant",
                    "Hi there!",
                    "  ",
                    "",
                ].join('\n');
                const {messages} = decoder(serialized);
                assert.deepStrictEqual(messages, [
                    {role: 'user', content: "Hello!"},
                    {role: 'assistant', content: "Hi there!\n  \n"},
                ]);
            });

            it("should decode an empty STF file as an empty array", () => {
                for(const serialized of ["", " ", "\t", "\n", " \n "]) {
                    assert.deepStrictEqual(decoder(serialized), {messages: []});
                }
            });

            it("should treat lines with leading blanks before ';' as data lines", () => {
                const serialized = [
                    ";user",
                    " ; this is not a command",
                ].join('\n');

                const {messages} = decoder(serialized);
                assert.deepStrictEqual(messages, [
                    {role: 'user', content: " ; this is not a command"},
                ] satisfies Message[]);
            });

            it("should handle escaped data lines", () => {
                const serialized = [
                    ";user",
                    ";;this is not a command",
                ].join('\n');

                const {messages} = decoder(serialized);
                assert.deepStrictEqual(messages, [
                    {role: 'user', content: ";this is not a command"},
                ] satisfies Message[]);
            });

            it("should use default_role for initial data lines", () => {
                const serialized = "Hello, world!";
                const {messages} = createDecoder(createSTFDecoder, {default_role: 'user'})(serialized);
                assert.deepStrictEqual(messages, [
                    {role: 'user', content: "Hello, world!"},
                ] satisfies Message[]);
            });
        });

        context("comments", () => {
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

                const {messages} = decoder(serialized);
                assert.deepStrictEqual(messages, [
                    {role: 'user', content: "Hello"},
                    {role: 'assistant', content: "Hi"},
                    {role: 'developer', content: "Howdy"},
                ] satisfies Message[]);
            });

            it("should handle nested block comments", () => {
                const serialized = [
                    ";user",
                    ";/* start level 1",
                    "this should be ignored",
                    ";/* start level 2",
                    "this should also be ignored",
                    ";*/ end level 2",
                    "still ignored",
                    ";*/ end level 1",
                    "Hello!",
                ].join('\n');

                const {messages} = decoder(serialized);
                assert.deepStrictEqual(messages, [
                    {role: 'user', content: "Hello!"},
                ] satisfies Message[]);
            });
        });

        context("message arguments", () => {
            it("should handle key-value arguments for commands", () => {
                const serialized = ";msg role=user name=\"John Doe\" id=123";
                const {messages} = decoder(serialized);
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
                const {messages} = decoder(serialized);
                assert.deepStrictEqual(messages, [
                    {
                        role: 'user',
                        name: 'John Doe',
                        id: '456',
                        content: "",
                    },
                ] satisfies Message[]);
            });

            it("should decode call_id on a tool role command", () => {
                const serialized = ";tool call_id=abc123";
                const {messages} = decoder(serialized);
                assert.deepStrictEqual(messages, [
                    {
                        role: 'tool',
                        call_id: 'abc123',
                        content: "",
                    },
                ] satisfies Message[]);
            });

            it("should decode call_id on a msg command", () => {
                const serialized = ";msg role=tool call_id=abc123 id=msg1";
                const {messages} = decoder(serialized);
                assert.deepStrictEqual(messages, [
                    {
                        role: 'tool',
                        call_id: 'abc123',
                        id: 'msg1',
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

            it("should throw an error for invalid key-value argument syntax", () => {
                assert.throws(() => decoder(";msg =user"));
                assert.throws(() => decoder(";msg 'role=user'"));
            });

            it("should throw an error for an unexpected 'end' command", () => {
                assert.throws(() => decoder(";end"));
            });
        });
    });
});
