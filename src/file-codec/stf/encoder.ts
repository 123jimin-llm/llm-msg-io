import JSON5 from "json5";

import type {Message} from "../../message/index.ts";
import type {CodecEncoder} from "../../file-codec-lib/index.ts";

const ROLE_COMMAND_MAP: Readonly<Record<string, string>> = {
    user: 'user',
    assistant: 'ai',
    system: 'sys',
    developer: 'dev',
    tool: 'tool',
};

function quoteValue(value: string): string {
    if(value === "" || /[ \t'"]/.test(value)) {
        return JSON.stringify(value);
    }

    return value;
}

/** Escape a single line for STF data output (`;;` prefix for lines starting with `;`). */
export function escapeStfLine(line: string): string {
    if(line[0] === ';') return ";" + line;
    return line;
}

/** Escape a multi-line string for STF data output, applying `escapeStfLine` to each line. */
export function escapeStfContent(s: string): string {
    return s.split('\n').map(escapeStfLine).join('\n');
}

export function stringify(message: Message): string {
    if(typeof message.content !== 'string') {
        return [
            ";raw",
            escapeStfContent(JSON5.stringify(message, null, 2)),
            ";end",
        ].join('\n');
    }

    const command_parts: string[] = [];
    const command = ROLE_COMMAND_MAP[message.role];

    if(command) {
        command_parts.push(`;${command}`);
    } else {
        command_parts.push(
            ";msg",
            `role=${quoteValue(message.role)}`,
        );
    }

    if(message.name != null) {
        command_parts.push(`name=${quoteValue(message.name)}`);
    }

    if(message.id != null) {
        command_parts.push(`id=${quoteValue(message.id)}`);
    }

    if(message.call_id != null) {
        command_parts.push(`call_id=${quoteValue(message.call_id)}`);
    }

    const command_line = command_parts.join(' ');
    if(message.content === "") return command_line;

    const content_lines = escapeStfContent(message.content);
    return `${command_line}\n${content_lines}`;
}

export const createEncoder: CodecEncoder<string> = () => (messages): string => {
    return messages.map((message) => stringify(message)).join('\n');
};
