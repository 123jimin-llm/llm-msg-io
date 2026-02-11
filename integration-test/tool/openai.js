// @ts-check

/** @import {Message} from "../../dist/index.js" */

import {env, exit} from "node:process";
import {readFileSync} from "node:fs";

import {createStepEncoder, createStepDecoder, OpenAIChatCodec} from "../../dist/index.js";
import OpenAI from "openai";

const functions = JSON.parse(readFileSync(new globalThis.URL('functions.json', import.meta.url)).toString());

const api = new OpenAI({
    apiKey: env['OPENAI_API_KEY'],
});

const TEST_MODEL = "gpt-4.1-nano";

/** @param {typeof functions} fns */
function toOpenAITools(fns) {
    return fns.map((/** @type {typeof functions[number]} */ fn) => ({
        "type": /** @type {const} */ ('function'),
        "function": fn,
    }));
}

async function main() {
    /** @type {Message[]} */
    const history = [
        {role: "user", content: "What is the weather in London?"},
    ];

    const encode = createStepEncoder(OpenAIChatCodec);
    const decode = createStepDecoder(OpenAIChatCodec);

    let api_req = encode({
        functions,
        messages: history,
    });

    const api_res = await api.chat.completions.create({
        ...api_req,
        model: TEST_MODEL,
        tools: toOpenAITools(functions),
        stream: false,
    });

    globalThis.console.log(api_res.choices[0]?.message?.tool_calls);

    let res = decode(api_res);
    globalThis.console.log(res.messages[0]);
}

main().catch((err) => {
    globalThis.console.error(err);
    exit(1);
});
