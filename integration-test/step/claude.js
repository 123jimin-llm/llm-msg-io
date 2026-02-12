// @ts-check

/** @import {Message, StepResult} from "../../dist/index.js" */

import {assert} from 'chai';
import {env, exit} from "node:process";

import {createStepEncoder, createStepDecoder, ClaudeMessagesCodec} from "../../dist/index.js";
import Anthropic from "@anthropic-ai/sdk";

const api = new Anthropic({
    apiKey: env['ANTHROPIC_API_KEY'],
});

const TEST_MODEL = "claude-haiku-4-5-20251001";

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

    const encode = createStepEncoder(ClaudeMessagesCodec);
    const decode = createStepDecoder(ClaudeMessagesCodec);

    let api_req = encode({messages: history});
    let res = decode(await api.messages.create({
        ...api_req,
        model: TEST_MODEL,
    }));

    check(res, /^The answer\? It is\D*12\D*$/);

    history.push(
        ...res.messages,
        {role: "user", content: "Answer again, but this time, a = 7."},
    );

    api_req = encode({messages: history});
    res = decode(await api.messages.create({
        ...api_req,
        model: TEST_MODEL,
    }));

    check(res, /^The answer\? It is\D*28\D*$/);

    globalThis.console.log(res);
}

main().catch((err) => {
    globalThis.console.error(err);
    exit(1);
});
