import { assert } from 'chai';
import { ChatCompletionMessage } from 'openai/resources';

import { OpenAIChatOutputCodec } from "./chat.js";

describe("OpenAIChatOutputCodec", () =>{
    it("should be able to decode simple messages", () => {
        const api_messages: ChatCompletionMessage[] = [
            {role: 'assistant', content: "", refusal: null},
            {role: 'assistant', content: "Hello, world!", refusal: null},
        ];

        const messages = OpenAIChatOutputCodec.createDecoder()(api_messages);
        assert.strictEqual(messages.length, api_messages.length);
    });
});