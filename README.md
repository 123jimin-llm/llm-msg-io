# llm-msg-io

A small library for serializing and deserializing LLM messages.

> [!CAUTION]
> This project is currently in active development.

## Usage

```ts
import { serialize, deserialize } from "@jiminp/llm-msg-io";

const message = [];
const serialized = serialize(message, {});
const deserialized = deserialize(serialized, {});

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
