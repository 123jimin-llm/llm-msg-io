import { Codec, MessageArrayLike } from "../message/index.js";

export const NullCodec = {
    createSerializer: () => (messages) => messages,
    createDeserializer: () => (messages) => messages,
} satisfies Codec<MessageArrayLike>;