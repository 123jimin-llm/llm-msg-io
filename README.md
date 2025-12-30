# llm-msg-io

> [!CAUTION]
> This project is currently in active development, and no backward compatibility is guaranteed.

`llm-msg-io` is a small library for converting LLM messages to various formats.

## Example Usage

### Managing Chat Context

```ts
import {
  OpenAIChatCodec,
  createEncoder,
  createDecoder,
} from "@jiminp/llm-msg-io";

const messages = [
  {role: 'system', content: 'You are a helpful assistant.'},
  {role: 'user', content: 'Hello!'},
];

// Encode messages to be sent to OpenAI.
const encode = createEncoder(OpenAIChatCodec);
const encoded = encode(messages);

// Assume `response` is a message object from OpenAI API.
const response = {role: 'assistant', content: "Hi!"};

// Decode the response and add it to your message history.
const decode = createDecoder(OpenAIChatCodec);
messages.push(...decode([response]).messages);
```

### History to/from JSON

```ts
import { JSONCodec, createEncoder, createDecoder } from "@jiminp/llm-msg-io";

const messages = [
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

### History to/from STF

[Simple Text Format](./docs/stf/README.md) is a simple plaintext format for storing LLM messages.
Check the documentation for more details.

Here is the encoded value, using `STFCodec`:

```stf
;user
Hello!
;ai
Hi!
```

## Features

> [!WARNING]
> This library does not perform any data validations (such as role name sanitization), which must be done by the user.

- Converting to/from various API message formats.
- Converting to/from various serialization formats.
- [STF](./docs/stf/README.md) format for simple text representation of LLM messages.
- Minimal dependencies.

### Supported API Message Types

- `OpenAIChatCodec`: for OpenAI chat completion parameters and responses
### Supported Serialization Types

- `JSONCodec`: to/from [JSON](./docs/json.md)
- `NDJSONCodec`: to/from [NDJSON](./docs/json.md)
- `TOMLCodec`: to/from TOML, using the same format as `JSONCodec` does.
- `STFCodec`: to/from [STF](./docs/stf/README.md)

### Minimal Dependencies

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

## Installation

`npm install @jiminp/llm-msg-io`

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
