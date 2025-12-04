import { type DecodeState } from "../decode-state.ts";

export const CommandMode = Object.freeze({
    NILADIC: 0,
    MONADIC: 1,
    POLYADIC: -1,
} as const);

export type CommandMode = typeof CommandMode[keyof typeof CommandMode];

export type CommandArgs = Record<string, unknown>;

export interface Command {
    mode: CommandMode;
    
    name: string;
    alias_list?: string[];

    execute(state: DecodeState, args: CommandArgs): void;
}
