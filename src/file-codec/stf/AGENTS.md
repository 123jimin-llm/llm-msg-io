## AGENTS.md for `src/file-codec/stf/`

See `/docs/stf/README.md` for format spec, `/docs/stf/command.md` for command reference.

### Decoder Gotchas

- `end` command and comments (`//`, `#`, `/* */`) are handled directly in the decoder loop, **not** via the command registry. Adding new syntax of this kind requires modifying `decoder.ts`, not `command/`.
- Comment depth (block comment nesting) is a local variable in the decoder, not part of `DecodeState`.
- `flushBufferedLines()` appends to current message via `concatContentsTo` (in-place mutation).

### Encoder Gotchas

- Non-string content falls back to `;raw` + JSON5. If a new `ContentPart` variant is added, `stringify` needs a case for it or the fallback applies silently.
