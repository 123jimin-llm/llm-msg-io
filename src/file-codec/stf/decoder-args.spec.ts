import {assert} from 'chai';

import {type Message} from "../../message/index.ts";
import {createDecoder} from '../../file-codec-lib/index.ts';
import {createDecoder as createSTFDecoder} from "./decoder.ts";

const decoder = createDecoder(createSTFDecoder);

describe("file-codec/stf", () => {
    describe("STFCodec.createDecoder", () => {
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
    });
});
