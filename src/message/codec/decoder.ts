import { Message, MessageArray } from "../schema/index.js";

/** Decoded list of messages with metadata. */
export type DecodedData<MetadataType=unknown> = {metadata?: MetadataType, messages: Message[]};

export type RawDecodedData<MetadataType=unknown> = Message[] | {
    metadata?: MetadataType,
    messages: Message[],
};

/** Decode encoded data into a list of messages together with metadata. */
export type MessageDecoder<EncodedType=string, MetadataType=unknown> = (encoded: EncodedType) => DecodedData<MetadataType>;

/** Decode encoded data without validation. */
export type RawMessageDecoder<EncodedType=string> = (encoded: EncodedType) => unknown;

/** A function that returns a decoder. */
export type CodecDecoder<EncodedType=string, DecodeOptions extends object=object> = (options?: Partial<DecodeOptions>) => RawMessageDecoder<EncodedType>;

/** An object that provides a decoder. */
export interface WithCreateDecoder<EncodedType=string, DecodeOptions extends object=object> {
    createDecoder: CodecDecoder<EncodedType, DecodeOptions>;
};

/** Checks whether a given object is a list of messages, or an object with message and metadata. */
export function asDecodedData(obj: unknown): DecodedData<unknown> {
    if(obj == null) {
        throw new TypeError("`asDecodedData` expected an object or an array of messages.");
    }

    if(Array.isArray(obj)) {
        return {
            messages: MessageArray.assert(obj),
        };
    }

    if(typeof obj !== 'object') {
        throw new TypeError("`asDecodedData` expected an object or an array of messages.");
    }

    if('messages' in obj) {
        const messages = MessageArray.assert(obj.messages);

        if('metadata' in obj && obj.metadata !== (void 0)) {
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
        messages: [Message.assert(obj)],
    };
}

/** Either a function that returns a decoder, or a codec with createDecoder. */
export type CodecDecoderLike<EncodedType=string, DecodeOptions extends object=object> = CodecDecoder<EncodedType, DecodeOptions> | WithCreateDecoder<EncodedType, DecodeOptions>;

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
        const validated_metadata: MetadataType = validateMetadata ? validateMetadata(metadata) : (validateMetadata as MetadataType);

        const decoded_data: DecodedData<MetadataType> = {messages};
        if(validated_metadata !== (void 0)) decoded_data.metadata = validated_metadata;

        return decoded_data;
    };
}