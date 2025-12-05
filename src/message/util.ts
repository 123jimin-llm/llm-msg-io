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