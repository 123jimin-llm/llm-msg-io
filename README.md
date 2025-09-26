# llm-msg-io

`llm-msg-io` is a small library for serializing and deserializing LLM messages, together with an optional metadata.

> [!CAUTION]
> This project is currently in active development.

## Features

## Installation

`npm install @jiminp/llm-msg-io`

## Usage

```ts
import { serialize, deserialize } from "@jiminp/llm-msg-io";
import { JSONCodec } from "@jiminp/llm-msg-io";
import type { Message } from "@jiminp/llm-msg-io";

const messages: Message[] = [
  {role: 'user', content: "Hello!"},
  {role: 'assistant', content: "Hi! What's up?"},
];

const serialized = serialize(JSONCodec, message);
console.log(serialized);

const {messages: deserialized} = deserialize(JSONCodec, serialized);
console.log(deserialized);

```

### Message Types

- OpenAI Chat Request Message
- OpenAI Chat Response Message

### File Types

- JSON
- TOML
- [Simple Text Format](./doc/simple.md)

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
