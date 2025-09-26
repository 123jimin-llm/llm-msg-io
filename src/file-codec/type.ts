import type { MessageSerializer, RawMessageDeserializer } from "../message/index.js";

export type FileCodecSerializer<SerializeOptions=object, MetadataType=unknown> = (options?: Partial<SerializeOptions>) => MessageSerializer<MetadataType>;
export type FileCodecDeserializer<DeserializeOptions=object> = (options?: Partial<DeserializeOptions>) => RawMessageDeserializer;

export interface WithCreateSerializer<SerializeOptions=object, MetadataType=unknown> {
    createSerializer: FileCodecSerializer<SerializeOptions, MetadataType>;
};

export interface WithCreateDeserializer<DeserializeOptions=object> {
    createDeserializer: FileCodecDeserializer<DeserializeOptions>;
};

export type FileCodec<SerializeOptions=object, DeserializeOptions=object, MetadataType=unknown>
    = WithCreateSerializer<SerializeOptions, MetadataType>
    & WithCreateDeserializer<DeserializeOptions>;