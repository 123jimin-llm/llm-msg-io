//@ts-check

/** @import {Message} from "../dist/index.js" */

import * as readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import * as fs from "node:fs/promises";

import { OpenAIChatInputCodec, NDJSONCodec, createEncoder, createDecoder, OpenAIChatOutputCodec } from "../dist/index.js";
import { OpenAI } from "openai";

const HISTORY_PATH = "history.txt";
const openai = new OpenAI();

/**
 * @returns {Promise<Message[]>}
 */
async function loadHistory() {
    try {
        const data = await fs.readFile(HISTORY_PATH, 'utf-8');
        return createDecoder(NDJSONCodec)(data).messages;
    } catch(err) {
        if((/** @type{{code?: unknown}} */ (err)).code === 'ENOENT') {
            return [{role: "system", content: "You are a helpful assistant."}];
        }

        throw err;
    }
}

/**
 * @param {Message[]} messages 
 */
async function saveHistory(messages) {
    await fs.writeFile(HISTORY_PATH, NDJSONCodec.createEncoder()(messages));
}

async function main() {
    const messages = await loadHistory();
    const rl = readline.createInterface({input: stdin, output: stdout});

    const encoder = createEncoder(OpenAIChatInputCodec);
    const decoder = createDecoder(OpenAIChatOutputCodec);

    while(true) {
        const user_input = await rl.question("You> ");
        if(user_input.match(/^\s\*$/)) break;

        messages.push({role: 'user', content: user_input});

        const completion = await openai.chat.completions.create({
            model: 'gpt-5-nano',
            messages: encoder(messages),
        });

        const response = completion.choices[0].message;

        messages.push(...decoder([response]).messages);

        console.log(`Assistant> ${response.content}`);
        await saveHistory(messages);
    }

    rl.close();
}

main().catch(console.error);