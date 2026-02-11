import {ClaudeMessagesRequestCodec} from "./request.ts";
import {ClaudeMessagesResponseCodec} from "./response.ts";
import {ClaudeMessagesStreamCodec} from "./stream.ts";

export const ClaudeMessagesCodec = {
    ...ClaudeMessagesRequestCodec,
    ...ClaudeMessagesResponseCodec,
    ...ClaudeMessagesStreamCodec,
};
