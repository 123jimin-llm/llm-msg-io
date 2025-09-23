/// JSON support

import { validateMessageArray } from "@/message/index.js";
import type { FileCodec } from "./type.js";

export const codec: FileCodec = {
    createSerializer() {
        return (message) => {
            return JSON.stringify(message);
        };
    },
    createDeserializer() {
        return (source) => {
            return {
                messages: validateMessageArray(JSON.parse(source)),
            };
        };
    },
};