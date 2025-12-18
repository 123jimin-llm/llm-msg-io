import type { Nullable } from "../util/type.ts";
import type { MessageContent } from "./schema/content.ts";
import type { Message, MessageArray } from "./schema/message.ts";

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

export function messageContentToText(content: MessageContent): string;
export function messageContentToText(content: Nullable<never>): null;
export function messageContentToText(content: Nullable<MessageContent>): string|null {
    if(content == null) return null;
    if(typeof content === 'string') return content;

    return content.map((part) => part.type === 'text' ? part.text : "").join("");
}

export function getMessageExtra<T>(message: Message, key: string, init?: false) : T|null;
export function getMessageExtra<T>(message: Message, key: string, init: true) : T;
export function getMessageExtra<T>(message: Message, key: string, init = false): T|null {
    const message_extra = (message.extra || (init ? (message.extra = {}) : null)) as {[key]?: T};
    if(!message_extra) return null;

    return (message_extra[key] || (init ? (message_extra[key] = {} as T) : null));
}

export function stripMessageId(message: Message): Message {
    const msg = {...message};
    delete msg.id;
    return msg;
}

export function stripMessageIds(message: Message): Message;
export function stripMessageIds(messages: Message[]): Message[];
export function stripMessageIds(messages: Message|Message[]): Message|Message[] {
    if(Array.isArray(messages)) {
        return messages.map((message) => stripMessageId(message));
    } else {
        return stripMessageId(messages);
    }
}

/**
 * Swaps message ID of a given message.
 * @param msg_id_map 
 * @param message 
 * @returns 
 */
export function mapMessageId(msg_id_map: Map<string, string>|Record<string, string>, message: Message): Message {
    const msg = {...message};
    if(msg.id == null) return msg;

    const new_id = (msg_id_map instanceof Map) ? msg_id_map.get(msg.id) : msg_id_map[msg.id];
    if(new_id != null) {
        msg.id = new_id;
    }

    return msg;
}

export function mapMessageIds(msg_id_map: Map<string, string>|Record<string, string>, message: Message): Message;
export function mapMessageIds(msg_id_map: Map<string, string>|Record<string, string>, messages: Message[]): Message[];
export function mapMessageIds(msg_id_map: Map<string, string>|Record<string, string>, messages: Message|Message[]): Message|Message[] {
    if(Array.isArray(messages)) {
        return messages.map((message) => mapMessageId(msg_id_map, message));
    } else {
        return mapMessageId(msg_id_map, messages);
    }
}

/**
 * Transforms all text contents of a given message.
 * @param fn 
 * @param message 
 * @returns 
 */
export function mapMessageText(fn: (text: string) => string, message: Message): Message {
    const { content } = message;

    let new_content;

    if(typeof content === 'string') {
        new_content = fn(content);
    } else {
        new_content = content.map(part => {
            if(part.type === 'text') return { ...part, text: fn(part.text) };
            else return part;
        });
    }

    return {
        ...message,
        content: new_content,
    };
}


export function mapMessageTexts(fn: (text: string) => string, message: Message): Message;
export function mapMessageTexts(fn: (text: string) => string, messages: Message[]): Message[];
export function mapMessageTexts(fn: (text: string) => string, messages: Message|Message[]): Message|Message[] {
    if(Array.isArray(messages)) {
        return messages.map((message) => mapMessageText(fn, message));
    } else {
        return mapMessageText(fn, messages);
    }
}