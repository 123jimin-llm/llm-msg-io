# File Codecs

## Structured-data codecs (JSON / NDJSON / TOML)

Three codecs that share the same canonical shape:

```jsonc
// with metadata
{"metadata": ..., "messages": [...]}
// without metadata (JSON only)
[...]
```

## JSON

### Encoding

| Metadata supplied? | Output shape             |
| ------------------ | ------------------------ |
| No                 | `Message[]` (bare array) |
| Yes                | `{metadata, messages}`   |

### Decoding

The decoder accepts **either a JSON string or a pre-parsed value**. After parsing, the value is handed to `asDecodedData`, which recognises three shapes:

- **Array** → treated as a message list.
- **Object with `messages` key** → `messages` is validated as a message list; `metadata` is preserved if present.
- **Any other object** → treated as a single message.

## NDJSON

### Encoding

One JSON object per line, separated by `\n` (LF). If metadata is provided it is emitted first, wrapped as `{"metadata": ...}`.

### Decoding

Input must be a string. Each line is trimmed; empty lines are skipped; every non-empty line must parse to a JSON **object** (arrays / primitives are rejected).

The **first** non-empty object is inspected: if its only key is `metadata`, it is consumed as metadata. All remaining objects (and the first object, when it is not metadata) become messages.

## TOML

### Encoding

Always emits the `{metadata, messages}` object shape (TOML requires a top-level table, so a bare array is not possible). `metadata` may be undefined.

### Decoding

Input must be a string. The parsed TOML table is returned as-is and then processed by `asDecodedData` (same rules as JSON decoding).

## STF

A line-oriented plain-text format designed for hand-editing LLM conversations. See [STF documentation](./stf/README.md).