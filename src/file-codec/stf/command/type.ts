import { type DecodeState } from "../decode-state.js";

export const CommandParamType = Object.freeze({
    NILADIC: 0,
    MONADIC: 1,
    POLYADIC: -1,
} as const);

export type CommandParamType = typeof CommandParamType[keyof typeof CommandParamType];

export type CommandArgs = Record<string, unknown>;

export interface Command {
    param_type: CommandParamType;
    
    name: string;
    alias_list?: string[];

    execute(state: DecodeState, args: CommandArgs, param_lines: string[]): void;
}
