export * from "@/message/index.js";
export * from "@/file-codec/index.js";

import { type MessageArrayLike, asDeserializedData, asMessageArray } from "@/message/index.js";

import type { FileCodecDeserializer, FileCodecSerializer, WithCreateDeserializer, WithCreateSerializer } from "@/file-codec/type.js";

export function serialize<SerializeOptions=object, MetadataType=unknown>(
    codec: FileCodecSerializer<SerializeOptions, MetadataType> | WithCreateSerializer<SerializeOptions, MetadataType>,
    messages: MessageArrayLike,
    metadata?: MetadataType,
    options?: Partial<SerializeOptions>,
): string {
    const serializer = typeof codec === "function" ? codec(options) : codec.createSerializer(options);
    return serializer(asMessageArray(messages), metadata);
}

export function deserialize<DeserializeOptions=object>(
    codec: FileCodecDeserializer<DeserializeOptions> | WithCreateDeserializer<DeserializeOptions>,
    source: string,
    options?: Partial<DeserializeOptions>,
) {
    const deserializer = typeof codec === "function" ? codec(options) : codec.createDeserializer(options);
    return asDeserializedData(deserializer(source));
}