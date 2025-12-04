import JSON5 from "json5";

import type { Message, CodecEncoder } from "../../message/index.ts";

const ROLE_COMMAND_MAP: Readonly<Record<string, string>> = {
    'user': 'user',
    'assistant': 'ai',
    'system': 'sys',
    'developer': 'dev',
    'tool': 'tool',
};

function quoteValue(value: string): string {
    if(value === "" || /[ \t'"]/.test(value)) {
        return JSON.stringify(value);
    }

    return value;
}

function escapeDataLine(line: string): string {
    if(line[0] === ';') return ";" + line;
    return line;
}

function escapeDataLines(s: string): string {
    return s.split('\n').map(escapeDataLine).join('\n');
}

export function stringify(message: Message): string {
    if(typeof message.content !== 'string') {
        return [
            ";raw",
            escapeDataLines(JSON5.stringify(message, null, 2)),
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
            `role=${quoteValue(message.role)}`
        );
    }

    if(message.name != null) {
        command_parts.push(`name=${quoteValue(message.name)}`);
    }

    if(message.id != null) {
        command_parts.push(`id=${quoteValue(message.id)}`);
    }

    const command_line = command_parts.join(' ');
    if(message.content === "") return command_line;

    const content_lines = escapeDataLines(message.content);
    return `${command_line}\n${content_lines}`;
}

export const createEncoder: CodecEncoder<string> = () => (messages): string => {
    return messages.map((message) => stringify(message)).join('\n');
};