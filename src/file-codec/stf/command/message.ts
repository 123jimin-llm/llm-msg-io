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
});

const COMMAND_MESSAGE: Command = {
    param_type: CommandParamType.NILADIC,
    name: "message", alias_list: ["msg"],
    execute(state, raw_args) {
        const args = MessageArgs.assert(raw_args);
    },
};

const COMMAND_RAW: Command = {
    param_type: CommandParamType.POLYADIC,
    name: "raw",
    execute(state, raw_args) {},
};

export const MESSAGE_COMMANDS = [
    createRoleCommand("system", ["sys"]),
    createRoleCommand("developer", ["dev"]),
    createRoleCommand("user"),
    createRoleCommand("assistant", ["ai"]),
    createRoleCommand("tool"),

    COMMAND_MESSAGE,
    COMMAND_RAW,
];