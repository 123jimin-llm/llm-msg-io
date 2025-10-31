# llm-msg-io

> [!CAUTION]
> This project is currently in active development.

`llm-msg-io` is a small library for converting LLM messages to various formats.

## Features

- Converting to/from various API message formats.
- Converting to/from various serialization formats.
- [STF](./doc/stf/README.md) format for simple text representation of LLM messages.

> [!WARNING]
> This library does not perform any validations, which must be done by the user.

### Supported API Message Types

- `OpenAIChatInputCodec`: to OpenAI chat completion parameters
- `OpenAIChatOutputCodec`: from OpenAI chat completion responses

### Supported Serialization Types

- `JSONCodec`: to/from [JSON](./doc/json.md)
- `NDJSONCodec`: to/from [NDJSON](./doc/json.md)
- `TOMLCodec`: to/from TOML, using the same format as `JSONCodec` does.

## Installation

`npm install @jiminp/llm-msg-io`

## Usage

```ts
import {
  // A generic type for storing messages in-memory.
  type Message,

  // Helper functions for creating encoder and decoder functions from a codec.
  createEncoder, createDecoder,

  // JSON format support.
  JSONCodec
} from "@jiminp/llm-msg-io";

const messages: Message[] = [
  {role: 'user', content: "Hello!"},
  {role: 'assistant', content: "Hi! What's up?"},
];

// Messages to JSON
const encodeMessages = createEncoder(JSONCodec);

// JSON to messages
const decodeMessages = createDecoder(JSONCodec);

const encoded = encodeMessages(messages);
console.log(encoded);

const {messages: decoded} = decodeMessages(messages);
console.log(decoded);

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
