import {type} from "arktype";
import JSON5 from "json5";
import {Message} from "../../../message/index.ts";
import {type NewMessageParams, startNewMessage} from "../decode-state.ts";
import {type Command, CommandMode} from "./type.ts";

const RoleCommandArgs = type({
    id: "string?",
    name: "string?",
    call_id: "string?",
});

const MessageArgs = RoleCommandArgs.merge({
    role: "string?",
});

function createNewMessageParams(args: typeof MessageArgs.infer): Partial<NewMessageParams> {
    const ret: Partial<NewMessageParams> = {};

    if(args.role != null) ret.role = args.role;
    if(args.id != null) ret.id = args.id;
    if(args.name != null) ret.name = args.name;
    if(args.call_id != null) ret.call_id = args.call_id;

    return ret;
}

function createRoleCommand(name: string, alias_list?: string[]): Command {
    const command: Command ={
        mode: CommandMode.NILADIC,
        name,
        execute(state, raw_args) {
            const args = RoleCommandArgs.assert(raw_args);
            startNewMessage(state, createNewMessageParams({
                ...args,
                role: name,
            }));
        },
    };

    if(alias_list?.length) command.alias_list = alias_list;

    return command;
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
