import type {Type, Out} from 'arktype';

declare const __public: unique symbol;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type PublicType<T, $ = {}> = Type<(In: unknown) => Out<T>, $> & {
    readonly [__public]: true;
};

export function exportType<T extends Type>(t: T) {
    return t as unknown as PublicType<T['inferOut']>;
}

export function assertEqualType<T, U extends T>(..._: [T] extends [U] ? [] : [never]): void {}

export type Nullable<T> = T | null | undefined;

export function unreachable(value: never): never {
    const unk_value = value as unknown;
    let repr: string;

    if((typeof unk_value === 'object') && unk_value !== null) {
        try {
            repr = JSON.stringify(unk_value);
        } catch{
            repr = String(unk_value);
        }
    } else {
        repr = String(unk_value);
    }

    throw new Error(`Unreachable code reached with value: '${repr}'`);
}
