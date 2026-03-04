import JSON5 from "json5";
import {type Command, CommandMode} from "./type.ts";

const COMMAND_EXTRA: Command = {
    mode: CommandMode.POLYADIC,
    name: "extra",
    execute(state) {
        if(state.curr_message == null) {
            throw new SyntaxError(`'extra' command requires an active message.`);
        }

        const parsed: unknown = JSON5.parse(state.buffered_lines.join('\n'));
        const existing = state.curr_message.extra;

        state.curr_message.extra = shallowMergeOrReplace(existing, parsed);
    },
};

/** Shallow-merge `parsed` into `existing`, or replace. */
function shallowMergeOrReplace(existing: unknown, parsed: unknown): unknown {
    if(
        typeof existing === 'object' && existing != null && !Array.isArray(existing)
        && typeof parsed === 'object' && parsed != null && !Array.isArray(parsed)
    ) {
        return {...(existing as Record<string, unknown>), ...(parsed as Record<string, unknown>)};
    }

    return parsed;
}

const COMMAND_META: Command = {
    mode: CommandMode.POLYADIC,
    name: "meta",
    execute(state) {
        const parsed: unknown = JSON5.parse(state.buffered_lines.join('\n'));
        state.metadata = shallowMergeOrReplace(state.metadata, parsed);
    },
};

export const FIELD_COMMANDS: Command[] = [
    COMMAND_EXTRA,
    COMMAND_META,
];
