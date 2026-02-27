## AGENTS.md for `src/api-codec-lib/`

### Layering Pattern

Each encoder/decoder/stream-decoder concept has four layers:

1. Inner function (`StepEncoder` / `StepDecoder` / `StepStreamDecoder`)
2. Factory (`CodecStep*`) — accepts options, returns inner function
3. Object wrapper (`WithCreateStep*`) — `{ createStep*: Factory }`
4. Convenience constructor (`createStep*()`) — accepts factory-or-wrapper + options

This mirrors `file-codec-lib`'s pattern. Provider codecs implement layer 2–3; consumers use layer 4.

### `stepResultPromiseToEvents`

Adapts a `Promise<StepResult>` into `StepStreamEventGenerator` by replaying result messages through `StepStreamState`. Use this to present non-streaming responses through the streaming interface.

### `FunctionDefinition`

Validated with `onUndeclaredKey('ignore')` — extra fields from providers pass through without error.
