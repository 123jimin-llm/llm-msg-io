# llm-msg-io

Always read this file thoroughly before starting work.

## Summary

An npm package (`@jiminp/llm-msg-io`) for converting LLM messages to various formats, including a text-based format called [STF](./docs/stf/README.md).

**Tech stack:** TypeScript, `pnpm`, `eslint`, `chai`/`mocha`, `arktype`.

## File Structure

- `/docs/stf` — STF format specification.
- `/src/util` — Utilities (e.g. `exportType` for sanitizing ArkType types).
- `/src/message` — Canonical message schema (`arktype`), generic codec types, and helpers.
- `/src/file-codec` — Codecs for serialized file formats (JSON, NDJSON, TOML, STF).
- `/src/api-codec` — Codecs for API formats (OpenAI, Gemini).
- `/example` — Example usage.
- `AGENTS.md` — LLM onboarding guide. Must stay brief while covering all essential context.

## Architecture

- **Message schema** (`src/message/schema/`): Defines `Message`, `ContentPart`, etc. with `arktype`.
- **Codec types** (`src/message/`): Generic `Codec` type (= `WithCreateEncoder` & `WithCreateDecoder`), plus `MessageEncoder`, `MessageDecoder`, and related types. `createEncoder`/`createDecoder` helpers build encoder/decoder functions from a codec.
- **Codec implementations**: `src/file-codec` for file formats, `src/api-codec` for API I/O.

## Testing

Tests use `chai`/`mocha`. Run `pnpm test` (builds first, then runs `dist/**/*.spec.js`).

## Integration Tests

`/integration-test` — Non-interactive integration tests that hit real APIs (OpenAI, Gemini). Structure is informal and incomplete; not as rigid as `/src`.

- Run individual tests directly: `node integration-test/<subdir>/<provider>.js`.
- API keys are set via env variables (`OPENAI_API_KEY`, `GEMINI_API_KEY`). See `integration-test/README.md`.
- Subdirectories test different codec scenarios: `step/` (basic step), `step-reasoning/` (reasoning models), `tool/` (function calling).
- Each subdirectory has per-provider files (e.g. `gemini.js`, `openai.js`).
- Gemini 3 models return `thought_signatures` in message extras; these must be preserved through encode/decode.