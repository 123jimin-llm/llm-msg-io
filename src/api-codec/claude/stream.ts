import type {RawMessageStreamEvent} from "@anthropic-ai/sdk/resources/messages";

import type {StepResult, WithCreateStepStreamDecoder} from "../../api-codec-lib/index.ts";
import type {StepStreamEvent} from "../../message/index.ts";

export type ClaudeMessageStream = AsyncIterable<RawMessageStreamEvent>;

export const ClaudeMessagesStreamCodec = {
    // eslint-disable-next-line require-yield
    createStepStreamDecoder: () => async function* (_api_stream): AsyncGenerator<StepStreamEvent, StepResult> {
        throw new Error("Claude streaming decoder is not yet implemented.");
    },
} satisfies WithCreateStepStreamDecoder<ClaudeMessageStream>;
