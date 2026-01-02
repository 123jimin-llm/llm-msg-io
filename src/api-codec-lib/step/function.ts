import { type } from "arktype";
import { exportType } from "../../util/type.ts";

export const FunctionDefinition = exportType(type({
    name: "string",
    description: "string",
    parameters: "unknown", // JSON schema
}).onUndeclaredKey('ignore'));
export type FunctionDefinition = typeof FunctionDefinition.infer;