import { type } from 'arktype';
import { exportType, type Nullable } from "../../util/type.ts";

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

export type ContentPartImage = typeof ContentPartImage.infer;

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

export const MessageContent = exportType(type('string').or(ContentPart.array()));
export type MessageContent = typeof MessageContent.infer;

export function messageContentToText(content: MessageContent): string;
export function messageContentToText(content: Nullable<never>): null;
export function messageContentToText(content: Nullable<MessageContent>): string|null {
    if(content == null) return null;
    if(typeof content === 'string') return content;

    return content.map((part) => part.type === 'text' ? part.text : "").join("");
}

export function messageContentToTextArray(content: MessageContent): string[];
export function messageContentToTextArray(content: Nullable<never>): null;
export function messageContentToTextArray(content: Nullable<MessageContent>): string[]|null {
    if(content == null) return null;
    if(typeof content === 'string') return [content];

    return content.filter((part) => part.type === 'text').map((part) => part.text);
}

/**
 * Concatenates multiple message contents into a single message content.
 * 
 * @param contents - An array of message contents to concatenate.
 * @returns A single value representing the concatenated content.
 */
export function concatContents(...contents: MessageContent[]): MessageContent {
    if(contents.length === 0) return "";

    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    if(contents.length === 1) return contents[0]!;

    if(contents.every((content) => (typeof content) === 'string')) {
        return contents.join('');
    }

    return contents.flatMap((content): ContentPart[] => {
        if(typeof content === 'string') {
            return textToContentPartArray(content);
        } else {
            return content;
        }
    });
}

/**
 * Concatenates one or more message contents to a target message content.
 * 
 * - If `target` is an array of `ContentPart` objects, it is modified in-place
 *   by appending the new content parts, and the same array instance is returned.
 * 
 * @param target 
 * @param contents 
 * @returns 
 */
export function concatContentsTo(target: MessageContent, ...contents: MessageContent[]): MessageContent {
    if(contents.length === 0) {
        return target;
    }

    for(const content of contents) {
        if(content.length === 0) continue;
        if(typeof target === 'string') {
            if(typeof content === 'string') {
                target += content;
            } else {
                target = textToContentPartArray(target);
                target.push(...content);
            }
        } else {
            if(typeof content === 'string') {
                target.push(textToContentPart(content));
            } else {
                target.push(...content);
            }
        }
    }

    return target;
}