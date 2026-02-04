export * from "./request.ts";
export * from "./response.ts";
export * from "./stream.ts";
export * from "./function.ts";

import type { StepParams, WithCreateStepEncoder } from "./request.ts";
import type { StepResult, WithCreateStepDecoder } from "./response.ts";
import type { WithCreateStepStreamDecoder } from "./stream.ts";

export type APIStepCodec<
    APIRequestType, APIResponseType,
    EncodeOptions extends object = object,
    DecodeOptions extends object = object,
    RequestType extends StepParams = StepParams,
    ResponseType extends StepResult = StepResult,
>
    = WithCreateStepEncoder<APIRequestType, RequestType, EncodeOptions>
    & WithCreateStepDecoder<APIResponseType, ResponseType, DecodeOptions>;

export type APIStepCodecWithStream<
    APIRequestType, APIResponseType, APIStreamType,
    EncodeOptions extends object = object,
    DecodeOptions extends object = object,
    StreamDecodeOptions extends object = DecodeOptions,
    RequestType extends StepParams = StepParams,
    ResponseType extends StepResult = StepResult,
>
    = APIStepCodec<APIRequestType, APIResponseType, EncodeOptions, DecodeOptions, RequestType, ResponseType>
    & WithCreateStepStreamDecoder<APIStreamType, ResponseType, StreamDecodeOptions>;