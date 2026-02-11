import {assert} from 'chai';

import {Message, MessageArray} from "./message.ts";

describe("Message", () => {
    it("should assert valid messages", () => {
        const valid_messages: unknown[] = [
            {role: 'user', content: "Hello, world!"},
            {role: 'assistant', content: [{type: 'text', text: "Hello!"}]},
        ];
        for(const msg of valid_messages) {
            assert.doesNotThrow(() => Message.assert(msg));
        }
    });

    it("should allow optional fields set to undefined", () => {
        const msg: Record<string, string> = {role: 'assistant', content: "Hello!"};

        for(const field of ['id', 'name', 'reasoning', 'tool_calls']) {
            const msg_with_undefined: unknown = {...msg, [field]: (void 0)};
            assert.doesNotThrow(() => Message.assert(msg_with_undefined));
        }
    });

    it("should allow custom roles", () => {
        const msg = {role: 'custom_role', content: "Hello!"};
        assert.doesNotThrow(() => Message.assert(msg));
    });
});

describe("MessageArray", () => {
    it("should allow optional fields set to undefined", () => {
        const msg: Record<string, string> = {role: 'assistant', content: "Hello!"};

        for(const field of ['id', 'name', 'reasoning', 'tool_calls']) {
            const msg_with_undefined: unknown = {...msg, [field]: (void 0)};
            assert.doesNotThrow(() => MessageArray.assert([msg_with_undefined]));
        }
    });
});
