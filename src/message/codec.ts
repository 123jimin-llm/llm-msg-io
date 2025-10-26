import { type Message, validateMessage, validateMessageArray } from "./schema.js";

/** Decoded list of messages with metadata. */
export type DecodedData<MetadataType=unknown> = {metadata?: MetadataType, messages: Message[]};

/** Encode a list of messages together with arbitrary metadata. */
export type MessageEncoder<EncodedType=string, MetadataType=unknown> = (messages: Message[], metadata?: MetadataType) => EncodedType;

/** Decode encoded data into a list of messages together with metadata. */
export type MessageDecoder<EncodedType=string, MetadataType=unknown> = (encoded: EncodedType) => DecodedData<MetadataType>;

/** Decode encoded data without validation. */
export type RawMessageDecoder<EncodedType=string> = (encoded: EncodedType) => unknown;

/** A function that returns an encoder. */
export type CodecEncoder<EncodedType=string, EncodeOptions extends object=object, MetadataType=unknown> = (options?: Partial<EncodeOptions>) => MessageEncoder<EncodedType, MetadataType>;

/** A function that returns a decoder. */
export type CodecDecoder<EncodedType=string, DecodeOptions extends object=object> = (options?: Partial<DecodeOptions>) => RawMessageDecoder<EncodedType>;

/** An object that provides an encoder. */
export interface WithCreateEncoder<EncodedType=string, EncodeOptions extends object=object, MetadataType=unknown> {
    createEncoder: CodecEncoder<EncodedType, EncodeOptions, MetadataType>;
};

/** An object that provides a decoder. */
export interface WithCreateDecoder<EncodedType=string, DecodeOptions extends object=object> {
    createDecoder: CodecDecoder<EncodedType, DecodeOptions>;
};

/** An object that provides both an encoder and a decoder. */
export type Codec<EncodedType=string, EncodeOptions extends object=object, DecodeOptions extends object=object, MetadataType=unknown>
    = WithCreateEncoder<EncodedType, EncodeOptions, MetadataType>
    & WithCreateDecoder<EncodedType, DecodeOptions>;

/** Checks whether a given object is a list of messages, or an object with message and metadata. */
export function asDecodedData(obj: unknown): DecodedData<unknown> {
    if(obj == null) {
        throw new TypeError("`asDecodedData` expected an object or an array of messages.");
    }

    if(Array.isArray(obj)) {
        return {
            messages: validateMessageArray(obj),
        };
    }

    if(typeof obj !== 'object') {
        throw new TypeError("`asDecodedData` expected an object or an array of messages.");
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

/** Either a function that returns an encoder, or a codec with createEncoder. */
export type CodecEncoderLike<EncodedType=string, EncodeOptions extends object=object, MetadataType=unknown> = CodecEncoder<EncodedType, EncodeOptions, MetadataType> | WithCreateEncoder<EncodedType, EncodeOptions, MetadataType>;

/** Either a function that returns a decoder, or a codec with createDecoder. */
export type CodecDecoderLike<EncodedType=string, DecodeOptions extends object=object> = CodecDecoder<EncodedType, DecodeOptions> | WithCreateDecoder<EncodedType, DecodeOptions>;

/** Invokes the function that returns an encoder. */
export function createEncoder<EncodedType=string, EncodeOptions extends object=object, MetadataType=unknown>(
    codec: CodecEncoderLike<EncodedType, EncodeOptions, MetadataType>,
    options?: EncodeOptions,
): MessageEncoder<EncodedType, MetadataType> {
    return (typeof codec === 'function' ? codec : codec.createEncoder)(options);
}

/** Invokes the function that returns a raw deserializer. */
export function createRawDecoder<EncodedType=string, DecodeOptions extends object=object>(
    codec: CodecDecoderLike<EncodedType, DecodeOptions>,
    options?: DecodeOptions,
): RawMessageDecoder<EncodedType> {
    return (typeof codec === 'function' ? codec : codec.createDecoder)(options);
}

/** Invokes the function that returns a decoder. */
export function createDecoder<EncodedType=string, DecodeOptions extends object=object, MetadataType=unknown>(
    codec: CodecDecoderLike<EncodedType, DecodeOptions>,
    options?: DecodeOptions,
    validateMetadata?: (metadata: unknown) => MetadataType,
): MessageDecoder<EncodedType, MetadataType> {
    return (encoded: EncodedType) => {
        const {messages, metadata} = asDecodedData(createRawDecoder(codec, options)(encoded));
        return {
            metadata: validateMetadata ? validateMetadata(metadata) : (validateMetadata as MetadataType),
            messages,
        };
    };
}