export * from "./request.ts";
export * from "./response.ts";
export * from "./stream.ts";
export * from "./function.ts";

import type { Nullable } from "../../util/type.ts";
import { createStepEncoder, type StepParams, type WithCreateStepEncoder } from "./request.ts";
import { createStepDecoder, type StepResult, type WithCreateStepDecoder } from "./response.ts";
import { createStepStreamDecoder, type StepStream, type WithCreateStepStreamDecoder } from "./stream.ts";

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

export type APIStep<
    APIRequestBaseType, APIResponseType, APIStreamType,
> = <IsStream extends boolean = false>(req: APIRequestBaseType & { stream?: Nullable<IsStream> }) => Promise<APIStreamType | APIResponseType>;

export type StrictAPIStep<
    APIRequestBaseType, APIResponseType, APIStreamType,
> = <IsStream extends boolean = false>(req: APIRequestBaseType & { stream?: Nullable<IsStream> }) => Promise<IsStream extends true ? APIStreamType : APIResponseType>;

export function wrapAPIStep<
    APIRequestBaseType, APIResponseType, APIStreamType,
    EncodeOptions extends object = object,
    DecodeOptions extends object = object,
    StreamDecodeOptions extends DecodeOptions = DecodeOptions,
    RequestType extends StepParams = StepParams,
    ResponseType extends StepResult = StepResult,
>(
    codec: APIStepCodecWithStream<APIRequestBaseType & { stream?: Nullable<boolean> }, APIResponseType, APIStreamType, EncodeOptions, DecodeOptions, StreamDecodeOptions, RequestType, ResponseType>,
    api: APIStep<APIRequestBaseType, APIResponseType, APIStreamType>,
    encode_options?: EncodeOptions,
    decode_options?: DecodeOptions,
    stream_decode_options?: StreamDecodeOptions,
): StrictAPIStep<RequestType, ResponseType, StepStream<ResponseType>> {
    const stepEncoder = createStepEncoder<APIRequestBaseType & { stream?: Nullable<boolean> }, RequestType, EncodeOptions>(codec, encode_options);
    const stepDecoder = createStepDecoder<APIResponseType, ResponseType, DecodeOptions>(codec, decode_options);
    const stepStreamDecoder = createStepStreamDecoder<APIStreamType, ResponseType, StreamDecodeOptions>(codec, stream_decode_options);
    
    return async <IsStream extends boolean = false>(req: RequestType & { stream?: Nullable<IsStream> }): Promise<IsStream extends true ? StepStream<ResponseType> : ResponseType> => {
        type ReturnType = IsStream extends true ? StepStream<ResponseType> : ResponseType;
        const api_req = {...stepEncoder(req), stream: req.stream ?? false};
        // Skip type-checking due to TS2589
        const api_res = await (api as (api_req: unknown) => Promise<unknown>)(api_req);

        if (req.stream) {
            return stepStreamDecoder(api_res as APIStreamType) as ReturnType;
        } else {
            return stepDecoder(api_res as APIResponseType) as ReturnType;
        }
    };
}