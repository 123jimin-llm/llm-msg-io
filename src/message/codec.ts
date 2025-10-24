import { type Message, validateMessage, validateMessageArray } from "./schema.js";

/** Deserialized list of messages with metadata. */
export type DeserializedData<MetadataType=unknown> = {metadata?: MetadataType, messages: Message[]};

/** Serialize a list of messages together with arbitrary metadata. */
export type MessageSerializer<SerializedType=string, MetadataType=unknown> = (messages: Message[], metadata?: MetadataType) => SerializedType;

/** Deserialize serialized data into a list of messages together with metadata. */
export type MessageDeserializer<SerializedType=string, MetadataType=unknown> = (serialized: SerializedType) => DeserializedData<MetadataType>;

/** Deserialize serialized data without validation. */
export type RawMessageDeserializer<SerializedType=string> = (serialized: SerializedType) => unknown;

/** A function that returns a serializer. */
export type CodecSerializer<SerializedType=string, SerializeOptions extends object=object, MetadataType=unknown> = (options?: Partial<SerializeOptions>) => MessageSerializer<SerializedType, MetadataType>;

/** A function that returns a deserializer. */
export type CodecDeserializer<SerializedType=string, DeserializeOptions extends object=object> = (options?: Partial<DeserializeOptions>) => RawMessageDeserializer<SerializedType>;

/** An object that provides serializer. */
export interface WithCreateSerializer<SerializedType=string, SerializeOptions extends object=object, MetadataType=unknown> {
    createSerializer: CodecSerializer<SerializedType, SerializeOptions, MetadataType>;
};

/** An object that provides deserializer. */
export interface WithCreateDeserializer<SerializedType=string, DeserializeOptions extends object=object> {
    createDeserializer: CodecDeserializer<SerializedType, DeserializeOptions>;
};

/** An object that provides both serializer and deserializer. */
export type Codec<SerializedType=string, SerializeOptions extends object=object, DeserializeOptions extends object=object, MetadataType=unknown>
    = WithCreateSerializer<SerializedType, SerializeOptions, MetadataType>
    & WithCreateDeserializer<SerializedType, DeserializeOptions>;

/** Checks whether a given object is a list of messages, or an object with message and metadata. */
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

/** Either a function that returns a serializer, or a codec with createSerializer. */
export type CodecSerializerLike<SerializedType=string, SerializeOptions extends object=object, MetadataType=unknown> = CodecSerializer<SerializedType, SerializeOptions, MetadataType> | WithCreateSerializer<SerializedType, SerializeOptions, MetadataType>;

/** Either a function that returns a deserializer, or a codec with createDeserializer. */
export type CodecDeserializerLike<SerializedType=string, DeserializeOptions extends object=object> = CodecDeserializer<SerializedType, DeserializeOptions> | WithCreateDeserializer<SerializedType, DeserializeOptions>;

/** Invokes the function that returns a serializer. */
export function createSerializer<SerializedType=string, SerializeOptions extends object=object, MetadataType=unknown>(
    codec: CodecSerializerLike<SerializedType, SerializeOptions, MetadataType>,
    options?: SerializeOptions,
): MessageSerializer<SerializedType, MetadataType> {
    return (typeof codec === 'function' ? codec : codec.createSerializer)(options);
}

/** Invokes the function that returns a raw deserializer. */
export function createRawDeserializer<SerializedType=string, DeserializeOptions extends object=object>(
    codec: CodecDeserializerLike<SerializedType, DeserializeOptions>,
    options?: DeserializeOptions,
): RawMessageDeserializer<SerializedType> {
    return (typeof codec === 'function' ? codec : codec.createDeserializer)(options);
}

/** Invokes the function that returns a deserializer. */
export function createDeserializer<SerializedType=string, DeserializeOptions extends object=object, MetadataType=unknown>(
    codec: CodecDeserializerLike<SerializedType, DeserializeOptions>,
    options?: DeserializeOptions,
    validateMetadata?: (metadata: unknown) => MetadataType,
): MessageDeserializer<SerializedType, MetadataType> {
    return (serialized: SerializedType) => {
        const {messages, metadata} = asDeserializedData(createRawDeserializer(codec, options)(serialized));
        return {
            metadata: validateMetadata ? validateMetadata(metadata) : (validateMetadata as MetadataType),
            messages,
        };
    };
}