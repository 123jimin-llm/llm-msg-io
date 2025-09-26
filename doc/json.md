# JSON serialization

The JSON codec emits a single JSON value that contains every message and an optional metadata object.

- **Without metadata**: Output is an array of serialized message objects. 
- **With metadata**: Output is an object `{metadata: ..., messages: [...]}`.

Either format can be used for deserialization.

## NDJSON

- Each message is written on its own line as a JSON object.
- If metadata is provided, it will be emitted on the first line, wrapped in an object `{metadata: ...}`.
- Lines are separated with a single `\n` (LF).

For deserialization, each line (after trimming) must either be empty, or a JSON object.
If the first value contains the unique key `metadata`, it will be treated as metadata. Otherwise, it will be treated as a message.