/* eslint-env node */
//@ts-check

/** @import {Message, StepResult} from "../../dist/index.js" */

import { env, exit } from "node:process";
import { readFileSync } from "node:fs";

import { createStepEncoder, createStepDecoder, GeminiGenerateContentCodec } from "../../dist/index.js";
import { GoogleGenAI } from "@google/genai";

const functions = JSON.parse(readFileSync(new globalThis.URL('functions.json', import.meta.url)).toString());

const api = new GoogleGenAI({
    apiKey: env['GEMINI_API_KEY'],
});

const TEST_MODEL = "gemini-3-flash-preview";

async function main() {
    /** @type {Message[]} */
    const history = [
        {role: "user", content: "What is the weather in London?"},
    ];

    const encode = createStepEncoder(GeminiGenerateContentCodec);
    const decode = createStepDecoder(GeminiGenerateContentCodec);

    let api_req = encode({
        functions,
        messages: history,
    });

    const api_res = await api.models.generateContent({
        ...api_req,
        model: TEST_MODEL,
    });
    
    globalThis.console.log(api_res.candidates?.[0]?.content?.parts[0]?.functionCall);

    let res = decode(api_res);
    globalThis.console.log(res.messages[0]);
}

main().catch((err) => {
    globalThis.console.error(err);
    exit(1);
});