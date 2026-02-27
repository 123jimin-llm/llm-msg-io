## AGENTS.md for llm-msg-io

Read this file thoroughly before starting work.

## Nested AGENTS.md

- `src/message/AGENTS.md` — Canonical message schema design.
- `src/api-codec-lib/AGENTS.md` — API-codec layering pattern.
- `src/file-codec/stf/AGENTS.md` — STF codec gotchas.
- `integration-test/AGENTS.md` — Running integration tests.

## Architecture

Two codec families, each split into `*-lib` (generic types + helpers) and a sibling directory (concrete implementations):

1. **File codecs** (`file-codec-lib` → `file-codec`): Decoder pipeline separates raw deserialization (`RawMessageDecoder`) from validation (`asDecodedData` + optional metadata validation), composed by `createDecoder`.

2. **API codecs** (`api-codec-lib` → `api-codec`): Stream decoding produces `StepStreamEvent` via `AsyncGenerator`, built on `StepStreamState` (in `src/message/stream/`).

Provider codecs compose partial objects (`*RequestCodec`, `*ResponseCodec`, `*StreamCodec`) via spread into a single `satisfies` expression. OpenAI nests under `chat/`; Gemini and Claude are flat.

## `exportType` Convention

ArkType types are wrapped with `exportType()` before export, producing `PublicType<T>`. This erases internal ArkType type complexity from the public API surface while preserving runtime validation via `.assert()`.

## Testing

Run `pnpm test` — builds first, then runs `dist/**/*.spec.js`.
