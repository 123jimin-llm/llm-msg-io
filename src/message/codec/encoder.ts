import { Message } from "../schema/index.ts";

/** Encode a list of messages together with arbitrary metadata. */
export type MessageEncoder<EncodedType=string, MetadataType=unknown> = (messages: Message[], metadata?: MetadataType) => EncodedType;

/** A function that returns an encoder. */
export type CodecEncoder<EncodedType=string, EncodeOptions extends object=object, MetadataType=unknown> = (options?: Partial<EncodeOptions>) => MessageEncoder<EncodedType, MetadataType>;

/** An object that provides an encoder. */
export interface WithCreateEncoder<EncodedType=string, EncodeOptions extends object=object, MetadataType=unknown> {
    createEncoder: CodecEncoder<EncodedType, EncodeOptions, MetadataType>;
};

/** Either a function that returns an encoder, or a codec with createEncoder. */
export type CodecEncoderLike<EncodedType=string, EncodeOptions extends object=object, MetadataType=unknown> = CodecEncoder<EncodedType, EncodeOptions, MetadataType> | WithCreateEncoder<EncodedType, EncodeOptions, MetadataType>;

/** Invokes the function that returns an encoder. */
export function createEncoder<EncodedType=string, EncodeOptions extends object=object, MetadataType=unknown>(
    codec: CodecEncoderLike<EncodedType, EncodeOptions, MetadataType>,
    options?: EncodeOptions,
): MessageEncoder<EncodedType, MetadataType> {
    return (typeof codec === 'function' ? codec : codec.createEncoder)(options);
}