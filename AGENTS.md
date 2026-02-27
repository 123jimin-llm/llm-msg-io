## AGENTS.md for llm-msg-io

Read this file thoroughly before starting work.

An npm package for converting LLM messages between a canonical schema and various formats: file formats (JSON, NDJSON, TOML, [STF](./docs/stf/README.md)) and API formats (OpenAI, Gemini, Claude).

**Tech stack:** TypeScript, `pnpm`, `eslint`, `chai`/`mocha`, `arktype`.

## Nested AGENTS.md

- `src/message/AGENTS.md` — Canonical message schema, streaming, helpers.
- `src/api-codec-lib/AGENTS.md` — Generic API-codec types.
- `src/file-codec/stf/AGENTS.md` — STF file-codec.
- `integration-test/AGENTS.md` — Integration tests against real APIs.

## Architecture

Two codec families, each with a `*-lib` (generic types + helpers) and a sibling directory (implementations):

1. **File codecs** (`file-codec-lib` → `file-codec`): Serialize/deserialize `Message[]` + optional metadata to/from string or structured data.
   - `FileCodec<EncodedType>` = `WithCreateEncoder` & `WithCreateDecoder`.
   - `createEncoder(codec)` / `createDecoder(codec)` accept either a codec object or a factory function.
   - Decoder pipeline: `CodecDecoder` returns a `RawMessageDecoder` (raw deserialization); `createDecoder` wraps it with `asDecodedData` validation and optional metadata validation.

2. **API codecs** (`api-codec-lib` → `api-codec`): Encode `StepParams` (messages + optional function defs + optional response schema) into provider-specific API requests, decode responses/streams back.
   - `APIStepCodecWithStream` = `WithCreateStepEncoder` & `WithCreateStepDecoder` & `WithCreateStepStreamDecoder`.
   - Stream decoding produces `StepStreamEvent` via `AsyncGenerator` (`StepStreamEventGenerator`), built on `StepStreamState` (in `src/message/stream/`).

Provider codecs compose partial codec objects (`*RequestCodec`, `*ResponseCodec`, `*StreamCodec`) via spread into a single `satisfies` object. OpenAI nests under `chat/`; Gemini and Claude are flat.

## `exportType` Convention

ArkType types are wrapped with `exportType()` before export, producing `PublicType<T>`. This erases internal ArkType type complexity from the public API surface while preserving runtime validation via `.assert()`.

## Testing

Unit tests use `chai`/`mocha`. Run `pnpm test` (builds first, then runs `dist/**/*.spec.js`).
