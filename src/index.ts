export * from "@/message/index.js";
export * from "@/file-codec/index.js";

import { type MessageArrayLike, asDeserializedData, asMessageArray } from "@/message/index.js";

import type { MessageSerializer, RawMessageDeserializer } from "@/message/index.js";
import type { FileCodecDeserializer, FileCodecSerializer, WithCreateDeserializer, WithCreateSerializer } from "@/file-codec/type.js";

export function serialize<MetadataType=unknown>(
    serializer: MessageSerializer<MetadataType>,
    messages: MessageArrayLike,
    metadata?: MetadataType,
): string {
    return serializer(asMessageArray(messages), metadata);
}

export function serializeWithCodec<SerializeOptions=object, MetadataType=unknown>(
    codec: FileCodecSerializer<SerializeOptions, MetadataType> | WithCreateSerializer<SerializeOptions, MetadataType>,
    messages: MessageArrayLike,
    metadata?: MetadataType,
    options?: Partial<SerializeOptions>,
): string {
    const serializer = typeof codec === "function" ? codec(options) : codec.createSerializer(options);
    return serialize(serializer, messages, metadata);
}

export function deserialize(
    deserializer: RawMessageDeserializer,
    source: string,
) {
    return asDeserializedData(deserializer(source));
}

export function deserializeWithCodec<DeserializeOptions=object>(
    codec: FileCodecDeserializer<DeserializeOptions> | WithCreateDeserializer<DeserializeOptions>,
    source: string,
    options?: Partial<DeserializeOptions>,
) {
    const deserializer = typeof codec === "function" ? codec(options) : codec.createDeserializer(options);
    return deserialize(deserializer, source);
}