# llm-msg-io

> [!WARNING]
> This project is currently in active development.
> 
> I personally use this library in many projects of mine, but I do occasionally find bugs and make breaking changes.

`llm-msg-io` is a small library for converting LLM messages and various LLM-related API requests/responses to various formats.

Also check out [briko](https://github.com/123jimin-llm/briko), which provides a modular tool to build LLM applications.

## Installation

`npm install @jiminp/llm-msg-io`

## Examples

### Managing Chat Context

```ts
import OpenAI from 'openai';

import {
  type Message,
  OpenAIChatCodec,
  createStepEncoder,
  createStepDecoder,
} from "@jiminp/llm-msg-io";

const messages: Message[] = [
  {role: 'system', content: 'You are a helpful assistant.'},
  {role: 'user', content: 'Hello!'},
];

// Convert message list to OpenAI chat completion API request.
const encode = createStepEncoder(OpenAIChatCodec);
const api_req = encode({messages});

const client = new OpenAI();
const api_res = client.chat.completions.create({
  ...api_req,
  model: 'gpt-5.2',
});

// Decode the response and add it to your message history.
const decode = createStepDecoder(OpenAIChatCodec);
messages.push(...decode(api_res).messages);
```

### History to/from JSON

```ts
import {
  type Message,
  JSONCodec,
  createEncoder,
  createDecoder,
} from "@jiminp/llm-msg-io";

const messages: Message[] = [
  {role: 'user', content: 'Hello!'},
  {role: 'assistant', content: "Hi!"},
];

// Encode messages to a JSON string
const encode = createEncoder(JSONCodec);
const json_str = encode(messages);

// Decode messages from a JSON string
const decode = createDecoder(JSONCodec);
const { messages: decoded_messages } = decode(json_str);
```

Here is the encoded value:

```json
[{"role":"user","content":"Hello!"},{"role":"assistant","content":"Hi!"}]
```

## Features

> [!WARNING]
> This library does not perform any data validations (such as role name sanitization), which must be done by the user.

- Converting to/from various API message formats.
- Converting to/from various serialization formats.
- [STF](./docs/stf/README.md) format for simple text representation of LLM messages.
- Minimal dependencies.

### Supported API Message Types

- `OpenAIChatCodec`: for OpenAI chat completion requests and responses
- `GeminiGenerateContentCodec`: for Gemini `generateContent` / `generateContentStream`
- (TODO) `ClaudeMessagesCodec`: for Claude `messages.create`.

#### Stream Events

- `content.delta`
- `refusal.delta`
- `reasoning.delta`
- `tool_call.start`
- `tool_call.delta`
- `tool_call.end`
- `role`
- `stream.start`
- `stream.end`
- `stream.error`

### Supported Serialization Types

- `JSONCodec`: to/from [JSON](./docs/json.md)
- `NDJSONCodec`: to/from [NDJSON](./docs/json.md)
- `TOMLCodec`: to/from TOML, using the same format as `JSONCodec` does.
- `STFCodec`: to/from [STF](./docs/stf/README.md)

### Minimal Dependencies

`llm-msg-io` tries to minimize dependencies.

Here's the result of running `pnpm ls -P --depth 99` on the root directory:

```text
dependencies:
arktype 2.1.25
├─┬ @ark/schema 0.53.0
│ └── @ark/util 0.53.0
├── @ark/util 0.53.0
└─┬ arkregex 0.0.2
  └── @ark/util 0.53.0
json5 2.2.3
smol-toml 1.4.2
```

## Development

This project uses [pnpm](https://pnpm.io/) for package management.

- `pnpm build` – compile TypeScript from `src/` into `dist/`.
  - `pnpm build:watch` – recompile on every file change.
- `pnpm test` – run unit tests from `src/**/*.spec.ts`.
  - Don't forget to run `pnpm build` before running tests!
- `pnpm lint` – run ESLint on the source code.
- `pnpm clean` – remove the `dist/` directory.

## License

[MIT](./LICENSE)
