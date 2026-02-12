export * from "./extra.ts";
export * from "./request.ts";
export * from "./response.ts";
export * from "./stream.ts";

import type {
    Message as ClaudeMessage,
    MessageCreateParamsNonStreaming,
} from "@anthropic-ai/sdk/resources/messages";

import type {APIStepCodecWithStream} from "../../api-codec-lib/index.ts";
import {ClaudeMessagesRequestCodec} from "./request.ts";
import {ClaudeMessagesResponseCodec} from "./response.ts";
import {ClaudeMessagesStreamCodec, type ClaudeMessageStream} from "./stream.ts";

export const ClaudeMessagesCodec = {
    ...ClaudeMessagesRequestCodec,
    ...ClaudeMessagesResponseCodec,
    ...ClaudeMessagesStreamCodec,
} satisfies APIStepCodecWithStream<MessageCreateParamsNonStreaming, ClaudeMessage, ClaudeMessageStream>;
