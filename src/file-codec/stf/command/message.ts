import { type } from "arktype";
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

export const MESSAGE_COMMANDS = [
    createRoleCommand("system", ["sys"]),
    createRoleCommand("developer", ["dev"]),
    createRoleCommand("user"),
    createRoleCommand("assistant", ["ai"]),
    createRoleCommand("tool"),

    COMMAND_MESSAGE,
];