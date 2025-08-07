# llm-msg-io

A small library for serializing and deserializing LLM messages.

> [!CAUTION]
> This project is currently in active development.

## Usage

Currently, `llm-msg-io` supports the following formats:

- `json`: JSON
- `toml`: TOML
- `simple`: Custom text-based format (described below)
  - Note: the identifier for the custom format may be changed later.

### String I/O

```js
import msgIO from '@123jimin/llm-msg-io';

// Converts a message, or an array of messages, to a string.
msgIO.toString(message, {format: 'json'});

// Parses a string into a message, or an array of messages.
msgIO.parse(str, {format: 'json'});
```

### File I/O

```js
import msgIO from '@123jimin/llm-msg-io';

await msgIO.save("foo.txt", message, {format: 'json'});
await msgIO.load("foo.txt", {format: 'json'});
```

## Simple Text Format

JSON, or even TOML formats are quite cumbersome to edit manually.
To simplify manual editing of chat history, llm-msg-io specifies and implements a custom format for chat messages.

```text
@user
Hi! Who are you?
@ai
Hello, I'm an AI, based on a large language model.
```

Refer to [the specification document](./doc/simple.md) for more details.

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
