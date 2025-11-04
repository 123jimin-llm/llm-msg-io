import type { CodecDecoder } from "../../message/index.js";
import { COMMAND_LOOKUP, CommandMode, parseCommandArgs } from "./command/index.js";
import { createDecodeState, flushBufferedLines, flushDecodeState } from "./decode-state.js";

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

            if(state.invoked?.command.mode === CommandMode.MONADIC) {
                if(state.buffered_lines.length > 0) throw new Error(`Line ${line_no + 1}: Internal error; buffer not empty.`);

                state.buffered_lines.push(data_line);
                state.invoked.command.execute(state, state.invoked.args);

                state.invoked = null;
                state.buffered_lines.length = 0;

                continue line_loop;
            }

            if(state.curr_message == null && !BLANK_LINE_PATTERN.test(data_line)) {
                throw new SyntaxError(`Line ${line_no + 1}: Unexpected data line before a message.`);
            }

            state.buffered_lines.push(data_line);
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

        if(command_name === "end") {
            if(!state.invoked) throw new SyntaxError(`Line ${line_no + 1}: Unexpected 'end' command.`);

            const { command, args: command_args } = state.invoked;
            if(command.mode !== CommandMode.POLYADIC) {
                throw new SyntaxError(`Line ${line_no + 1}: Unexpected 'end' command for a command '${command.name}'.`);
            }

            command.execute(state, command_args);

            state.invoked = null;
            state.buffered_lines.length = 0;

            continue line_loop;
        }

        // other commands

        if(state.invoked) {
            throw new SyntaxError(`Line ${line_no + 1}: Unexpected command '${command_name}' while a command '${state.invoked.command}' is being invoked.`);
        }

        flushBufferedLines(state);

        const command_args = parseCommandArgs(raw_line.slice(command_match[0].length), line_no);

        const command = COMMAND_LOOKUP.get(command_name);
        if(command == null) throw new SyntaxError(`Line ${line_no + 1}: Unknown command '${command_name}'.`);

        if(command.mode === CommandMode.NILADIC) {
            command.execute(state, command_args);
        } else {
            state.invoked = {
                command,
                args: command_args,
            };
        }
    }

    if(comment_depth !== 0) {
        throw new SyntaxError(`Unterminated block comment.`);
    }

    if(state.invoked) {
        throw new SyntaxError(`Unterminated '${state.invoked.command.name}' command.`)
    }

    flushDecodeState(state);

    return {
        messages: state.messages,
    };
};