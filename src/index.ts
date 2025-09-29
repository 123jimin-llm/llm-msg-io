export * from "./message/index.js";

export * from "./msg-codec/index.js";
export * from "./file-codec/index.js";

import { compose, type CodecDeserializerLike, type CodecSerializerLike } from "./message/index.js";

export interface MessageToFileConfig<
    MessagesType,
    SerializedType=string,
    MetadataType=unknown,
    MsgCodecDeserializeOptions extends object=object,
    FileCodecSerializeOptions extends object=object,
> {
    msg: {
        codec: CodecDeserializerLike<MessagesType, MsgCodecDeserializeOptions>,
        options?: MsgCodecDeserializeOptions,
    } | CodecDeserializerLike<MessagesType, MsgCodecDeserializeOptions>,
    
    file: {
        codec: CodecSerializerLike<SerializedType, FileCodecSerializeOptions, MetadataType>,
        options?: FileCodecSerializeOptions,
    } | CodecSerializerLike<SerializedType, FileCodecSerializeOptions, MetadataType>,
}

export interface FileToMessageConfig<
    MessagesType,
    SerializedType=string,
    MetadataType=unknown,
    MsgCodecSerializeOptions extends object=object,
    FileCodecDeserializeOptions extends object=object,
> {
    msg: {
        codec: CodecSerializerLike<MessagesType, MsgCodecSerializeOptions, MetadataType>,
        options?: MsgCodecSerializeOptions,
    } | CodecSerializerLike<MessagesType, MsgCodecSerializeOptions, MetadataType>,
    
    file: {
        codec: CodecDeserializerLike<SerializedType, FileCodecDeserializeOptions>,
        options?: FileCodecDeserializeOptions,
    } | CodecDeserializerLike<SerializedType, FileCodecDeserializeOptions>,

    validateMetadata?: (metadata: unknown) => MetadataType;
}

function getCodecAndOptions<T, U extends object>(value: {codec: T, options?: U}|T, additional_options?: U): {codec: T, options?: U} {
    if(value == null) {
        return {codec: value, options: additional_options};
    }

    if(typeof value === 'object' && 'codec' in value) {
        return {
            codec: value.codec,
            options: value.options ? (
                additional_options ? {
                    ...value.options,
                    ...additional_options,
                } : value.options
            ) : additional_options,
        };
    }

    return {
        codec: value,
        options: additional_options,
    };
}

export type MessageFileCodecConfig<
    MessagesType,
    SerializedType=string,
    MetadataType=unknown,
    MsgCodecSerializeOptions extends object=object,
    MsgCodecDeserializeOptions extends object=object,
    FileCodecSerializeOptions extends object=object,
    FileCodecDeserializeOptions extends object=object,
>
    = MessageToFileConfig<MessagesType, SerializedType, MetadataType, MsgCodecDeserializeOptions, FileCodecSerializeOptions>
    & FileToMessageConfig<MessagesType, SerializedType, MetadataType, MsgCodecSerializeOptions, FileCodecDeserializeOptions>;

export function serialize<
    MessagesType,
    SerializedType=string,
    MetadataType=unknown,
    MsgCodecDeserializeOptions extends object=object,
    FileCodecSerializeOptions extends object=object,
>(
    config: MessageToFileConfig<MessagesType, SerializedType, MetadataType, MsgCodecDeserializeOptions, FileCodecSerializeOptions>,
    messages: MessagesType,
    metadata?: MetadataType,
): SerializedType {
    const {codec: msg_codec, options: msg_options} = getCodecAndOptions(config.msg);
    const {codec: file_codec, options: file_options} = getCodecAndOptions(config.file);

    return compose(msg_codec, file_codec, msg_options, file_options)(messages, metadata).value;
}

export function deserialize<
    MessagesType,
    SerializedType=string,
    MetadataType=unknown,
    MsgCodecSerializeOptions extends object=object,
    FileCodecDeserializeOptions extends object=object,
>(
    config: FileToMessageConfig<MessagesType, SerializedType, MetadataType, MsgCodecSerializeOptions, FileCodecDeserializeOptions>,
    serialized: SerializedType,
): {metadata?: MetadataType, messages: MessagesType} {
    const {codec: msg_codec, options: msg_options} = getCodecAndOptions(config.msg);
    const {codec: file_codec, options: file_options} = getCodecAndOptions(config.file);

    const {value, metadata} = compose(file_codec, msg_codec, file_options, msg_options)(serialized);
    return {
        metadata: config.validateMetadata ? config.validateMetadata(metadata) : (metadata as MetadataType),
        messages: value,
    }
}