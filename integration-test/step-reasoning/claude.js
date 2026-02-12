// @ts-check

/** @import {Message} from "../../dist/index.js" */

import {env, exit} from "node:process";

import {createStepEncoder, createStepDecoder, ClaudeMessagesCodec, getMessageExtraClaude} from "../../dist/index.js";
import Anthropic from "@anthropic-ai/sdk";

const api = new Anthropic({
    apiKey: env['ANTHROPIC_API_KEY'],
});

const TEST_MODEL = "claude-sonnet-4-5-20250929";

async function main() {
    /** @type {Message[]} */
    const history = [
        {role: "developer", content: "All responses must adhere to the following format: `The answer? It is ...`"},
        {role: "user", content: "Let a = 5328 and b = 6434. What is a times b?"},
    ];

    const encode = createStepEncoder(ClaudeMessagesCodec);
    const decode = createStepDecoder(ClaudeMessagesCodec);

    let api_req = encode({messages: history});
    const api_res = await api.messages.create({
        ...api_req,
        model: TEST_MODEL,
        thinking: {
            type: 'enabled',
            budget_tokens: 8000,
        },
        max_tokens: 16000,
    });

    let res = decode(api_res);

    globalThis.console.log("Content blocks:", api_res.content);
    globalThis.console.log("Decoded:", res);
    globalThis.console.log("Reasoning:", res.messages[0]?.reasoning);

    const extra = getMessageExtraClaude(res.messages[0]);
    globalThis.console.log("Thinking blocks:", extra?.thinking_blocks?.length);
}

main().catch((err) => {
    globalThis.console.error(err);
    exit(1);
});
