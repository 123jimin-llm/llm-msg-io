export * from "./message/index.js";
export * from "./file-codec/index.js";

import type { MessageArrayLike, CodecSerializer, CodecDeserializer, WithCreateSerializer, WithCreateDeserializer } from "./message/index.js";
import { asDeserializedData, asMessageArray } from "./message/index.js";

export function serialize<SerializedType=string, SerializeOptions=object, MetadataType=unknown>(
    codec: CodecSerializer<SerializedType, SerializeOptions, MetadataType> | WithCreateSerializer<SerializedType, SerializeOptions, MetadataType>,
    messages: MessageArrayLike,
    metadata?: MetadataType,
    options?: Partial<SerializeOptions>,
): SerializedType {
    const serializer = typeof codec === "function" ? codec(options) : codec.createSerializer(options);
    return serializer(asMessageArray(messages), metadata);
}

export function deserialize<SerializedType=string, DeserializeOptions=object>(
    codec: CodecDeserializer<SerializedType, DeserializeOptions> | WithCreateDeserializer<SerializedType, DeserializeOptions>,
    source: SerializedType,
    options?: Partial<DeserializeOptions>,
) {
    const deserializer = typeof codec === "function" ? codec(options) : codec.createDeserializer(options);
    return asDeserializedData(deserializer(source));
}