import {assert} from 'chai';

import {type Message} from "../../message/index.ts";
import {createDecoder} from '../../file-codec-lib/index.ts';
import {createDecoder as createSTFDecoder} from "./decoder.ts";

const decoder = createDecoder(createSTFDecoder);

describe("file-codec/stf", () => {
    describe("STFCodec.createDecoder", () => {
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
    });
});
