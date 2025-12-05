/* eslint-env node */
//@ts-check

/** @import {Message} from "../dist/index.js" */

import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import * as fs from "node:fs/promises";

import { OpenAIChatCodec, STFCodec, createEncoder, createDecoder, createStreamDecoder } from "../dist/index.js";
import { OpenAI } from "openai";

const HISTORY_PATH = "history.stf";
const openai = new OpenAI();

/**
 * @returns {Promise<Message[]>}
 */
async function loadHistory() {
    try {
        const data = await fs.readFile(HISTORY_PATH, 'utf-8');
        return createDecoder(STFCodec)(data).messages;
    } catch(err) {
        if((/** @type{{code?: unknown}} */ (err)).code === 'ENOENT') {
            return [{role: "developer", content: "You are a helpful assistant."}];
        }

        throw err;
    }
}

/**
 * @param {Message[]} messages 
 */
async function saveHistory(messages) {
    await fs.writeFile(HISTORY_PATH, createEncoder(STFCodec)(messages));
}

async function main() {
    const messages = await loadHistory();
    const rl = readline.createInterface({input: stdin, output: stdout});

    const encode = createEncoder(OpenAIChatCodec);
    const decode = createStreamDecoder(OpenAIChatCodec);

    while(true) {
        const user_input = await rl.question("You> ");
        if(user_input.match(/^\s\*$/)) break;

        messages.push({role: 'user', content: user_input});

        const stream = await openai.chat.completions.create({
            ...encode(messages),
            model: 'gpt-5-nano',
            stream: true,
        });

        console.log(stream);
        const res = decode(stream);

        const ans = await res.done();
        console.log(ans);

        await saveHistory(messages);
    }

    rl.close();
}

main().catch(console.error);