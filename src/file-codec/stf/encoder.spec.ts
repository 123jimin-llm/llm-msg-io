import {assert} from 'chai';

import {createDecoder, createEncoder} from '../../file-codec-lib/index.ts';
import {type Message} from "../../message/index.ts";
import {createDecoder as createSTFDecoder} from "./decoder.ts";
import {createEncoder as createSTFEncoder} from "./encoder.ts";

const decoder = createDecoder(createSTFDecoder);
const encoder = createEncoder(createSTFEncoder);
const encoderNoExtra = createEncoder(createSTFEncoder, {extra: false});
const encoderNoMeta = createEncoder(createSTFEncoder, {metadata: false});

describe("file-codec/stf", () => {
    describe("STFCodec.createEncoder", () => {
        it("should round-trip a message with call_id", () => {
            const original: Message[] = [
                {role: 'tool', call_id: 'call_42', content: "result"},
            ];
            const encoded = encoder(original);
            const {messages} = decoder(encoded);
            assert.deepStrictEqual(messages, original);
        });

        it("should round-trip a message with extra", () => {
            const original: Message[] = [
                {
                    role: 'assistant',
                    content: "Hello!",
                    extra: {model: 'gpt-4o', temperature: 0.7},
                },
            ];
            const encoded = encoder(original);
            const {messages} = decoder(encoded);
            assert.deepStrictEqual(messages, original);
        });

        it("should drop extra when option extra=false", () => {
            const original: Message[] = [
                {
                    role: 'assistant',
                    content: "Hello!",
                    extra: {model: 'gpt-4o'},
                },
            ];
            const encoded = encoderNoExtra(original);
            assert.notInclude(encoded, ';extra');
            const {messages} = decoder(encoded);
            assert.deepStrictEqual(messages, [
                {role: 'assistant', content: "Hello!"},
            ] satisfies Message[]);
        });

        it("should round-trip metadata", () => {
            const messages: Message[] = [
                {role: 'user', content: "Hello!"},
            ];
            const metadata = {title: 'Test', version: 2};
            const encoded = encoder(messages, metadata);
            const result = decoder(encoded);
            assert.deepStrictEqual(result.metadata, metadata);
            assert.deepStrictEqual(result.messages, messages);
        });

        it("should not emit meta block when no metadata is provided", () => {
            const messages: Message[] = [
                {role: 'user', content: "Hello!"},
            ];
            const encoded = encoder(messages);
            assert.notInclude(encoded, ';meta');
        });

        it("should drop metadata when option metadata=false", () => {
            const messages: Message[] = [
                {role: 'user', content: "Hello!"},
            ];
            const encoded = encoderNoMeta(messages, {title: 'Ignored'});
            assert.notInclude(encoded, ';meta');
            const result = decoder(encoded);
            assert.notProperty(result, 'metadata');
        });
    });
});
