// @ts-check

/** @import {Message} from "../../dist/index.js" */

import {env, exit} from "node:process";
import {readFileSync} from "node:fs";

import {createStepEncoder, createStepDecoder, ClaudeMessagesCodec} from "../../dist/index.js";
import Anthropic from "@anthropic-ai/sdk";

const functions = JSON.parse(readFileSync(new globalThis.URL('functions.json', import.meta.url)).toString());

const api = new Anthropic({
    apiKey: env['ANTHROPIC_API_KEY'],
});

const TEST_MODEL = "claude-haiku-4-5-20251001";

async function main() {
    /** @type {Message[]} */
    const history = [
        {role: "user", content: "What is the weather in London?"},
    ];

    const encode = createStepEncoder(ClaudeMessagesCodec);
    const decode = createStepDecoder(ClaudeMessagesCodec);

    let api_req = encode({
        functions,
        messages: history,
    });

    const api_res = await api.messages.create({
        ...api_req,
        model: TEST_MODEL,
    });

    globalThis.console.log("Content blocks:", api_res.content);

    let res = decode(api_res);
    globalThis.console.log("Decoded message:", res.messages[0]);
}

main().catch((err) => {
    globalThis.console.error(err);
    exit(1);
});
