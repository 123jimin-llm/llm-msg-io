/* eslint-env node */
//@ts-check

/** @import {Message} from "../dist/index.js" */

import * as readline from "node:readline/promises";
import { stdin, stdout, env } from "node:process";

import { createStepEncoder, GeminiGenerateContentCodec, messageContentToText, createStepStreamDecoder } from "../dist/index.js";
import { GoogleGenAI } from "@google/genai";

const api = new GoogleGenAI({
    apiKey: env['GEMINI_API_KEY'],
});

async function main() {
    /** @type {Message[]} */
    const history = [
        {role: "developer", content: "You are an assistant who talks like a pirate."},
    ];
    const rl = readline.createInterface({input: stdin, output: stdout});

    const encode = createStepEncoder(GeminiGenerateContentCodec);
    const decode = createStepStreamDecoder(GeminiGenerateContentCodec);

    while(true) {
        const user_input = await rl.question("You> ");
        if(user_input.match(/^\s\*$/)) break;

        const user_msg = {
            role: "user",
            content: user_input,
        };

        const api_req = encode({
            messages: [
                ...history,
                user_msg,
            ],
        });

        const api_res = await api.models.generateContentStream(api_req);
        const stream = decode(api_res);

        stdout.write("AI> ");

        stream.on("content.delta", (event) => {
            stdout.write(messageContentToText(event.delta));
        });

        const res = await stream.done();
        history.push(user_msg, ...res.messages);

        stdout.write("\n");
    }

    rl.close();
}

main().catch(globalThis.console.error);