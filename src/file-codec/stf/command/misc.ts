import { flushDecodeState } from "../decode-state.ts";
import { type Command, CommandMode } from "./type.ts";

const COMMAND_FLUSH: Command = {
    mode: CommandMode.NILADIC,
    name: "flush",
    execute(state) {
        flushDecodeState(state);
    },
};

export const MISC_COMMANDS: Command[] = [
    COMMAND_FLUSH,
];