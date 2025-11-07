/* eslint-env node */
//@ts-check

import { createDecoder, createEncoder, MessageArray, OpenAIChatCodec } from "../dist/index.js";
import { OpenAI } from "openai";

const tools = [
    {
        type: /** @type {const} */ ('function'),
        function: {
            name: "get_current_weather",
            description: "Get the current weather in a given location",
            parameters: {
                type: 'object',
                properties: {
                    city: {
                        type: 'string',
                        description: "The city and the country.",
                    },
                },
                required: ['city'],
            }
        },
    }
];

async function main() {
    const openai = new OpenAI();

    const encode = createEncoder(OpenAIChatCodec);
    const decode = createDecoder(OpenAIChatCodec);

    /** @type {MessageArray} */
    const messages = [
        {role: "user", content: "What is the weather in London?"},
    ];
    
    const completion = await openai.chat.completions.create({
        model: 'gpt-5-mini',
        messages: encode(messages),
        tools,
    });

    const response = decode([completion.choices[0].message]).messages[0].tool_calls;
    console.log(response);
}

main().catch(console.error);