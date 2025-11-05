import { CodecEncoder } from "../../message/codec.js";

export const createEncoder: CodecEncoder<string> = () => (messages): string => {
    return messages.map((message) => {
        // TODO
        return ";raw\n;end";
    }).join('\n');
};