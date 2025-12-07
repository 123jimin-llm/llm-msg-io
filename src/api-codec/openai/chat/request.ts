import type {
    ChatCompletionCreateParams,
} from "openai/resources/chat/completions";

import type { Nullable } from "../../../util/type.ts";
import type { WithCreateStepEncoder } from "../../../api-codec-lib/step/request.ts";

function toChatCompletionContent(content: Nullable<MessageContent>): OpenAIChatInputMessage['content'] {
    if(content == null) return null;

    if(typeof content === 'string') {
        return content;
    }

    return content.map((part): ChatCompletionContentPart => {
        switch(part.type) {
            case 'text':
                return { type: 'text', text: part.text };
            case 'image': {
                if(part.url) {
                    return { type: 'image_url', image_url: { url: part.url } };
                }
                if(part.data) {
                    const b64_data = (typeof part.data === 'string') ? part.data : Buffer.from(part.data).toString('base64');
                    const format = part.format ?? 'png';
                    return {
                        type: 'image_url',
                        image_url: { url: `data:image/${format};base64,${b64_data}` },
                    };
                }
                throw new Error("Image content part must have url or data.");
            }
            case 'audio': {
                if(!part.data) throw new Error("Audio content part must have data.");
                const b64_data = (typeof part.data === 'string') ? part.data : Buffer.from(part.data).toString('base64');
                return {
                    type: 'input_audio',
                    input_audio: {
                        data: b64_data,
                        format: part.format as 'wav' | 'mp3' ?? 'wav',
                    },
                };
            }
            case 'file': {
                const file: ChatCompletionContentPart.File.File = {};
                if(part.file_id) file.file_id = part.file_id;
                if(part.name) file.filename = part.name;
                if(part.data) {
                    const b64_data = (typeof part.data === 'string') ? part.data : Buffer.from(part.data).toString('base64');
                    file.file_data = b64_data;
                }
                return { type: 'file', file };
            }
            default:
                throw new Error(`Unknown type: '${(part as {type: string}).type}'`);
        }
    });
}

export const OpenAIChatRequestCodec = {

} satisfies WithCreateStepEncoder<ChatCompletionCreateParams>;