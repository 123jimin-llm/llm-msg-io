import { type } from "arktype";
import { DecodeState, startNewMessage } from "../decode-state.js";
import { Command, CommandParamType } from "./type.js";

function createRoleCommand(name: string, alias_list?: string[]): Command {
    return {
        param_type: CommandParamType.NILADIC,
        name, alias_list,
        execute(state: DecodeState) {
            startNewMessage(state, {role: name});
        },
    };
}

const MessageArgs = type({
    role: "string?",
    id: "string?",
    name: "string?",
});

const COMMAND_MESSAGE: Command = {
    param_type: CommandParamType.NILADIC,
    name: "message", alias_list: ["msg"],
    execute(state, raw_args) {
        const args = MessageArgs.assert(raw_args);
        startNewMessage(state, {
            role: args.role,
            id: args.id,
            name: args.name,
        });
    },
};

export const MESSAGE_COMMANDS = [
    createRoleCommand("system", ["sys"]),
    createRoleCommand("developer", ["dev"]),
    createRoleCommand("user"),
    createRoleCommand("assistant", ["ai"]),
    createRoleCommand("tool"),

    COMMAND_MESSAGE,
];