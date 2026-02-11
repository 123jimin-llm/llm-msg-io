/* eslint-env node */
//@ts-check

/** @import {Message, StepResult, StepStreamEvent} from "../../dist/index.js" */

import { assert } from 'chai';
import { env, exit } from "node:process";
import { readFileSync } from "node:fs";

import { createStepEncoder, createStepStreamDecoder, GeminiGenerateContentCodec } from "../../dist/index.js";
import { GoogleGenAI } from "@google/genai";

const functions = JSON.parse(readFileSync(new globalThis.URL('functions.json', import.meta.url)).toString());

const api = new GoogleGenAI({
    apiKey: env['GEMINI_API_KEY'],
});

const TEST_MODEL = "gemini-3-flash-preview";

async function main() {
    /** @type {Message[]} */
    const history = [
        {role: "developer", content: "You are a creative fiction writer. When asked to create a character, always use the create_character_profile tool. Be as detailed and verbose as possible in every field."},
        {role: "user", content: "Create an extremely detailed character profile for a grizzled detective in a noir fantasy setting. Make the background story very long and elaborate, and include many personality traits, skills, and relationships."},
    ];

    const encode = createStepEncoder(GeminiGenerateContentCodec);
    const decode = createStepStreamDecoder(GeminiGenerateContentCodec);

    const api_req = encode({
        functions,
        messages: history,
    });

    const stream = decode(api.models.generateContentStream({
        ...api_req,
        model: TEST_MODEL,
    }));

    /** @type {StepStreamEvent[]} */
    const events = [];
    let tool_call_delta_count = 0;

    /** @type {StepResult} */
    let result;

    while (true) {
        const next = await stream.next();
        if (next.done) {
            result = next.value;
            break;
        }

        const event = next.value;
        events.push(event);
        globalThis.console.log('EVENT:', event.type, event.type === 'tool_call.delta' ? event.delta?.slice(0, 50) : '');

        if (event.type === 'tool_call.delta') {
            tool_call_delta_count++;
        }
    }

    const event_types = new Set(events.map((e) => e.type));
    assert.isTrue(event_types.has('stream.start'), "expected stream.start event");
    assert.isTrue(event_types.has('tool_call.start'), "expected tool_call.start event");
    assert.isTrue(event_types.has('tool_call.end'), "expected tool_call.end event");
    assert.isTrue(event_types.has('stream.end'), "expected stream.end event");

    assert.equal(result.messages.length, 1);

    const msg = result.messages[0];
    assert.equal(msg.role, "assistant");
    assert.isArray(msg.tool_calls);
    assert.lengthOf(/** @type {unknown[]} */ (msg.tool_calls), 1);

    const tc = /** @type {NonNullable<typeof msg.tool_calls>} */ (msg.tool_calls)[0];
    assert.equal(tc.name, "create_character_profile");

    const args = JSON.parse(/** @type {string} */ (tc.arguments));
    assert.isString(args.full_name);
    assert.isNumber(args.age);
    assert.isString(args.occupation);
    assert.isArray(args.personality_traits);
    assert.isString(args.background_story);
    assert.isString(args.physical_description);
    assert.isArray(args.skills);
    assert.isString(args.motivations);
    assert.isArray(args.relationships);
    assert.isString(args.catchphrase);

    globalThis.console.log(`Streamed ${tool_call_delta_count} tool_call.delta events`);
    globalThis.console.log(`Function: ${tc.name}`);
    globalThis.console.log(`Arguments length: ${/** @type {string} */ (tc.arguments).length} chars`);
    globalThis.console.log(result.messages[0].tool_calls);
}

main().catch((err) => {
    globalThis.console.error(err);
    exit(1);
});
