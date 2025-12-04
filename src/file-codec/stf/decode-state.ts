import { concatContentsTo, type Message } from "../../message/index.ts";

import type { Command, CommandArgs } from "./command/index.ts";

export interface DecodeState {
    /** List of messages. */
    readonly messages: Message[];

    /** Default role for a new message without role. */
    default_role: string|null;
    
    /** Current message to process. */
    curr_message: Message|null;

    /** Line number of last seen command line. */
    curr_command_line_no: number;

    /** Line number of last seen data line. */
    curr_data_line_no: number;

    /** Current command to feed arguments. */
    invoked: {
        command: Command,
        args: CommandArgs,
    }|null;

    /** List of buffered data lines. */
    buffered_lines: string[];
}

export function createDecodeState(): DecodeState {
    return {
        messages: [],
        
        default_role: null,
        curr_message: null,
        
        curr_command_line_no: 0,
        curr_data_line_no: 0,

        invoked: null,

        buffered_lines: [],
    };
}

export interface NewMessageParams {
    line_no: number;

    role: string;
    id: string;
    name: string;
}

export function startNewMessage(state: DecodeState, params: Partial<NewMessageParams>): Message {
    const line_no = params.line_no ?? Math.max(state.curr_command_line_no, state.curr_data_line_no);
    const role = params.role ?? state.curr_message?.role ?? state.default_role;
    if(role == null) throw new SyntaxError(`Line ${line_no+1}: Attempt to create a new message without a role.`);

    const message: Message = {
        role, content: "",
    };

    if(params.id !== (void 0)) {
        message.id = params.id;
    }

    if(params.name !== (void 0)) {
        message.name = params.name;
    }

    state.curr_message = message;
    state.messages.push(message);

    return message;
}

export function flushBufferedLines(state: DecodeState) {
    const { buffered_lines } = state;
    if(buffered_lines.length === 0) return;

    let curr_message = state.curr_message;
    if(curr_message == null) {
        if(buffered_lines.every((v) => v.match(/^[ \t]*$/))) {
            buffered_lines.length = 0;
            return;
        }

        curr_message = startNewMessage(state, { line_no: state.curr_data_line_no });
    }

    curr_message.content = concatContentsTo(curr_message.content, buffered_lines.join('\n'));
    buffered_lines.length = 0;
}

export function flushDecodeState(state: DecodeState) {
    flushBufferedLines(state);
    state.curr_message = null;
}