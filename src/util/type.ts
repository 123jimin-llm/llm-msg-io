import type { Type, Out } from 'arktype';

declare const __public: unique symbol;

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type PublicType<T, $ = {}> = Type<(In: unknown) => Out<T>, $> & {
    readonly [__public]: true;
};

export function exportType<T extends Type>(t: T) {
    return t as unknown as PublicType<T['inferOut']>;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function assertEqualType<T, U extends T>(..._: [T] extends [U] ? [] : [never]): void {}

export type Nullable<T> = T | null | undefined;