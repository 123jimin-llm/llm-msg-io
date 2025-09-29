import { type Message, validateMessage, validateMessageArray } from "./schema.js";

export type DeserializedData<MetadataType=unknown> = {metadata?: MetadataType, messages: Message[]};

export type MessageSerializer<SerializedType=string, MetadataType=unknown> = (messages: Message[], metadata?: MetadataType) => SerializedType;
export type MessageDeserializer<SerializedType=string, MetadataType=unknown> = (serialized: SerializedType) => DeserializedData<MetadataType>;
export type RawMessageDeserializer<SerializedType=string> = (serialized: SerializedType) => unknown;

export type CodecSerializer<SerializedType=string, SerializeOptions extends object=object, MetadataType=unknown> = (options?: Partial<SerializeOptions>) => MessageSerializer<SerializedType, MetadataType>;
export type CodecDeserializer<SerializedType=string, DeserializeOptions extends object=object> = (options?: Partial<DeserializeOptions>) => RawMessageDeserializer<SerializedType>;

export interface WithCreateSerializer<SerializedType=string, SerializeOptions extends object=object, MetadataType=unknown> {
    createSerializer: CodecSerializer<SerializedType, SerializeOptions, MetadataType>;
};

export interface WithCreateDeserializer<SerializedType=string, DeserializeOptions extends object=object> {
    createDeserializer: CodecDeserializer<SerializedType, DeserializeOptions>;
};

export type Codec<SerializedType=string, SerializeOptions extends object=object, DeserializeOptions extends object=object, MetadataType=unknown>
    = WithCreateSerializer<SerializedType, SerializeOptions, MetadataType>
    & WithCreateDeserializer<SerializedType, DeserializeOptions>;

export function asDeserializedData(obj: unknown): DeserializedData<unknown> {
    if(obj == null) {
        throw new TypeError("`asDeserializedData` expected an object or an array of messages.");
    }

    if(Array.isArray(obj)) {
        return {
            messages: validateMessageArray(obj),
        };
    }

    if(typeof obj !== 'object') {
        throw new TypeError("`asDeserializedData` expected an object or an array of messages.");
    }

    if('messages' in obj) {
        const messages = validateMessageArray(obj.messages);

        if('metadata' in obj) {
            return {
                metadata: obj.metadata,
                messages,
            };
        } else {
            return {
                messages,
            };
        }
    }

    return {
        messages: [validateMessage(obj)],
    };
}

export type CodecSerializerLike<SerializedType=string, SerializeOptions extends object=object, MetadataType=unknown> = CodecSerializer<SerializedType, SerializeOptions, MetadataType> | WithCreateSerializer<SerializedType, SerializeOptions, MetadataType>;
export type CodecDeserializerLike<SerializedType=string, DeserializeOptions extends object=object> = CodecDeserializer<SerializedType, DeserializeOptions> | WithCreateDeserializer<SerializedType, DeserializeOptions>;

export function createSerializer<SerializedType=string, SerializeOptions extends object=object, MetadataType=unknown>(
    codec: CodecSerializerLike<SerializedType, SerializeOptions, MetadataType>,
    options?: SerializeOptions,
): MessageSerializer<SerializedType, MetadataType> {
    return (typeof codec === 'function' ? codec : codec.createSerializer)(options);
}

export function createRawDeserializer<SerializedType=string, DeserializeOptions extends object=object>(
    codec: CodecDeserializerLike<SerializedType, DeserializeOptions>,
    options?: DeserializeOptions,
): RawMessageDeserializer<SerializedType> {
    return (typeof codec === 'function' ? codec : codec.createDeserializer)(options);
}

export function compose<FromType, FromOptions extends object, ToType, ToOptions extends object, MetadataType=unknown>(
    from_codec: CodecDeserializerLike<FromType, FromOptions>,
    to_codec: CodecSerializerLike<ToType, ToOptions, MetadataType>,
    from_options?: FromOptions,
    to_options?: ToOptions,
) {
    return (from_data: FromType, metadata?: MetadataType) => {
        const deserialized_data = asDeserializedData(createRawDeserializer(from_codec, from_options)(from_data));
        return {
            value: createSerializer(to_codec, to_options)(deserialized_data.messages, metadata),
            metadata: deserialized_data.metadata,
        };
    };
}