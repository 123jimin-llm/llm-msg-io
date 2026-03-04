import {assert} from 'chai';

import {type Message} from "../../message/index.ts";
import {createDecoder} from '../../file-codec-lib/index.ts';
import {createDecoder as createSTFDecoder} from "./decoder.ts";

const decoder = createDecoder(createSTFDecoder);

describe("file-codec/stf", () => {
    describe("STFCodec.createDecoder", () => {
        context("metadata", () => {
            it("should decode a meta block", () => {
                const serialized = [
                    ";meta",
                    "{title: 'My Chat', created: '2025-01-15'}",
                    ";end",
                    ";user",
                    "Hello!",
                ].join('\n');

                const {messages, metadata} = decoder(serialized);
                assert.deepStrictEqual(metadata, {title: 'My Chat', created: '2025-01-15'});
                assert.deepStrictEqual(messages, [
                    {role: 'user', content: "Hello!"},
                ] satisfies Message[]);
            });

            it("should return no metadata key when meta is absent", () => {
                const serialized = [
                    ";user",
                    "Hello!",
                ].join('\n');

                const result = decoder(serialized);
                assert.notProperty(result, 'metadata');
            });

            it("should shallow-merge multiple meta blocks", () => {
                const serialized = [
                    ";meta",
                    "{a: 1, b: 2}",
                    ";end",
                    ";user",
                    "Hi",
                    ";meta",
                    "{b: 99, c: 3}",
                    ";end",
                ].join('\n');

                const {metadata} = decoder(serialized);
                assert.deepStrictEqual(metadata, {a: 1, b: 99, c: 3});
            });

            it("should replace non-object metadata with a new value", () => {
                const serialized = [
                    ";meta",
                    "42",
                    ";end",
                    ";user",
                    "Hi",
                ].join('\n');

                const {metadata} = decoder(serialized);
                assert.strictEqual(metadata, 42);
            });

            it("should allow meta after messages", () => {
                const serialized = [
                    ";user",
                    "Hello!",
                    ";meta",
                    "{model: 'gpt-4o'}",
                    ";end",
                ].join('\n');

                const {messages, metadata} = decoder(serialized);
                assert.deepStrictEqual(metadata, {model: 'gpt-4o'});
                assert.deepStrictEqual(messages, [
                    {role: 'user', content: "Hello!"},
                ] satisfies Message[]);
            });
        });
    });
});
