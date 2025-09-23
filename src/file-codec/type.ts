import type { MessageSerializer, MessageDeserializer } from "@/message/index.js";

export interface FileCodec<SerializeOptions=object, DeserializeOptions=object, MetadataType=unknown> {
    createSerializer(options?: Partial<SerializeOptions>): MessageSerializer<MetadataType>;
    createDeserializer(options?: Partial<DeserializeOptions>): MessageDeserializer<MetadataType>;
}