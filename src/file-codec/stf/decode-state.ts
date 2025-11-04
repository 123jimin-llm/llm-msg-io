import { concatContentsTo, type Message } from "../../message/index.js";

export interface DecodeState {
    /** List of messages. */
    readonly messages: Message[];
    
    /** Current message to process. */
    curr_message: Message|null;

    /** Line number of last seen command line. */
    curr_command_line_no: number;

    /** Line number of last seen data line. */
    curr_data_line_no: number;

    /** List of buffered data lines. */
    curr_lines: string[];
}

export function createDecodeState(): DecodeState {
    return {
        messages: [],
        
        curr_message: null,
        
        curr_command_line_no: 0,
        curr_data_line_no: 0,

        curr_lines: [],
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
    const role = params.role ?? state.curr_message?.role ?? null;
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

export function flushDecodeState(state: DecodeState) {
    const { curr_lines } = state;
    if(curr_lines.length > 0) {
        let curr_message = state.curr_message;
        if(curr_message == null) {
            curr_message = startNewMessage(state, { line_no: state.curr_data_line_no });
        }

        curr_message.content = concatContentsTo(curr_message.content, curr_lines.join('\n'));
        curr_lines.length = 0;
    }

    state.curr_message = null;
}