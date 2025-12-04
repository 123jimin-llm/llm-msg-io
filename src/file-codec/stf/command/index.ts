export * from "./args.ts";
export * from "./type.ts";

import type { Command } from "./type.ts";

import { MESSAGE_COMMANDS } from "./message.ts";
import { MISC_COMMANDS } from "./misc.ts";

export const COMMANDS: Command[] = [
    ...MESSAGE_COMMANDS,
    ...MISC_COMMANDS,
];

export const COMMAND_LOOKUP = (() => {
    const lookup = new Map<string, Command>();
    for(const command of COMMANDS) {
        if(lookup.has(command.name)) {
            throw new Error(`Duplicate STF command name: '${command.name}'.`);
        }

        lookup.set(command.name, command);
        
        if(command.alias_list) {
            for(const alias of command.alias_list) {
                if(lookup.has(alias)) {
                    throw new Error(`Duplicate STF command name: '${alias}'.`);
                }

                lookup.set(alias, command);
            }
        }
    }

    return lookup;
})();