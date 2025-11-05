import { flushDecodeState } from "../decode-state.js";
import { Command, CommandMode } from "./type.js";

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