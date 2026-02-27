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

        // Shallow merge when both sides are plain objects; otherwise replace.
        if(
            typeof existing === 'object' && existing != null && !Array.isArray(existing) &&
            typeof parsed === 'object' && parsed != null && !Array.isArray(parsed)
        ) {
            state.curr_message.extra = {...(existing as Record<string, unknown>), ...(parsed as Record<string, unknown>)};
        } else {
            state.curr_message.extra = parsed;
        }
    },
};

export const FIELD_COMMANDS: Command[] = [
    COMMAND_EXTRA,
];
