## AGENTS.md for `src/api-codec-lib/`

Generic types and helpers for API step codecs. Everything lives under `step/`.

### Core Types

- `StepParams` — `{messages, functions?, response_schema?}`. Input to a step encoder.
- `StepResult` — `{messages, token_usage?}`. Output of a step decoder.
- `TokenUsage` — `{input_tokens, output_tokens, total_tokens?, cache_read_tokens?, reasoning_tokens?}`. Normalized across providers.
- `JSONSchema` — Type alias for `unknown`. Opaque blob passed through to providers.
- `FunctionDefinition` — `{name, description, parameters: JSONSchema}` (arktype-validated, `onUndeclaredKey('ignore')`).
- `ResponseSchema` — `{name?, description?, strict?, schema: JSONSchema}`. All three providers implement it.

### Encoder/Decoder Pattern

Mirrors the file-codec-lib pattern but for API request/response. Each concept has four layers:

| Layer            | Encoder           | Decoder           | Stream Decoder                                   |
| ---------------- | ----------------- | ----------------- | ------------------------------------------------ |
| Inner function   | `StepEncoder`     | `StepDecoder`     | `StepStreamDecoder` → `StepStreamEventGenerator` |
| Factory          | `CodecStep*`      | `CodecStep*`      | `CodecStep*`                                     |
| Object wrapper   | `WithCreateStep*` | `WithCreateStep*` | `WithCreateStep*`                                |
| Convenience ctor | `createStep*()`   | `createStep*()`   | `createStep*()`                                  |

`StepStreamDecoder` accepts `PromiseLike<APIStreamType>` → `AsyncGenerator<StepStreamEvent, StepResult>` (`StepStreamEventGenerator`).

### Composite Types

- `APIStepCodec` = `WithCreateStepEncoder` & `WithCreateStepDecoder`.
- `APIStepCodecWithStream` = `APIStepCodec` & `WithCreateStepStreamDecoder`.

### `stepResultPromiseToEvents`

Adapts a `Promise<StepResult>` into `StepStreamEventGenerator` by replaying each result message through `StepStreamState`. Useful for presenting non-streaming responses through the streaming interface.
