## AGENTS.md for `src/message/`

Canonical message schema, streaming infrastructure, and message utilities.

### `schema/`

Defines core types with `arktype`, all exported via `exportType()`:

- `Message` — Dual-natured: TypeScript `interface` for typing AND runtime `PublicType` validator. Fields: `role`, `content`, optional `id`, `call_id`, `name`, `reasoning`, `refusal`, `tool_calls`, `extra`.
- `MessageContent` — `string | ContentPart[]`.
- `ContentPart` — Union of `ContentPartText`, `ContentPartImage`, `ContentPartAudio`, `ContentPartFile`. File-like parts share a base type with `format?`, `file_id?`, `name?`, `url?`, `data?`.
- `ToolCall` — `{name, arguments, id?, call_id?, extra?}`.
- `MessageDelta` — `Partial<Omit<Message, 'tool_calls'>> & {tool_calls?: ToolCallDelta[]}`. `ToolCallDelta` is index-keyed.
- `MessageArray` — Validated `Message[]`.

`content.ts` also exports helpers: `textToContentPart`, `textToContentPartArray`, `messageContentToText`, `messageContentToTextArray`, `concatContents`, `concatContentsTo`. `concatContentsTo` mutates `ContentPart[]` targets in-place.

### `stream/`

Streaming event system for incremental message construction:

- `StepStreamEvent` — Discriminated union: `content.delta`, `reasoning.delta`, `refusal.delta`, `tool_call.start/delta/end`, `role`, `stream.start/end/error`.
- `StepStreamState` — Mutable accumulator: `{message, tool_calls: Map<number, ToolCall>, tool_call_started: Set<number>}`.
- `createStepStreamState()` → fresh state. `applyDeltaToStepStreamState()` yields events from a `MessageDelta`. `finalizeStepStreamState()` yields `tool_call.end` events, assembles `message.tool_calls` sorted by index, and defaults role to `'assistant'`.

### `util.ts`

Message-level helpers:

- `isMessageArray` / `asMessageArray` — Normalize `Message | Message[]`.
- `getMessageExtra<T>(message, key, init?)` — Typed access into `message.extra` by key. `init=true` auto-creates nested object.
- `stripMessageId` / `stripMessageIds` — Remove IDs (single / batch).
- `mapMessageId` / `mapMessageIds` — Remap IDs via `Map` or `Record` (single / batch).
- `mapMessageText` / `mapMessageTexts` — Transform text content parts (single / batch).
- `asyncMapMessageText` / `asyncMapMessageTexts` — Async variant.
