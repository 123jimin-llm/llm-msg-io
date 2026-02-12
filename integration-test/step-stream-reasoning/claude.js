// @ts-check

/** @import {Message, StepResult, StepStreamEvent} from "../../dist/index.js" */

import {assert} from 'chai';
import {env, exit} from "node:process";

import {createStepEncoder, createStepStreamDecoder, ClaudeMessagesCodec, getMessageExtraClaude} from "../../dist/index.js";
import Anthropic from "@anthropic-ai/sdk";

const api = new Anthropic({
    apiKey: env['ANTHROPIC_API_KEY'],
});

const TEST_MODEL = "claude-sonnet-4-5-20250929";

async function main() {
    /** @type {Message[]} */
    const history = [
        {role: "developer", content: "All responses must adhere to the following format: `The answer? It is ...`"},
        {role: "user", content: "Let a = 5328 and b = 6434. What is a times b?"},
    ];

    const encode = createStepEncoder(ClaudeMessagesCodec);
    const decode = createStepStreamDecoder(ClaudeMessagesCodec);

    const api_req = encode({messages: history});

    const stream = decode(api.messages.create({
        ...api_req,
        model: TEST_MODEL,
        thinking: {
            type: 'enabled',
            budget_tokens: 8000,
        },
        max_tokens: 16000,
        stream: true,
    }));

    /** @type {StepStreamEvent[]} */
    const events = [];
    let reasoning_delta_count = 0;
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

        if(event.type === 'reasoning.delta') {
            reasoning_delta_count++;
        }
        if(event.type === 'content.delta') {
            content_delta_count++;
        }
    }

    const event_types = new Set(events.map((e) => e.type));
    assert.isTrue(event_types.has('stream.start'), "expected stream.start event");
    assert.isTrue(event_types.has('reasoning.delta'), "expected reasoning.delta events");
    assert.isTrue(event_types.has('content.delta'), "expected content.delta events");
    assert.isTrue(event_types.has('stream.end'), "expected stream.end event");

    assert.isAbove(reasoning_delta_count, 1, "expected multiple reasoning.delta events");
    assert.isAbove(content_delta_count, 0, "expected content.delta events");

    assert.equal(result.messages.length, 1);

    const msg = result.messages[0];
    assert.equal(msg.role, "assistant");
    assert.isString(msg.reasoning);
    assert.isAbove(/** @type {string} */ (msg.reasoning).length, 0, "reasoning should not be empty");

    const extra = getMessageExtraClaude(msg);
    assert.isNotNull(extra, "expected claude extra");
    assert.isArray(extra?.thinking_blocks);
    assert.isAbove(/** @type {unknown[]} */ (extra?.thinking_blocks ?? []).length, 0, "expected thinking blocks");

    const thinking_block = extra?.thinking_blocks?.find((b) => b.type === 'thinking');
    assert.isNotNull(thinking_block, "expected at least one thinking block");
    if(thinking_block?.type === 'thinking') {
        assert.isString(thinking_block.signature);
        assert.isAbove(thinking_block.signature.length, 0, "thinking block should have a signature");
    }

    globalThis.console.log(`Streamed ${reasoning_delta_count} reasoning.delta, ${content_delta_count} content.delta events`);
    globalThis.console.log("Reasoning length:", /** @type {string} */ (msg.reasoning).length);
    globalThis.console.log("Thinking blocks:", extra?.thinking_blocks?.length);
    globalThis.console.log("Content:", msg.content);
}

main().catch((err) => {
    globalThis.console.error(err);
    exit(1);
});
