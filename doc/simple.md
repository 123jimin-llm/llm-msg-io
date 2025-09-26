# Simple Text Format

Simple Text Format (STF) is a text-based format for storing LLM messages.

## Goals

STF aims to:

- Be a text-based format that's intuitive to understand, including for non-programmers.
- Easy to edit by a human with a text editor, without much hassle.
- Easy chat history management, potentially with external attached assets.
- Flexible format that enables (mostly) lossless roundtrip between memory and disk.

STF is expected to be used for the following scenarios:

- Chat UI, for the user to input and edit multiple messages in a text-based manner.
- Prompt library for LLM applications, to be used in/as templates.
- Chat history archive which can be easily browsed by a human.

### Non-Goals

STF does not handle message validation, such as checking for valid role types.

STF is **not** a template language by itself.
A template language, such as Jinja, may be used in conjunction with STF.

Be aware that it is currently not a goal to prevent injection attacks when templates are used.

## Example

```text
@user
Hi! Who are you?
@ai
Hello, I'm an AI, based on a large language model.
```

## Specification

### Encoding

An STF file is a text file, written and read (mostly) line-by-line.

- An STF file shall use UTF-8 encoding, with `\n` as line separators.
- An STF file may end with an empty line, which will be ignored.

### Line Types

- If a line is not prefixed with `@`, then it's a **data line**.
- If a line is prefixed with `@`, then it's a **command line**.
  - There may be blanks (`[ \t]*`) between the prefix `@` and the rest.
- If a line is prefixed with `@@`, then it's a **data line**, where the initial `@@` is interpreted as a single `@`.


### Comment

### Command

--------

TODO: Improve spec text.

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
