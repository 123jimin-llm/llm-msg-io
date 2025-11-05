import { type } from "arktype";
import JSON5 from "json5";
import { Message } from "../../../message/index.js";
import { NewMessageParams, startNewMessage } from "../decode-state.js";
import { Command, CommandMode } from "./type.js";

const RoleCommandArgs = type({
    id: "string?",
    name: "string?",
});

const MessageArgs = RoleCommandArgs.merge({
    role: "string?",
});

function createNewMessageParams(args: typeof MessageArgs.infer): Partial<NewMessageParams> {
    return {
        role: args.role,
        id: args.id,
        name: args.name,
    };
}

function createRoleCommand(name: string, alias_list?: string[]): Command {
    return {
        mode: CommandMode.NILADIC,
        name, alias_list,
        execute(state, raw_args) {
            const args = RoleCommandArgs.assert(raw_args);
            startNewMessage(state, createNewMessageParams({
                ...args,
                role: name,
            }));
        },
    };
}

const COMMAND_MESSAGE: Command = {
    mode: CommandMode.NILADIC,
    name: "message", alias_list: ["msg"],
    execute(state, raw_args) {
        const args = MessageArgs.assert(raw_args);
        startNewMessage(state, createNewMessageParams(args));
    },
};

const COMMAND_RAW: Command = {
    mode: CommandMode.POLYADIC,
    name: "raw",
    execute(state) {
        state.curr_message = null;
        state.messages.push(Message.assert(JSON5.parse(state.buffered_lines.join('\n'))));
    },
};

export const MESSAGE_COMMANDS: Command[] = [
    createRoleCommand("system", ["sys"]),
    createRoleCommand("developer", ["dev"]),
    createRoleCommand("user"),
    createRoleCommand("assistant", ["ai"]),
    createRoleCommand("tool"),

    COMMAND_MESSAGE,
    COMMAND_RAW,
];