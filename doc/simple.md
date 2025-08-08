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
- If a line is prefixed with `@@`, then it's a data line, but intiial `@@` should be interpreted as a single `@`.

## Command

A command is identified by its name `[a-z][a-z0-9]+`. Name should be in lowercase. There may be blanks (`[ \t]*`) between `@` and the command name.

A command line may supply *arguments* to the command in two ways.

The first is to provide them as a blank(`[ \t]+`)-separated list of `key=value`s.

- Key should match `^[a-z][a-z0-9]+$`, and should be in lowercase.
- Value should either be one of the followings:
  - An arbitrary string without any space(`[ \t]`) characters.
    - If the first letter and thel last letter are same quote marks (`['"]`), the value would be treated as a quoted string.
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

## Roles

