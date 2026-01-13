/* eslint-env node */
//@ts-check

/** @import {Message, StepResult} from "../../dist/index.js" */

import { assert } from 'chai';
import { env, exit } from "node:process";

import { createStepEncoder, createStepDecoder, GeminiGenerateContentCodec, getMessageExtraGemini } from "../../dist/index.js";
import { GoogleGenAI } from "@google/genai";
import { ThinkingLevel } from '@google/genai';

const api = new GoogleGenAI({
    apiKey: env['GEMINI_API_KEY'],
});

const TEST_MODEL = "gemini-2.5-flash";

/**
 * @param {StepResult} res 
 * @param {RegExp} match
 */
function check(res, match) {
    assert.equal(res.messages.length, 1);
    assert.equal(res.messages[0].role, "assistant");
    assert.typeOf(res.messages[0].content, "string");
    assert.match(/** @type{string} */ (res.messages[0].content), match);
    assert.equal(getMessageExtraGemini(res.messages[0])?.thought_signatures?.length, 1);
    assert.typeOf(getMessageExtraGemini(res.messages[0])?.thought_signatures?.[0], "string");
}

async function main() {
    /** @type {Message[]} */
    const history = [
        {role: "developer", content: "All responses must adhere to the following format: `The answer? It is ...`"},
        {role: "user", content: "Let a = 5328 and b = 6434. What is a times b?"},
    ];

    const encode = createStepEncoder(GeminiGenerateContentCodec);
    const decode = createStepDecoder(GeminiGenerateContentCodec);

    let api_req = encode({messages: history});
    const api_res = await api.models.generateContent({
        ...api_req,
        model: TEST_MODEL,
        config: {
            thinkingConfig: {
                includeThoughts: true,
                thinkingBudget: 8000,
            },
        }
    });
    let res = decode(api_res);

    globalThis.console.log(api_res.candidates?.[0].content);
    globalThis.console.log(res);
}

main().catch((err) => {
    globalThis.console.error(err);
    exit(1);
});