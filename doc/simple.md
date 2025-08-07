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

## Specification

### File

The Simple Text Format is a text file containing a sequence of lines.

- While the encoding of the file is not specified, UTF-8 is recommended.
- Either `\r\n` or `\n` can be used as a line separator. `\n` is strongly recommended.

### Lines

