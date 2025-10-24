import { type } from 'arktype';
import { exportType } from '../util/type.js';

export const ContentPartText = exportType(type({
    type: '"text"',
    text: 'string',
}));

const ContentPartFileBase = type({
    type: 'string',
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
    format: 'string',
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

export const Message = exportType(type({
    "id?": 'string',
    role: 'string',
    content: type("string").or(ContentPart.array()),
}));

export type Message = typeof Message.infer;

export function validateMessage(value: unknown): Message {
    const res = Message(value);
    if(res instanceof type.errors) {
        throw res;
    }

    return res;
}

export function validateMessageArray(value: unknown): Message[] {
    if(!Array.isArray(value)) throw new Error(`Value of type ${typeof value} is not an array!`);
    return value.map((v) => validateMessage(v));
}

/** Objects that can be converted to an array of messages. */
export type MessageArrayLike = Message | Array<Message>;

/**
 * Returns whether the given object is an array of messages.
 * @param obj The object to check.
 * @returns Whether `obj` is an array of messages.
 */
export function isMessageArray(obj: MessageArrayLike): obj is Array<Message> {
    return Array.isArray(obj);
}

/**
 * Converts the given object to an array of messages.
 * @param obj Either a message or an array of messages.
 * @returns Either `obj` or `[obj]`, depending on whether `obj` is an array of messages.
 */
export function asMessageArray(obj: MessageArrayLike): Array<Message> {
    return isMessageArray(obj) ? obj : [obj];
}