/* eslint-env node */
//@ts-check

/** @import {Message} from "../dist/index.js" */

import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import * as fs from "node:fs/promises";

import { createStepEncoder, createStepDecoder, GeminiGenerateContentRequestCodec, GeminiGenerateContentResponseCodec } from "../dist/index.js";
import { GoogleGenAI } from "@google/genai";

const api = new GoogleGenAI({});

async function main() {
    /** @type {Message[]} */
    const history = [
        {role: "developer", content: "You are an assistant who talks like a pirate."},
    ];
    const rl = readline.createInterface({input: stdin, output: stdout});

    const encode = createStepEncoder(GeminiGenerateContentRequestCodec);
    const decode = createStepDecoder(GeminiGenerateContentResponseCodec);

    while(true) {
        const user_input = await rl.question("You> ");
        if(user_input.match(/^\s\*$/)) break;

        const api_req = encode({
            messages: [
                ...history,
                {
                    role: "user",
                    content: user_input,
                },
            ],
        });

        globalThis.console.log(api_req);

        const api_res = await api.models.generateContent(api_req);
        const res = decode(api_res);

        globalThis.console.log(res);
    }

    rl.close();
}

main().catch(globalThis.console.error);