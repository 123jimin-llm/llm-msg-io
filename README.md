# llm-msg-io

A small library for serializing and deserializing LLM messages.

> [!CAUTION]
> This project is currently in active development.

## Usage

Currently, `llm-msg-io` supports the following formats:

- `json`: JSON (as an array of messages)
  - `ndjson`: Newline-delimited JSON (one message per line)
- `toml`: TOML
- `simple`: [Simple Text Format](./doc/simple.md)

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
