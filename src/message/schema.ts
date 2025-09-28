import { type } from 'arktype';

export const ContentPartText = type({
    type: '"text"',
    text: 'string',
});

const ContentPartFileBase = type({
    type: 'string',
    "file_id?": 'string',
    "name?": 'string',
    "url?": 'string',
    "data?": 'ArrayBuffer',
});

export const ContentPartImage = ContentPartFileBase.and({
    type: '"image"',
});

export const ContentPartAudio = ContentPartFileBase.and({
    type: '"audio"',
});

export const ContentPartFile = ContentPartFileBase.and({
    type: '"file"',
});

export const ContentPart = ContentPartText
    .or(ContentPartImage)
    .or(ContentPartAudio)
    .or(ContentPartFile);

export type ContentPart = typeof ContentPart.infer;

export const Message = type({
    "id?": 'string',
    role: 'string',
    content: type("string").or(ContentPart.array()),
});

export type Message = typeof Message.infer;
