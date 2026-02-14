## AGENTS.md for `src/message/`

Canonical message schema, streaming infrastructure, and message utilities.

### `schema/`

Defines core types with `arktype`, all exported via `exportType()`:

- `Message` — Role, content, optional reasoning/refusal/tool_calls/extra. Both an interface and a runtime validator.
- `MessageContent` — `string | ContentPart[]`. Content parts: `text`, `image`, `audio`, `file`.
- `ContentPart` — Union of `ContentPartText`, `ContentPartImage`, `ContentPartAudio`, `ContentPartFile`.
- `ToolCall` — `{name, arguments, id?, call_id?, extra?}`.
- `MessageDelta` — Partial message for streaming; `tool_calls` uses `ToolCallDelta[]` (indexed).
- `MessageArray` — Validated `Message[]`.

### `stream/`

Streaming event system for incremental message construction:

- `StepStreamEvent` — Discriminated union: `content.delta`, `reasoning.delta`, `refusal.delta`, `tool_call.start/delta/end`, `role`, `stream.start/end/error`.
- `StepStreamState` — Mutable accumulator: `{message, tool_calls: Map, tool_call_started: Set}`.
- `createStepStreamState()` → fresh state. `applyDeltaToStepStreamState()` yields events from a `MessageDelta`. `finalizeStepStreamState()` yields `tool_call.end` events and assembles final `message.tool_calls`.

### `util.ts`

Message-level helpers. Key functions:

- `asMessageArray` / `isMessageArray` — Normalize `Message | Message[]`.
- `getMessageExtra<T>(message, key, init?)` — Typed access into `message.extra` object by key. `init=true` auto-creates.
- `stripMessageId(s)` / `mapMessageId(s)` — ID manipulation.
- `mapMessageText(s)` / `asyncMapMessageText(s)` — Transform text content parts.
