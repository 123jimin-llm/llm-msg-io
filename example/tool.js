//@ts-check
/** @import { MessageArray } from "../dist/index.js" */
import { createDecoder, createEncoder, OpenAIResponseCodec } from "../dist/index.js";
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

    const encode = createEncoder(OpenAIResponseCodec);
    const decode = createDecoder(OpenAIResponseCodec);

    /** @type {MessageArray} */
    const messages = [
        {role: "user", content: "What is the weather in London?"},
    ];
    
    const api_res = await openai.responses.create({
        ...encode(messages),
        model: 'gpt-5-mini',
        tools,
    });

    const res = decode(api_res).messages;
    console.dir(res);
    console.dir(res[0].tool_calls);
}

main().catch(console.error);