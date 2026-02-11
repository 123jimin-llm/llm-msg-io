//@ts-check

/** @import {StepResult, Message} from "../dist/index.js" */

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

        while(true) {
            const res = await stream.next();
            if(res.done) {
                history.push(user_msg, ...res.value.messages);
                break;
            }

            const {value: event} = res;
            if(event.type === 'content.delta') {
                stdout.write(messageContentToText(event.delta));
            }
        }

        stdout.write("\n");
    }

    rl.close();
}

main().catch(globalThis.console.error);