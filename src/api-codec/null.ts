import type { Codec, MessageArrayLike } from "../message/index.ts";

export const NullCodec = {
    createEncoder: () => (messages) => messages,
    createDecoder: () => (messages) => messages,
} satisfies Codec<MessageArrayLike>;