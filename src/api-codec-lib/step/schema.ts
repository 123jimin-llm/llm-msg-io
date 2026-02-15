import {type} from "arktype";
import {exportType} from "../../util/type.ts";

/** JSON Schema object. Opaque to this library; passed through to providers as-is. */
export const JSONSchema = type("unknown");
export type JSONSchema = typeof JSONSchema.infer;

export const ResponseSchema = exportType(type({
    name: "string",
    schema: JSONSchema,
}));
export type ResponseSchema = typeof ResponseSchema.infer;
