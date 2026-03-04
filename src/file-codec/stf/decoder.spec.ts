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
