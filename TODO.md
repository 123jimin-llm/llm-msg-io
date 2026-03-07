# TODO

## Bugs

- [ ] `refusal.delta` event in `applyDeltaToStepStreamState` emits empty string instead of `delta.refusal`.
- [ ] `stream.error` event is defined in `StepStreamEvent` but never emitted — no stream codec wraps its `for await` loop in `try/catch`.

## Feature Gaps

### STF

- [ ] STF encoder silently drops `reasoning` and `refusal` fields. Add `;reasoning` and `;refusal` polyadic commands (encoder + decoder + spec).
- [ ] STF encoder silently drops `tool_calls` when `content` is a string. Add `;tool_call` command or force `;raw` fallback when `tool_calls` is present.
- [ ] Update `docs/stf/command.md` and `docs/stf/README.md` to document any new commands.

### API Codecs

- [ ] OpenAI request encoder ignores `req.functions` — never maps them to `tools` in the output. Gemini and Claude codecs both handle this.
- [ ] OpenAI non-streaming response decoder ignores `reasoning` field. The stream codec handles it, but `OpenAIChatMessagesCodec` does not. Relevant for `o1`/`o3` models.
- [ ] Gemini request encoder does not encode `tool` role messages as `functionResponse` parts — they are sent as `user` text, which Gemini rejects.
- [ ] Claude request encoder does not forward `response_schema.name` or `response_schema.description` to `output_config.format`.

## DX

- [ ] All three provider SDKs are required peer dependencies. Add `peerDependenciesMeta` with `"optional": true` for each.
- [ ] OpenAI stream codec relies on `chunk.usage` but the request encoder never sets `stream_options: { include_usage: true }`. Document this or provide a stream-aware encode path.

## Tests

- [ ] Add unit tests for `TOMLCodec` (encode + decode + round-trip). JSON and NDJSON have specs; TOML has none.
- [ ] Populate empty integration test files (e.g. `step-stream/gemini.js`) or remove them.

## Docs

- [ ] Add JSDoc to primary exported types (`Message`, `StepStreamEvent`, `StepParams`, `StepResult`, `ContentPart`, etc.) for IDE hover docs.
