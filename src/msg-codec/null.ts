import { Codec, MessageArrayLike } from "../message/index.js";

export const NullCodec = {
    createEncoder: () => (messages) => messages,
    createDecoder: () => (messages) => messages,
} satisfies Codec<MessageArrayLike>;