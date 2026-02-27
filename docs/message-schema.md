# Message Schema

All messages share one canonical `Message` type regardless of provider.

## Fields

| Field         | Type                      | Description                                            |
| ------------- | ------------------------- | ------------------------------------------------------ |
| `role`        | `string`                  | Sender role (provider-neutral).                        |
| `content`     | `string \| ContentPart[]` | Main message body.                                     |
| `reasoning?`  | `string \| ContentPart[]` | Chain-of-thought / thinking output.                    |
| `refusal?`    | `string \| ContentPart[]` | Refusal text (OpenAI).                                 |
| `tool_calls?` | `ToolCall[]`              | Tool/function calls made by the model.                 |
| `id?`         | `string`                  | Message identifier.                                    |
| `call_id?`    | `string`                  | For `tool` role: the tool-call ID this result answers. |
| `name?`       | `string`                  | Sender name.                                           |
| `extra?`      | `unknown`                 | Provider-specific data (keyed by provider name).       |

### `ContentPart`

Union of `text`, `image`, `audio`, and `file` parts. File-like parts share optional fields: `format`, `file_id`, `name`, `url`, `data`.

### `ToolCall`

| Field       | Type     | Description                |
| ----------- | -------- | -------------------------- |
| `name`      | `string` | Function name.             |
| `arguments` | `string` | JSON-encoded arguments.    |
| `id?`       | `string` | Provider-assigned call ID. |
| `call_id?`  | `string` | (Rarely used.)             |

## Provider Role Mapping

### OpenAI

Roles are passed through unchanged — `system`, `developer`, `user`, `assistant`, `tool` all map 1:1.

`tool` messages use `call_id` (falling back to `id`) as the `tool_call_id`.

### Gemini

| Canonical             | Gemini             | Notes                                                           |
| --------------------- | ------------------ | --------------------------------------------------------------- |
| `system`, `developer` | System instruction | Extracted from the message list and set as `systemInstruction`. |
| `user`                | `user`             |                                                                 |
| `assistant`           | `model`            | Decoding always produces `assistant`.                           |

`reasoning` is mapped to/from Gemini's `thought` parts. Thought signatures are round-tripped via `extra.gemini.thought_signatures`.

### Claude

| Canonical             | Claude                            | Notes                                                    |
| --------------------- | --------------------------------- | -------------------------------------------------------- |
| `system`, `developer` | System parameter                  | Extracted and joined into the top-level `system` string. |
| `user`                | `user`                            |                                                          |
| `assistant`           | `assistant`                       |                                                          |
| `tool`                | `user` (with `tool_result` block) | Merged into the preceding `user` turn when possible.     |

`reasoning` is mapped to/from Claude's `thinking` blocks. Thinking blocks (including redacted ones) are round-tripped via `extra.claude.thinking_blocks`.

Consecutive same-role messages are merged into a single turn (Claude requires strict user/assistant alternation).

## `extra` Namespace Keys

| Key      | Type          | Used by                                                          |
| -------- | ------------- | ---------------------------------------------------------------- |
| `gemini` | `GeminiExtra` | `thought_signatures` for thought-signature round-tripping.       |
| `claude` | `ClaudeExtra` | `thinking_blocks` for thinking/redacted-thinking round-tripping. |