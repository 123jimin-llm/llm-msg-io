## AGENTS.md for `src/api-codec-lib/`

Generic types and helpers for API step codecs. Everything lives under `step/`.

### Core Types

- `StepParams` — `{messages: Message[], functions?: FunctionDefinition[]}`. Input to a step encoder.
- `StepResult` — `{messages: Message[], token_usage?: TokenUsage}`. Output of a step decoder.
- `TokenUsage` — `{input_tokens, output_tokens, total_tokens?, cache_read_tokens?, reasoning_tokens?}`. Normalized token usage across providers.
- `FunctionDefinition` — `{name, description, parameters}` (arktype-validated, ignores undeclared keys).

### Encoder/Decoder Pattern

Mirrors the file-codec-lib pattern but for API request/response:

- `StepEncoder<APIRequestType>` — `(req: StepParams) => APIRequestType`.
- `StepDecoder<APIResponseType>` — `(api_res: APIResponseType) => StepResult`.
- `StepStreamDecoder<APIStreamType>` — `(api_stream: PromiseLike<APIStreamType>) => AsyncGenerator<StepStreamEvent, StepResult>`.

Each has a factory type (`CodecStep*`), an object-wrapper (`WithCreateStep*`), a union (`CodecStep*Like`), and a convenience constructor (`createStep*`).

### Composite Types

- `APIStepCodec` = `WithCreateStepEncoder` & `WithCreateStepDecoder`.
- `APIStepCodecWithStream` = `APIStepCodec` & `WithCreateStepStreamDecoder`.

### `stepResultPromiseToEvents`

Converts a `Promise<StepResult>` into a stream of `StepStreamEvent`s, useful for adapting non-streaming responses into the streaming interface.
