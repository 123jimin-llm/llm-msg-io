## AGENTS.md for `src/message/`

### Design

- `Message` is dual-natured: a TypeScript `interface` for static typing AND a runtime `PublicType` validator. Both must stay in sync.
- `concatContentsTo` mutates `ContentPart[]` targets in-place (unlike `concatContents` which returns a new value).
- `getMessageExtra<T>(message, key, init?)` — `init=true` auto-creates the nested object in `message.extra`. Provider codecs (Gemini `extra.ts`, Claude `extra.ts`) wrap this for typed access.

### `stream/`

- `StepStreamState` is a mutable accumulator. `finalizeStepStreamState()` sorts `tool_calls` by index and defaults role to `'assistant'` — provider stream decoders must call it.
- `applyDeltaToStepStreamState()` yields `StepStreamEvent`s from a `MessageDelta` — provider stream decoders convert provider chunks to deltas, then delegate here.
