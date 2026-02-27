## AGENTS.md for `integration-test/`

Non-interactive integration tests against real LLM APIs. Run from repo root after `pnpm build`:

```
node integration-test/<subdir>/<provider>.js
```

### Credentials

| Provider  | Env Variable        |
| --------- | ------------------- |
| OpenAI    | `OPENAI_API_KEY`    |
| Gemini    | `GEMINI_API_KEY`    |
| Anthropic | `ANTHROPIC_API_KEY` |

### Test Subdirectories

Each subdirectory has per-provider `.js` files. Not every provider appears in every subdirectory (e.g., reasoning dirs lack `openai.js`).

| Directory                  | Scenario                             |
| -------------------------- | ------------------------------------ |
| `step/`                    | Basic non-streaming step             |
| `step-reasoning/`          | Reasoning models (extended thinking) |
| `step-stream/`             | Basic streaming step                 |
| `step-stream-reasoning/`   | Streaming with reasoning models      |
| `tool/`                    | Function calling (non-streaming)     |
| `tool-streaming/`          | Function calling (streaming)         |
| `tool-streaming-parallel/` | Parallel function calls (streaming)  |

### Conventions

- Tests use `chai` assertions, plain `node:process` exit on failure.
- Tests import from `../../dist/index.js` (requires prior build).
- Provider-specific extras (Gemini `thought_signatures`, Claude `thinking_blocks`) must round-trip through encode/decode.
