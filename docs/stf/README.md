# Simple Text Format (STF) Specification

STF is a line-oriented plain-text format for storing LLM messages, designed to be readable and editable by humans in any text editor.

For the catalogue of commands, see [command.md](./command.md).

## Example

```text
;user
Hi! Who are you?
;ai
Hello, I'm an AI, based on a large language model.
```

## Goals

- **Human-editable**: easy to read and write in a text editor.
- **Use cases**: chat UIs, prompt libraries / templates, browseable chat archives.

## Non-Goals

- Not a template language (use Jinja, Nunjucks, etc. alongside STF).
- Does not parse or translate tokenizer-specific special tokens (e.g. `<|start|>`).
- Does not validate message semantics (e.g. role names).
- Not designed to resist injection attacks.

## Terminology

- **Line separator**: `\n` only. `\r` and `\r\n` are not recognized.
- **Blank character**: space (`\x20`) or tab (`\t`). No other whitespace qualifies.
- **Blanks**: one or more blank characters (`[ \t]+`).

## File Structure

UTF-8 text, read line-by-line. A file may end with an empty line, which is ignored.

### Line Types

Every line is classified by its first character(s):

| Prefix     | Classification          | Notes                                                                     |
| ---------- | ----------------------- | ------------------------------------------------------------------------- |
| *(no `;`)* | **Data line**           | A line like `␣;foo` (where `␣` is a space) is a data line, not a command. |
| `;`        | **Command line**        | The leading `;` is the command **header**.                                |
| `;;`       | **Data line** (escaped) | The initial `;;` is read as a literal `;`.                                |

### Message State

The parser maintains a **message state**: either *nil* or a *message*.

- **Nil state**: blank/empty data lines are ignored. A non-empty data line or a command that requires a message is an error (unless `default_role` is set — see [Decoder options](#decoder-options)).
- **Message state**: data lines are appended to the current message's content.

## Data Lines

Consecutive data lines form a string value: the lines joined by `\n`. The final line's trailing newline is **not** included — append an empty line to produce one:

```text
;user
Hello

```

Decodes as `"Hello\n"` (the empty line after `Hello` adds the trailing newline; the file's final empty line is ignored per file-structure rules).

## Comments

A command line whose header is followed (with optional blanks) by `#`, `//`, `/*`, or `*/` is a **comment line**.

| Marker    | Scope                                       |
| --------- | ------------------------------------------- |
| `#`, `//` | Line comment — the entire line is ignored.  |
| `/*`      | Opens a block comment. Block comments nest. |
| `*/`      | Closes the innermost block comment.         |

Inside a block comment, **all** lines (data and command) are ignored — except `; /*` and `; */`, which adjust nesting depth. Unmatched `/*` or `*/` is an error.

```text
;# line comment
; // also a line comment

; /* block start
ignored
;/* nested block
;*/ closes inner
;*/ closes outer

not ignored
```

## Command Lines

Structure: **header** (`;`) → optional blanks → **name** (`[a-z][a-z0-9]*`) → **arguments**.

For the full command catalogue, see [command.md](./command.md).

### Command Arguments

Two syntaxes (some commands, like `end`, use neither):

#### `key=value` pairs

Pairs separated by blanks.

- Keys: `[a-z][a-z0-9_]*`.
- Values: unquoted (no blanks, not starting/ending with `'`/`"`), or JSON5-style quoted string (single line only).

```text
;msg role=user name="John Doe"
```

#### JSON5 object

A single-line JSON5 object literal after the name.

```text
;msg {role:'user', name:"John Doe"}
```

## Encoding

When encoding `Message` objects to STF:

- Known roles use shorthand commands: `user` → `;user`, `assistant` → `;ai`, `system` → `;sys`, `developer` → `;dev`, `tool` → `;tool`. Other roles use `;msg role=<role>`.
- `name`, `id`, and `call_id` fields are emitted as command arguments when present.
- Data lines starting with `;` are escaped to `;;`.
- Messages with non-string content (i.e. `ContentPart[]`) fall back to `;raw` + JSON5.
- The `extra` field, when present, is emitted as an `;extra` … `;end` block after the content lines.

## Encoder Options

| Option  | Type      | Default | Description                                          |
| ------- | --------- | ------- | ---------------------------------------------------- |
| `extra` | `boolean` | `true`  | Whether to emit `;extra` blocks for `message.extra`. |

## Decoder Options

| Option         | Type             | Default | Description                                                                                             |
| -------------- | ---------------- | ------- | ------------------------------------------------------------------------------------------------------- |
| `default_role` | `string \| null` | `null`  | When set, data lines encountered in nil state auto-create a message with this role instead of erroring. |
