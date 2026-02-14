## AGENTS.md for llm-msg-io

Read this file thoroughly before starting work.

An npm package for converting LLM messages between a canonical schema and various formats: file formats (JSON, NDJSON, TOML, [STF](./docs/stf/README.md)) and API formats (OpenAI, Gemini, Claude).

**Tech stack:** TypeScript, `pnpm`, `eslint`, `chai`/`mocha`, `arktype`.

## File Structure

- `/docs` — Format specifications. `stf/` is the STF spec; `msg.md` and `json.md` document message normalization and JSON serialization.
- `/src/util` — Shared utilities: `exportType` (sanitizes ArkType types for public API), `Nullable`, `unreachable`, UID counter.
- `/src/message/` — Canonical message schema and helpers. Has own AGENTS.md.
- `/src/file-codec-lib/` — Generic file-codec types (`FileCodec`, `MessageEncoder`, `MessageDecoder`, `createEncoder`, `createDecoder`).
- `/src/file-codec/` — File-codec implementations (JSON, NDJSON, TOML, STF). STF has own AGENTS.md.
- `/src/api-codec-lib/` — Generic API-codec types (`APIStepCodec`, `StepParams`, `StepResult`, `StepStreamDecoder`, etc.). Has own AGENTS.md.
- `/src/api-codec/` — API-codec implementations (OpenAI, Gemini, Claude). Each provider has `request`, `response`, `stream`, and optionally `extra` modules.
- `/example` — Interactive example scripts (chat, chat-stream, tool).
- `/integration-test/` — Non-interactive integration tests against real APIs. Has own AGENTS.md.

## Architecture

Two codec families, each with a `*-lib` (generic types + helpers) and a sibling directory (implementations):

1. **File codecs** (`file-codec-lib` → `file-codec`): Serialize/deserialize `Message[]` + optional metadata to/from string or structured data.
   - `FileCodec<EncodedType>` = `WithCreateEncoder` & `WithCreateDecoder`.
   - `createEncoder(codec)` / `createDecoder(codec)` — helper functions that accept either a codec object or a factory function.

2. **API codecs** (`api-codec-lib` → `api-codec`): Encode `StepParams` (messages + optional function defs) into provider-specific API requests, decode responses/streams back.
   - `APIStepCodecWithStream` = `WithCreateStepEncoder` & `WithCreateStepDecoder` & `WithCreateStepStreamDecoder`.
   - Stream decoding produces `StepStreamEvent` via `AsyncGenerator`, built on `StepStreamState` (in `src/message/stream/`).

Provider codecs compose partial codec objects (`*RequestCodec`, `*ResponseCodec`, `*StreamCodec`) via spread into a single satisfying object (e.g. `OpenAIChatCodec`).

## `exportType` Convention

ArkType types are wrapped with `exportType()` before export, producing `PublicType<T>`. This erases internal ArkType type complexity from the public API surface while preserving runtime validation via `.assert()`.

## Testing

Unit tests use `chai`/`mocha`. Run `pnpm test` (builds first, then runs `dist/**/*.spec.js`).

## Integration Tests

See `/integration-test/AGENTS.md`.