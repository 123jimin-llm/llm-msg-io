export type { MessageContent, MessageArrayLike, ContentPart } from "./schema.js";
export { Message, MessageArray, isMessageArray, asMessageArray } from "./schema.js";

export * from "./codec.js";

import { MessageContent, textToContentPart, textToContentPartArray, type ContentPart } from "./schema.js";

/**
 * Concatenates multiple message contents into a single message content.
 * 
 * @param contents - An array of message contents to concatenate.
 * @returns A single value representing the concatenated content.
 */
export function concatContents(...contents: MessageContent[]): MessageContent {
    if(contents.length === 0) return "";
    if(contents.length === 1) return contents[0];

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