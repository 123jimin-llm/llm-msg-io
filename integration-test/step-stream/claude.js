// @ts-check

/** @import {Message, StepResult, StepStreamEvent} from "../../dist/index.js" */

import {assert} from 'chai';
import {env, exit} from "node:process";

import {createStepEncoder, createStepStreamDecoder, ClaudeMessagesCodec} from "../../dist/index.js";
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
    const decode = createStepStreamDecoder(ClaudeMessagesCodec);

    const api_req = encode({messages: history});

    const stream = decode(api.messages.create({
        ...api_req,
        model: TEST_MODEL,
        stream: true,
    }));

    /** @type {StepStreamEvent[]} */
    const events = [];
    let content_delta_count = 0;

    /** @type {StepResult} */
    let result;

    while(true) {
        const next = await stream.next();
        if(next.done) {
            result = next.value;
            break;
        }

        const event = next.value;
        events.push(event);

        if(event.type === 'content.delta') {
            content_delta_count++;
        }
    }

    const event_types = new Set(events.map((e) => e.type));
    assert.isTrue(event_types.has('stream.start'), "expected stream.start event");
    assert.isTrue(event_types.has('role'), "expected role event");
    assert.isTrue(event_types.has('content.delta'), "expected content.delta events");
    assert.isTrue(event_types.has('stream.end'), "expected stream.end event");

    assert.isAbove(content_delta_count, 1, "expected multiple content.delta events");

    check(result, /^The answer\? It is\D*12\D*$/);

    const stream_start = /** @type {Extract<StepStreamEvent, {type: "stream.start"}>} */ (
        events.find((e) => e.type === 'stream.start')
    );
    assert.isObject(stream_start.metadata);
    assert.isString(stream_start.metadata?.id);
    assert.isString(stream_start.metadata?.model);

    const stream_end = /** @type {Extract<StepStreamEvent, {type: "stream.end"}>} */ (
        events.find((e) => e.type === 'stream.end')
    );
    assert.equal(stream_end.finish_reason, 'stop');

    globalThis.console.log(`Streamed ${content_delta_count} content.delta events`);
    globalThis.console.log(result);
}

main().catch((err) => {
    globalThis.console.error(err);
    exit(1);
});
