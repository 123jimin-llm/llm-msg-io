import {type} from "arktype";
import {exportType} from "../../util/type.ts";
import {JSONSchema} from "./schema.ts";

export const FunctionDefinition = exportType(type({
    name: "string",
    description: "string",
    parameters: JSONSchema,
}).onUndeclaredKey('ignore'));
export type FunctionDefinition = typeof FunctionDefinition.infer;
