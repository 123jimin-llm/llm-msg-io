// @ts-check

/** @import {Message, StepResult} from "../../dist/index.js" */

import {assert} from 'chai';
import {env, exit} from "node:process";

import {createStepEncoder, createStepDecoder, OpenAIChatCodec} from "../../dist/index.js";
import OpenAI from "openai";

const api = new OpenAI({
    apiKey: env['OPENAI_API_KEY'],
});

const TEST_MODEL = "gpt-4.1-nano";

/**
 * @param {StepResult} res
 * @param {RegExp} match
 */
function check(res, match) {
    assert.equal(res.messages.length, 1);
    assert.equal(res.messages[0].role, "assistant");
    assert.typeOf(res.messages[0].content, "string");
    assert.match(/** @type{string} */ (res.messages[0].content), match);
}

async function main() {
    /** @type {Message[]} */
    const history = [
        {role: "developer", content: "All responses must adhere to the following format: `The answer? It is ...`"},
        {role: "user", content: "Let a = 3 and b = 4. What is a times b?"},
    ];

    const encode = createStepEncoder(OpenAIChatCodec);
    const decode = createStepDecoder(OpenAIChatCodec);

    let api_req = encode({messages: history});
    let res = decode(await api.chat.completions.create({
        ...api_req,
        model: TEST_MODEL,
        stream: false,
    }));

    check(res, /^The answer\? It is\D*12\D*$/);

    history.push(
        ...res.messages,
        {role: "user", content: "Answer again, but this time, a = 7."},
    );

    api_req = encode({messages: history});
    res = decode(await api.chat.completions.create({
        ...api_req,
        model: TEST_MODEL,
        stream: false,
    }));

    check(res, /^The answer\? It is\D*28\D*$/);

    globalThis.console.log(res);
}

main().catch((err) => {
    globalThis.console.error(err);
    exit(1);
});
