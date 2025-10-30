# STF Commands

## Classification

Commands can be classified into different modes based on how they consume following data lines.

- `niladic`: The command does not consume any data line.
- `monadic`: The command consumes a single data line as its argument.
- `polyadic`: The command consumes multiple data lines as its argument.

For a polyadic command, a special command line with name `end` is used to mark the end of the argument.

Moreover, the command can be classified into different modes based on how it modifies the current message.

- `start`: The command starts a new message.
- `modify`: The command modifies the current message.
- `other`: The command does not directly modify a message.

## Starting a New Message

These commands create a new message, replacing the message state.

In this section, "previous message" refers to the value of the message state before being replaced.
It is an error to attempt to use a value from the previous message if it is nil.

### `message`

The `message` (`msg` for alias) command starts a new message.

The command accepts following optional argument:

- `role`: The role of the message. If not provided, the role of previous message is used.

### `raw`

### Role Commands

For commonly used roles (taken from OpenAI Harmony Response Format), the following commands are provided.

| Name | Alias |
| ---- | ----- |
| `system` | `sys` |
| `developer` | `dev` |
| `user` | |
| `assistant` | `ai` |
| `tool` | |

For example, `;assistant` and `;ai` both are equivalent to `;msg role=assistant`.

### Channel Commands

## Appending Message Parts

## Miscellaneous

### `end`
