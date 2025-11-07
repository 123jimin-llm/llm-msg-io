import { type } from 'arktype';
import { exportType } from '../util/type.js';

export const ContentPartText = exportType(type({
    type: '"text"',
    text: 'string',
}));

const ContentPartFileBase = type({
    type: 'string',
    "format?": 'string',
    "file_id?": 'string',
    "name?": 'string',
    "url?": 'string',
    "data?": 'string|ArrayBuffer',
});

export const ContentPartImage = exportType(ContentPartFileBase.and({
    type: '"image"',
}));

export const ContentPartAudio = exportType(ContentPartFileBase.and({
    type: '"audio"',
}));

export const ContentPartFile = exportType(ContentPartFileBase.and({
    type: '"file"',
}));

export const ContentPart = exportType(ContentPartText
    .or(ContentPartImage)
    .or(ContentPartAudio)
    .or(ContentPartFile)
);

export type ContentPart = typeof ContentPart.infer;

export function textToContentPart(text: string): ContentPart {
    return {type: 'text', text};
}

export function textToContentPartArray(text: string): ContentPart[] {
    return text ? [textToContentPart(text)] : [];
}

export const Message = exportType(type({
    id: "string?",
    name: "string?",
    role: 'string',
    content: type('string').or(ContentPart.array()),
}));

export type Message = typeof Message.infer;
export type MessageContent = Message['content'];

export const MessageArray = exportType(Message.array());
export type MessageArray = typeof MessageArray.infer;

/** Objects that can be converted to an array of messages. */
export type MessageArrayLike = Message|MessageArray;

/**
 * Returns whether the given object is an array of messages.
 * @param obj The object to check.
 * @returns Whether `obj` is an array of messages.
 */
export function isMessageArray(obj: MessageArrayLike): obj is MessageArray {
    return Array.isArray(obj);
}

/**
 * Converts the given object to an array of messages.
 * @param obj Either a message or an array of messages.
 * @returns Either `obj` or `[obj]`, depending on whether `obj` is an array of messages.
 */
export function asMessageArray(obj: MessageArrayLike): MessageArray {
    return isMessageArray(obj) ? obj : [obj];
}