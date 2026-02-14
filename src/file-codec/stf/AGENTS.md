## AGENTS.md for `src/file-codec/stf/`

STF (Simple Text Format) codec. See `/docs/stf/README.md` for the format spec and `/docs/stf/command.md` for command reference.

### Encoder (`encoder.ts`)

`stringify(message)` converts a single `Message` to STF text. Falls back to `;raw` + JSON5 for non-string content. `createEncoder` joins `stringify` results with `\n`.

Role shorthand map: `user`→`;user`, `assistant`→`;ai`, `system`→`;sys`, `developer`→`;dev`, `tool`→`;tool`. Other roles use `;msg role=<role>`.

Data lines starting with `;` are escaped by doubling to `;;`.

### Decoder (`decoder.ts`)

Line-by-line parser. Maintains `DecodeState` (see `decode-state.ts`) with a current message, buffered data lines, and comment depth.

Options: `default_role` — if set, data lines before a message command auto-create a message with this role instead of erroring.

### `decode-state.ts`

`DecodeState` — Parser state: `messages[]`, `curr_message`, `buffered_lines[]`, `invoked` (active polyadic command), comment tracking.

Key helpers: `startNewMessage()`, `flushBufferedLines()` (appends buffered text to current message), `flushDecodeState()`.

### `command/`

Command registry and argument parsing:

- `type.ts` — `Command` interface and `CommandMode` enum (`NILADIC`, `MONADIC`, `POLYADIC`).
- `args.ts` — `parseCommandArgs()`: parses `key=value` pairs or a JSON5 object from command arguments. Supports quoted strings.
- `message.ts` — Role commands (`system`/`sys`, `developer`/`dev`, `user`, `assistant`/`ai`, `tool`), `message`/`msg`, `raw`.
- `misc.ts` — `flush` command.
- `index.ts` — Builds `COMMAND_LOOKUP` map from all commands + aliases.
