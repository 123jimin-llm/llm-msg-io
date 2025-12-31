import { getMessageExtra, Message } from "../../message/index.ts";

export const MESSAGE_EXTRA_GEMINI = 'gemini';

export type GeminiExtra = Partial<{
    thought_signatures: string[],
}>;

export function getMessageExtraGemini(message: Message, init?: boolean) : GeminiExtra|null;
export function getMessageExtraGemini(message: Message, init: true) : GeminiExtra;
export function getMessageExtraGemini(message: Message, init = false): GeminiExtra|null {
    return getMessageExtra<GeminiExtra>(message, MESSAGE_EXTRA_GEMINI, init);
}