# Simple Text Format Specification

## Introduction

Simple Text Format (STF) is a text-based format for storing LLM messages.

### Example

```text
;user
Hi! Who are you?
;ai
Hello, I'm an AI, based on a large language model.
```

### Goals

STF aims to be an intuitive text-based format that's easy to be edited by a human with a text editor, without much hassle.

STF is expected to be used for the following scenarios:

- Chat UI, for the user to input and edit multiple messages in a text-based manner.
- Prompt library for LLM applications, to be used in/as templates.
- Chat history archive which can be easily browsed by a human.

### Non-Goals

STF does not handle message validation, such as checking for valid role types.

STF is **not** a template language by itself.
A template language, such as Jinja, may be used in conjunction with STF.

Be aware that preventing accidental injection attack vulnerabilities is currently not a goal of STF.

### Terminology

- A **line separator** is a line feed `\n`.
  - In particular, a carriage return `\r` or a CRLF `\r\n` is not considered as a line separator.
- A **blank character** is either a space `\x20` or a tab `\t`.
  - In particular, a line feed, a carriage return, a vertical tab, or a form feed is not considered as a blank character.
- **Blanks** is one or more blank characters, matching the regular expression `[ \t]+`.

## File Structure

An STF file is a text file, written and read (mostly) line-by-line.

- An STF file should use UTF-8 encoding, with `\n` as line separators.
- An STF file may end with an empty line, which will be ignored.

### Line Types

- If a line is not prefixed with `;`, then it's a **data line**.
- If a line is prefixed with `;`, then it's a **command line**.
  - No blanks are allowed before the first `;`, as that would be a data line instead.
  - This first `;` is called the **header** of the command.
  - Some command lines specify comments, as described later.
- If a line is prefixed with `;;`, then it's a **data line**, where the initial `;;` is interpreted as a single `;`.

## Data Line

A continuous chunk of data lines specify a string value, which is the concatenation of the lines with a single line feed `\n` between them.

The last line's line feed shall be removed. To specify a string value with a trailing line feed, the last line should be followed by an empty line.

## Comments

If a command line's header is followed (optionally with blanks in between) by `#`, `//`, `/*`, or `*/`, then it's a **comment line**.

`#` and `//`  are line comments, where the whole line is ignored.

`/*` and `*/` are block comments. A comment line with `*/` finishes a block comment started by a *matching* `/*`.

```
# This is *NOT* a comment.
/* Neither is this! */

;# This is a comment.
; // This is also a comment.

; /* A comment block is starting.
This line is ignored.

;/* A nested comment block is starting. Note that the trailing `*/` is ignored. */
This line is ignored.

;*/
Still inside a comment block.
; */ All comment blocks are now closed. Still, any text after `*/` is also ignored.

This line is not ignored.
```

It is an error to put an unmatched `/*` or `*/` comment line.

## Command Line

A command line consists of three part: the **header** `;`, the **name**, and the **arguments**.

Blanks may present between the header and the name.

### Command Name

The command name is identified by its name `[a-z][a-z0-9]*` following the header.

### Command Arguments

There are two ways to supply arguments to a command.

Note that some special commands (such as `end`) may receive a different form of arguments.

#### by `key=value`

The first way of providing arguments is to provide them as a list of `key=value`s separated by blanks.

- All keys should match `^[a-z][a-z0-9]+$`, all in lowercase.
- All values should be one of the followings:
  - An arbitrary string without any blank characters, and neither starts nor ends with `'` or `"`.
  - A quoted string (like a JSON5 string), with either `'` or `"` as the quote character.
    - The string must stay on a single line; no `\` followed by a line feed is allowed.

```
;msg role=user name="John Doe"
```

#### by JSON5

The second way is to append a [JSON5](https://json5.org/) object after the name, with or without blanks in between.

It must stay on a single line, and the top-level object must be an object literal. Otherwise, anything is allowed, including comments.

```
;msg {role:'user', name:"John Doe"}
```

### Classification

Commands can be classified into different modes based on how they consume following data lines.

- `niladic`: The command does not consume any data line.
- `monadic`: The command consumes a single data line as its argument.
- `polyadic`: The command consumes multiple data lines as its argument.

For a polyadic command, a special command line with name `end` is used to mark the end of the argument.

Moreover, the command can be classified into different modes based on how it modifies the current message.

- `start`: The command starts a new message.
- `modify`: The command modifies the current message.
- `other`: The command does not directly modify a message.



--------

(old guide)

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
