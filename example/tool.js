/* eslint-env node */
//@ts-check
/** @import { MessageArray } from "../dist/index.js" */
import { createDecoder, createEncoder, OpenAIResponsesCodec } from "../dist/index.js";
import { OpenAI } from "openai";

const tools = [
    {
        type: /** @type {const} */ ('function'),
        name: "get_current_weather",
        description: "Get the current weather in a given location",
        strict: true,
        parameters: {
            type: 'object',
            properties: {
                city: {
                    type: 'string',
                    description: "The city and the country.",
                },
            },
            additionalProperties: false,
            required: ['city'],
        },
    }
];

async function main() {
    const openai = new OpenAI();

    const encode = createEncoder(OpenAIResponsesCodec);
    const decode = createDecoder(OpenAIResponsesCodec);

    /** @type {MessageArray} */
    const messages = [
        {role: "user", content: "What is the weather in London?"},
    ];
    
    const res = await openai.responses.create({
        model: 'gpt-5-mini',
        input: encode(messages),
        tools,
    });

    console.log(res);
}

main().catch(console.error);