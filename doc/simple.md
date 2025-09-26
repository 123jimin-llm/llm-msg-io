# Specification for Simple Text Format

This is a specification for Simple Text Format, a text-based format for storing LLM messages.

The purpose for creating a text format is to simplify manual editing of chat history.

## Examples

```text
@user
Hi! Who are you?
@ai
Hello, I'm an AI, based on a large language model.
```

## File Structure

The Simple Text Format is a text file containing a sequence of lines.

- While the encoding of the file is not specified, UTF-8 is recommended.
- Either `\r\n` or `\n` can be used as a line separator. `\n` is strongly recommended.

Interpretation of the Simple Text Format is done line-by-line.

- If a line is not prefixed with `@`, then it's a *data* line.
- If a line is prefixed with `@`, then it's a *command* line.
  - There may be blanks (`[ \t]*`) between `@` and others.
- If a line is prefixed with `@@`, then it's a data line, but initial `@@` should be interpreted as a single `@`.

## Comment

A command line with `#` or `//` immediately after `@` is a comment.

A command line with `/*` immediately after `@` is starting a comment block.
A *matching* command line with `*/` immediately after `@` ends it.

```text
@# This is a comment.
@ // This is also a comment.
# This is *NOT* a comment.

@ /* A comment block is starting.
This line is ignored.
@/* A nested comment block is starting.
This line is ignored.
@*/
Still inside a comment block.
@ */ Any text on a command line ending a comment block is also ignored.
This line is not ignored.
```

It is an error to put an unmatched `@*/`.

## Command

A command is identified by its name `[a-z][a-z0-9]*` following `@`. Name should be in lowercase.

> [!NOTE]
> Currently, all command names consist of lower-case alphabets only.

A command line may supply *arguments* to the command in two ways.

The first is to provide them as a blank(`[ \t]+`)-separated list of `key=value`s.

- Key should match `^[a-z][a-z0-9]+$`, and should be in lowercase.
- Value should either be one of the followings:
  - An arbitrary string without any space(`[ \t]`) characters.
    - If the first letter and the last letter are same quote marks (`['"]`), the value would be treated as a quoted string.
  - A quoted string (like a [JSON5](https://json5.org/) string), with either `'` or `"` as quote marks.
    - There may be arbitrary amount of blanks, but must stay on one line (no `\` followed by a newline).
- There may be arbitrary amount of blanks (`[ \t]*`) before `key`, around `=`, or after `value`.

The second is to append a [JSON5](https://json5.org/) object after the name.
It must be written on one line, and any top-level value other than an object is disallowed.
Otherwise, anything is allowed, including comments.

```text
@user
@msg role=user
@msg {role:'user'}
```

### Mode

There are three classes of commands: `message`, `line`, and `block`.

- `message`: Starts a new message.
- `line`: Modifies the current message, using a data line following the command.
  - It is an error for a `line` command to not be followed by a data line.
- `block`: Modifies the current message, using multiple data lines following the command.
  - The `end` command ends the block.

### List

Here are every commands currently supported:

| Name | Mode | Description | Alias |
|------|------|-------------|-------|
| `message` | message | Starts a new message. | `msg` |
| `user` | message | Starts a new message with role `user`. | |
| `assistant` | message | Starts a new message with role `assistant`. | `ai` |
| `system` | message | Starts a new message with role `system`. | `sys` |
| `developer` | message | Starts a new message with role `developer`. | `dev` |
| `tool` | message | Starts a new message with role `tool`. | |
| `raw` | message, block | Includes a raw message. | |
| `call` | line | Invokes a tool. | |
| `embed` | line | Embeds a resource. | |

## `message` command

## `raw` command

## `call` command

## `embed` command
