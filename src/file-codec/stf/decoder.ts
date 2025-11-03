import type { CodecDecoder } from "../../message/index.js";
import { createDecodeState, finalizeDecodeState } from "./decode-state.js";

export const createDecoder: CodecDecoder<string> = () => (source) => {
        if(typeof source !== 'string') {
            throw new TypeError("`STFCodec` expected serialized data to be a string.");
        }

        const state = createDecodeState();
        let comment_depth = 0;

        const lines = source.split('\n');
        line_loop: for(let line_no = 0; line_no < lines.length; ++line_no) {
            const raw_line = lines[line_no] ?? "";
            let data_line: string|null = null;

            if(raw_line.startsWith(';;')) {
                data_line = raw_line.slice(1);
            } else if(!raw_line.startsWith(';')) {
                data_line = raw_line;
            }

            // STF data line
            if(data_line != null) {
                state.curr_data_line_no = line_no;

                if(comment_depth > 0) {
                    continue line_loop;
                }

                if(state.curr_message == null && !/^[ \t]*$/.test(data_line)) {
                    throw new SyntaxError(`Line ${line_no + 1}: Unexpected data line before a message.`);
                }

                state.curr_lines.push(data_line);
                continue line_loop;
            }

            // STF command line
            const command_line = raw_line.slice(1).trimStart();
            state.curr_command_line_no = line_no;

            // line comments
            if(command_line.startsWith('#') || command_line.startsWith('//')) {
                continue line_loop;
            }

            // block comments
            if(command_line.startsWith('/*')) {
                ++comment_depth;
                continue line_loop;
            }

            if(command_line.startsWith('*/')) {
                if(comment_depth <= 0) {
                    throw new SyntaxError(`Line ${line_no + 1}: Unexpected block comment end.`);
                }

                --comment_depth;
                continue line_loop;
            }

            if(comment_depth > 0) continue;
        }

        if(comment_depth !== 0) {
            throw new SyntaxError(`Unterminated block comment.`);
        }

        finalizeDecodeState(state);

        return {
            messages: state.messages,
        };
};