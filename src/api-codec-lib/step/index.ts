export * from "./request.ts";
export * from "./response.ts";
export * from "./stream.ts";

import { createStepEncoder, type StepRequest, type WithCreateStepEncoder } from "./request.ts";
import { createStepDecoder, type StepResponse, type WithCreateStepDecoder } from "./response.ts";
import { createStepStreamDecoder, type StepStream, type WithCreateStepStreamDecoder } from "./stream.ts";

export type APIStepCodec<
    APIRequestType, APIResponseType,
    EncodeOptions extends object = object,
    DecodeOptions extends object = object,
    RequestType extends StepRequest = StepRequest,
    ResponseType extends StepResponse = StepResponse,
>
    = WithCreateStepEncoder<APIRequestType, RequestType, EncodeOptions>
    & WithCreateStepDecoder<APIResponseType, ResponseType, DecodeOptions>;

export type APIStepCodecWithStream<
    APIRequestType, APIResponseType, APIStreamType,
    EncodeOptions extends object = object,
    DecodeOptions extends object = object,
    StreamDecodeOptions extends object = DecodeOptions,
    RequestType extends StepRequest = StepRequest,
    ResponseType extends StepResponse = StepResponse,
>
    = APIStepCodec<APIRequestType, APIResponseType, EncodeOptions, DecodeOptions, RequestType, ResponseType>
    & WithCreateStepStreamDecoder<APIStreamType, ResponseType, StreamDecodeOptions>;

export type APIStep<
    APIRequestBaseType, APIResponseType, APIStreamType,
> = <IsStream extends boolean = false>(req: APIRequestBaseType & { stream?: IsStream }) => Promise<IsStream extends true ? APIStreamType : APIResponseType>;

export function wrapAPIStep<
    APIRequestBaseType, APIResponseType, APIStreamType,
    EncodeOptions extends object = object,
    DecodeOptions extends object = object,
    StreamDecodeOptions extends DecodeOptions = DecodeOptions,
    RequestType extends StepRequest = StepRequest,
    ResponseType extends StepResponse = StepResponse,
>(
    codec: APIStepCodecWithStream<APIRequestBaseType & { stream?: boolean }, APIResponseType, APIStreamType, EncodeOptions, DecodeOptions, StreamDecodeOptions, RequestType, ResponseType>,
    api: APIStep<APIRequestBaseType, APIResponseType, APIStreamType>,
    encode_options?: EncodeOptions,
    decode_options?: DecodeOptions,
    stream_decode_options?: StreamDecodeOptions,
): APIStep<RequestType, ResponseType, StepStream<ResponseType>> {
    const stepEncoder = createStepEncoder<APIRequestBaseType & { stream?: boolean }, RequestType, EncodeOptions>(codec, encode_options);
    const stepDecoder = createStepDecoder<APIResponseType, ResponseType, DecodeOptions>(codec, decode_options);
    const stepStreamDecoder = createStepStreamDecoder<APIStreamType, ResponseType, StreamDecodeOptions>(codec, stream_decode_options);
    
    return async <IsStream extends boolean = false>(req: RequestType & { stream?: IsStream }): Promise<IsStream extends true ? StepStream<ResponseType> : ResponseType> => {
        type APIResponseType = IsStream extends true ? APIStreamType : APIResponseType;
        type ReturnType = IsStream extends true ? StepStream<ResponseType> : ResponseType;
        const api_req = stepEncoder(req);
        // Skip type-checking due to TS2589
        const api_res = (await (api as (api_req: unknown) => Promise<unknown>)(api_req)) as APIResponseType;

        if (req.stream) {
            return stepStreamDecoder(api_res) as ReturnType;
        } else {
            return stepDecoder(api_res) as ReturnType;
        }
    };
}