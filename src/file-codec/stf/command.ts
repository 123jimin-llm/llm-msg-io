import { startNewMessage, type DecodeState } from "./decode-state.js";

export const CommandParamType = Object.freeze({
    NILADIC: 0,
    MONADIC: 1,
    POLYADIC: -1,
} as const);

export type CommandParamType = typeof CommandParamType[keyof typeof CommandParamType];

export interface Command {
    param_type: CommandParamType;
    
    name: string;
    alias_list?: string[];

    execute(state: DecodeState, args: Record<string, unknown>, param_lines: string[]): void;
}

export function createRoleCommand(name: string, alias_list?: string[]): Command {
    return {
        param_type: CommandParamType.NILADIC,

        name,
        alias_list,

        execute(state: DecodeState) {
            startNewMessage(state, {role: name});
        },
    };
}

export const COMMANDS: Command[] = [
    createRoleCommand("system", ["sys"]),
    createRoleCommand("developer", ["dev"]),
    createRoleCommand("user"),
    createRoleCommand("assistant", ["ai"]),
    createRoleCommand("tool"),
];