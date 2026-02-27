## AGENTS.md for `src/file-codec/stf/`

STF (Simple Text Format) codec. See `/docs/stf/README.md` for the format spec and `/docs/stf/command.md` for command reference.

### Encoder (`encoder.ts`)

`stringify(message)` converts a single `Message` to STF text. Falls back to `;raw` + JSON5 for non-string content. `createEncoder` joins `stringify` results with `\n`.

Role shorthand map: `user`→`;user`, `assistant`→`;ai`, `system`→`;sys`, `developer`→`;dev`, `tool`→`;tool`. Other roles use `;msg role=<role>`.

Data lines starting with `;` are escaped by doubling to `;;`.

### Decoder (`decoder.ts`)

Line-by-line parser. Comment depth is tracked as a local variable in the decoder, not in `DecodeState`.

The `end` command and line/block comments (`//`, `#`, `/* */`) are handled directly by the decoder loop, not via the command registry.

Options: `default_role` — if set, data lines before a message command auto-create a message with this role instead of erroring.

### `decode-state.ts`

`DecodeState` — Parser state: `messages[]`, `curr_message`, `buffered_lines[]`, `invoked` (active command being fed data), `default_role`, line number tracking (`curr_command_line_no`, `curr_data_line_no`).

Key helpers: `startNewMessage()`, `flushBufferedLines()` (appends buffered text to current message via `concatContentsTo`), `flushDecodeState()`.

### `command/`

Command registry and argument parsing:

- `type.ts` — `Command` interface and `CommandMode` frozen object (`NILADIC: 0`, `MONADIC: 1`, `POLYADIC: -1`).
- `args.ts` — `parseCommandArgs()`: parses `key=value` pairs or a JSON5 object from command arguments. Supports quoted strings.
- `message.ts` — Role commands (`system`/`sys`, `developer`/`dev`, `user`, `assistant`/`ai`, `tool`), `message`/`msg`, `raw`. `raw` is polyadic and parses buffered lines as JSON5.
- `misc.ts` — `flush` command.
- `index.ts` — Builds `COMMAND_LOOKUP` map from all commands + aliases.
