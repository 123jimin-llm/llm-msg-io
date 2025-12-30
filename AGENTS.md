# llm-msg-io

## Summary

`llm-msg-io` is an npm package providing two functionalities:

- A library for converting LLM messages to various formats.
- Specification for [STF](./docs/stf/README.md), a text-based format for LLM messages.

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

### Tech Stack

- TypeScript, `pnpm`, `eslint`
- `chai` and `mocha`
- `arktype`

## File Structure

- `/docs`: Documentation for the project.
  - `/docs/stf`: Specification for the STF format.
- `/src`: Source code for the library.
  - `/src/util`: Utilities.
  - `/src/message`: Codec type definitions and message utilities.
  - `/src/api-codec`: Codecs for API message formats.
  - `/src/file-codec`: Codecs for file formats.
- `/example`: Example usage of `llm-msg-io`.

## Architecture

### Message (`src/message`)

The `schema.ts` module contains the canonical message schema (defined with `arktype`) and helpers.

```ts
// `exportType` from `src/util/type.ts` sanitizes internal ArkType types.  
export const Message = exportType(type({
  "id?": 'string',
  role: 'string',
  content: type('string').or(ContentPart.array()),
}));

export type Message = typeof Message.infer;
```

The `codec.ts` module defines generic codec types.

- `MessageEncoder<EncodedType=string, MetadataType=unknown>` is a function that encodes message + metadata.
- `MessageDecoder<EncodedType=string, MetadataType=unknown>` does the opposite, and returns `{metadata?: MetadataType, messages: Message[]}`.
- `RawMessageDecoder<EncodedType=string>` skips validation; may return the object `MessageDecoder` returns, or simply an array of messages.
- `CodecEncoder` is a function that takes encoder options and returns `MessageEncoder`.
- `CodecDecoder` is a function that takes decoder options and returns `RawMessageDecoder`.
- `WithCreateEncoder` is an object with function `createEncoder`.
- `WithCreateDecoder` is an object with function `createDecoder`.
- `Codec` is the intersection type of `WithCreateEncoder` and `WithCreateDecoder`.

It also provides helpers like `createEncoder` and `createDecoder`.

### Codec

Two domains: `src/file-codec` for serialized file formats and `src/api-codec` for API input/outputs.

## Testing

Unit tests are written with `chai` and `mocha`, and executed via `pnpm test`, which builds the project (`pnpm build`) and then runs Mocha on the compiled spec files under `dist/**/*.spec.js`.