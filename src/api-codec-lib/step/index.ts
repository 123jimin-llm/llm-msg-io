export * from "./request.ts";
export * from "./response.ts";
export * from "./stream.ts";

import type { WithCreateStepEncoder } from "./request.ts";
import type { WithCreateStepDecoder } from "./response.ts";
import type { WithCreateStepStreamDecoder } from "./stream.ts";

/** An object that provides all types for LLM step. */
export type APIStepCodec = never; // TODO