import JSON5 from "json5";

import type {CommandArgs} from "./type.ts";

function scanBlank(s: string, i: number): number {
    while(i < s.length && (s[i] === ' ' || s[i] === '\t')) ++i;
    return i;
}

function scanNonBlank(s: string, i: number): number {
    while(i < s.length && s[i] !== ' ' && s[i] !== '\t') ++i;
    return i;
}

/**
 * Scan a single-line quoted literal that starts at s[i], where s[i] is ' or ".
 * - Returns the index immediately after the closing quote and the raw literal, inclusive of quotes.
 */
function scanQuoted(s: string, i: number): {end: number; literal: string} {
    const n = s.length;
    if(i >= n) throw new SyntaxError("Internal error: scanQuoted out of range.");

    const quote = s[i];
    if(quote !== '"' && quote !== "'") {
        throw new SyntaxError("Internal error: `scanQuoted` must start on a quote.");
    }

    let j = i+1;
    let escaped = false;

    for(; j < n; ++j) {
        const ch = s[j];

        if(ch === '\n') {
            throw new SyntaxError("Quoted value must be a single line; line feed not allowed.");
        }

        if(escaped) {
            escaped = false;
            continue;
        }

        if(ch === "\\") {
            escaped = true;
            continue;
        }

        if(ch === quote) {
            return {
                end: j+1,
                literal: s.slice(i, j+1),
            };
        }
    }

    throw new SyntaxError("Unterminated quoted string.");
}

export function parseCommandArgs(args_text: string, line_no: number = 0): CommandArgs {
    args_text = args_text.replaceAll(/^[ \t]*|[ \t]*$/g, '');

    if(args_text.length === 0) return {};
    if(args_text.startsWith('{')) {
        const parsed: unknown = JSON5.parse(args_text);
        if(parsed == null || typeof parsed !== 'object' || Array.isArray(parsed)) {
            throw new SyntaxError(`Line ${line_no+1}: Expected object literal after command name.`);
        }

        return parsed as CommandArgs;
    }

    const args: CommandArgs = {};

    let i = 0;
    const n = args_text.length;

    while(i < n) {
        i = scanBlank(args_text, i);
        if(i >= n) break;

        const key_start = i;
        if(!/[a-z]/i.test(args_text[i]!)) {
            throw new SyntaxError(`Line ${line_no+1}: Argument key must start with [a-z].`);
        }

        ++i;
        while(i < n && /[a-z0-9_]/i.test(args_text[i]!)) ++i;
        const key = args_text.slice(key_start, i);

        i = scanBlank(args_text, i);
        if(i >= n || args_text[i] !== '=') {
            throw new SyntaxError(`Line ${line_no+1}: Expected '=' after argument key.`);
        }

        ++i;
        i = scanBlank(args_text, i);

        if(i >= n) {
            throw new SyntaxError(`Line ${line_no + 1}: Expected value after '='.`);
        }

        let value: string;
        const ch = args_text[i];
        if(ch === '"' || ch === "'") {
            const {end, literal} = scanQuoted(args_text, i);

            try {
                const parsed = JSON5.parse(literal);
                if(typeof parsed !== 'string') {
                    throw new SyntaxError(`Line ${line_no + 1}: Quoted value must be a string.`);
                }
                value = parsed;
            } catch (e) {
                const msg = e instanceof Error ? e.message : String(e);
                throw new SyntaxError(`Line ${line_no + 1}: Invalid quoted string: ${msg}`, {cause: e});
            }

            i = end;
        } else {
            const j = scanNonBlank(args_text, i);
            const token = args_text.slice(i, j);

            if(token.endsWith('"') || token.endsWith("'")) {
                throw new SyntaxError(`Link ${line_no + 1}: Unquoted value cannot end with quotes.`);
            }

            value = token;
            i = j;
        }

        if(Object.prototype.hasOwnProperty.call(args, key)) {
            throw new SyntaxError(`Line ${line_no + 1}: Duplicate argument key '${key}'.`);
        }

        args[key] = value;
    }

    return args;
}
