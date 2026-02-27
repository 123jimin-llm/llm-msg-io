# STF Commands

## Classification

Commands can be classified into different modes based on how they consume following data lines.

- `niladic`: The command does not consume any data line.
- `monadic`: The command consumes a single data line as its argument.
- `polyadic`: The command consumes multiple data lines as its argument.

For a polyadic command, a special command line with name `end` is used to mark the end of the argument.
It is an error to put a non-comment command between a polyadic command and the matching `end` command.

## Starting a New Message

These commands create a new message, replacing the message state.

In this section, "previous message" refers to the value of the message state before being replaced.
It is an error to attempt to use a value from the previous message if it is nil.

### `message`

- Mode: **niladic**

The `message` (`msg` for alias) command starts a new message.

The command accepts the following optional arguments:

- `role`: The role of the message. If not provided, role of the previous message is used.
- `name`: The name of the sender of the message.
- `id`: Unique ID for a message.

> [!NOTE]
> STF does *not* enforce uniqueness of a message ID.

### Role Commands

- Mode: **niladic**

For commonly used roles (taken from OpenAI Harmony Response Format), the following commands are provided.

| Name        | Alias |
| ----------- | ----- |
| `system`    | `sys` |
| `developer` | `dev` |
| `user`      |       |
| `assistant` | `ai`  |
| `tool`      |       |

For example, `;assistant` and `;ai` both are equivalent to `;msg role=assistant`.

These commands accept the same set of arguments as the `message` command, excluding `role`.

### `raw`

- Mode: **polyadic**

To provide a raw message in JSON5 format, use this command.

```
;raw
{
    "role": "user",
    "content": "Hello, world!",
}
;end
```

## Miscellaneous

### `flush`

- Mode: **niladic**

This command clears the message state, setting it to the nil value.

### `end`

`end` is a special command that marks the end of data lines for a polyadic command.

Arguments for `end` do not follow the syntax of other commands.
Any string following `end` is allowed, as long as the first character is not `[0-9a-zA-Z]`.