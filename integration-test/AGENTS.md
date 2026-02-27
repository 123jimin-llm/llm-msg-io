## AGENTS.md for `integration-test/`

Run from repo root after `pnpm build`:

```
node integration-test/<subdir>/<provider>.js
```

### Credentials

| Provider  | Env Variable        |
| --------- | ------------------- |
| OpenAI    | `OPENAI_API_KEY`    |
| Gemini    | `GEMINI_API_KEY`    |
| Anthropic | `ANTHROPIC_API_KEY` |

### Conventions

- Tests import from `../../dist/index.js` — requires prior build.
- Not every provider appears in every subdirectory (e.g., reasoning dirs lack `openai.js`).
- Provider-specific extras (Gemini `thought_signatures`, Claude `thinking_blocks`) must round-trip through encode/decode.
