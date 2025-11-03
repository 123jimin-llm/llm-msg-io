export const CommandParamType = Object.freeze({
    NILADIC: 0,
    MONADIC: 1,
    POLYADIC: -1,
} as const);

export type CommandParamType = typeof CommandParamType[keyof typeof CommandParamType];

export const CommandMessageMode = Object.freeze({
    OTHER: 0,
    START: 1,
    MODIFY: 2,
} as const);

export type CommandMessageMode = typeof CommandMessageMode[keyof typeof CommandMessageMode];

export interface Command {
    param_type: CommandParamType;
    message_mode: CommandMessageMode;

    name: string;
    alias_list?: string[];
}