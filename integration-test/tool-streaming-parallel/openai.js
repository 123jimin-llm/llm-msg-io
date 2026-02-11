// @ts-check

/** @import {Message, StepResult, StepStreamEvent} from "../../dist/index.js" */

import {assert} from 'chai';
import {env, exit} from "node:process";
import {readFileSync} from "node:fs";

import {createStepEncoder, createStepStreamDecoder, OpenAIChatCodec} from "../../dist/index.js";
import OpenAI from "openai";

const functions = JSON.parse(readFileSync(new globalThis.URL('functions.json', import.meta.url)).toString());

const api = new OpenAI({
    apiKey: env['OPENAI_API_KEY'],
});

const TEST_MODEL = "gpt-4.1-nano";

/** @param {typeof functions} fns */
function toOpenAITools(fns) {
    return fns.map((/** @type {typeof functions[number]} */ fn) => ({
        "type": /** @type {const} */ ('function'),
        "function": fn,
    }));
}

async function main() {
    /** @type {Message[]} */
    const history = [
        {role: "developer", content: "You have access to weather and time tools. When the user asks about multiple cities, call the appropriate tool for EACH city in parallel. Always use celsius."},
        {role: "user", content: "What's the weather and local time in Tokyo, London, and New York?"},
    ];

    const encode = createStepEncoder(OpenAIChatCodec);
    const decode = createStepStreamDecoder(OpenAIChatCodec);

    const api_req = encode({
        functions,
        messages: history,
    });

    const stream = decode(api.chat.completions.create({
        ...api_req,
        model: TEST_MODEL,
        tools: toOpenAITools(functions),
        stream: true,
    }));

    /** @type {StepStreamEvent[]} */
    const events = [];

    /** @type {StepResult} */
    let result;

    while(true) {
        const next = await stream.next();
        if(next.done) {
            result = next.value;
            break;
        }
        events.push(next.value);
    }

    // Basic stream lifecycle events
    const event_types = new Set(events.map((e) => e.type));
    assert.isTrue(event_types.has('stream.start'), "expected stream.start event");
    assert.isTrue(event_types.has('tool_call.start'), "expected tool_call.start event");
    assert.isTrue(event_types.has('tool_call.delta'), "expected tool_call.delta events");
    assert.isTrue(event_types.has('tool_call.end'), "expected tool_call.end event");
    assert.isTrue(event_types.has('stream.end'), "expected stream.end event");

    // Multiple tool_call.start events with distinct indices
    const start_events = events.filter(
        (/** @type {StepStreamEvent} */ e) => e.type === 'tool_call.start',
    );
    assert.isAtLeast(start_events.length, 3, "expected at least 3 tool_call.start events for parallel calls");

    const start_indices = new Set(start_events.map(
        (/** @type {Extract<StepStreamEvent, {type: "tool_call.start"}>} */ e) => e.index,
    ));
    assert.equal(start_indices.size, start_events.length, "each tool_call.start should have a unique index");

    // Multiple tool_call.end events
    const end_events = events.filter(
        (/** @type {StepStreamEvent} */ e) => e.type === 'tool_call.end',
    );
    assert.equal(end_events.length, start_events.length, "tool_call.end count should match tool_call.start count");

    // Result assertions
    assert.equal(result.messages.length, 1);

    const msg = result.messages[0];
    assert.equal(msg.role, "assistant");
    assert.isArray(msg.tool_calls);

    const tool_calls = /** @type {NonNullable<typeof msg.tool_calls>} */ (msg.tool_calls);
    assert.isAtLeast(tool_calls.length, 3, "expected at least 3 parallel tool calls");

    // Each tool call should have a valid name from our function set
    const valid_names = new Set(functions.map((/** @type {typeof functions[number]} */ f) => f.name));
    for(const tc of tool_calls) {
        assert.isTrue(valid_names.has(tc.name), `unexpected tool name: ${tc.name}`);
        assert.isString(tc.id);
        const args = JSON.parse(/** @type {string} */ (tc.arguments));
        assert.isString(args.city);
    }

    // All tool call IDs should be unique
    const ids = new Set(tool_calls.map((tc) => tc.id));
    assert.equal(ids.size, tool_calls.length, "each tool call should have a unique id");

    globalThis.console.log(`Parallel tool calls: ${tool_calls.length}`);
    for(const tc of tool_calls) {
        globalThis.console.log(`  ${tc.name}(${tc.arguments})`);
    }
}

main().catch((err) => {
    globalThis.console.error(err);
    exit(1);
});
