import type { CodecDecoder } from "../../message/index.js";
import { parseCommandArgs } from "./command/index.js";
import { createDecodeState, flushDecodeState } from "./decode-state.js";

const BLANK_LINE_PATTERN = /^[ \t]*$/;
const COMMAND_LINE_PATTERN = /^;[ \t]*(\/\/|\/\*|\*\/|#|[a-z][a-z0-9]*)/i;

function parseDataLine(raw_line: string): string|null {
    if(raw_line.startsWith(';;')) {
        return raw_line.slice(1);
    }

    if(!raw_line.startsWith(';')) {
        return raw_line;
    }

    return null;
}

export const createDecoder: CodecDecoder<string> = () => (source) => {
    if(typeof source !== 'string') {
        throw new TypeError("`STFCodec` expected serialized data to be a string.");
    }

    const state = createDecodeState();
    let comment_depth = 0;

    const lines = source.split('\n');
    line_loop: for(let line_no = 0; line_no < lines.length; ++line_no) {
        const raw_line = lines[line_no] ?? "";
        const data_line = parseDataLine(raw_line);
        
        if(data_line != null) {
            state.curr_data_line_no = line_no;

            if(comment_depth > 0) {
                continue line_loop;
            }

            if(state.curr_message == null && !BLANK_LINE_PATTERN.test(data_line)) {
                throw new SyntaxError(`Line ${line_no + 1}: Unexpected data line before a message.`);
            }

            state.curr_lines.push(data_line);
            continue line_loop;
        }

        // STF command line
        state.curr_command_line_no = line_no;
        const command_match = raw_line.match(COMMAND_LINE_PATTERN);
        if(command_match == null) throw new SyntaxError(`Line ${line_no + 1}: Unknown command line.`)

        const command_name = command_match[1];

        // line comments
        if(command_name === "//" || command_name === "#") {
            continue line_loop;
        }

        // block comments
        if(command_name === "/*") {
            ++comment_depth;
            continue line_loop;
        }

        if(command_name === "*/") {
            if(comment_depth <= 0) {
                throw new SyntaxError(`Line ${line_no + 1}: Unexpected block comment end.`);
            }

            --comment_depth;
            continue line_loop;
        }

        if(comment_depth > 0) continue line_loop;

        // `end` command

        // other commands
    }

    if(comment_depth !== 0) {
        throw new SyntaxError(`Unterminated block comment.`);
    }

    flushDecodeState(state);

    return {
        messages: state.messages,
    };
};