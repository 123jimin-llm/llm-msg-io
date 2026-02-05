/** A yield event. @typeParam Y - Yielded value type. */
export type AsyncYieldEvent<Y> = {type: 'yield'; value: Y};

/** A return event. @typeParam R - Return value type. */
export type AsyncReturnEvent<R> = {type: 'return'; value: R};

/** A throw event. @typeParam T - Error type (default: `unknown`). */
export type AsyncThrowEvent<T=unknown> = {type: 'throw'; value: T};

/**
 * Union of generator events: yield, return, or throw.
 *
 * @typeParam Y - Yielded value type.
 * @typeParam R - Return value type.
 * @typeParam T - Error type (default: `unknown`).
 */
export type AsyncEvent<Y, R, T=unknown> = AsyncYieldEvent<Y> | AsyncReturnEvent<R> | AsyncThrowEvent<T>;

/**
 * Interface for imperatively controlling an async generator.
 *
 * @typeParam Y - Yielded value type.
 * @typeParam R - Return value type.
 * @typeParam T - Thrown error type (default: `unknown`).
 *
 * @see {@link createGeneratorController}
 * @see {@link toAsyncGenerator}
 */
export interface GeneratorController<Y, R=void, T=unknown> {
    /** Yields a value. */
    yeet(y: Y): void;

    /** Completes the generator with a return value. */
    // eslint-disable-next-line @typescript-eslint/no-invalid-void-type
    done(...args: [R] extends [undefined|void] ? [] | [R] : [R]): void;

    /** Throws an error from the generator. */
    fail(t: T): void;

    /** Returns the async iterable of yielded values. */
    entries(): AsyncIterable<Y, R>;

    /** Returns a promise resolving to the final return value. */
    result(): Promise<R>;
}

/**
 * Creates a controller for imperatively driving an async generator.
 *
 * @typeParam Y - Yielded value type.
 * @typeParam R - Return value type.
 * @typeParam T - Thrown error type (default: `unknown`).
 * @returns A {@link GeneratorController}.
 *
 * @example
 * ```ts
 * const ctrl = createGeneratorController<number, string>();
 * ctrl.yeet(1);
 * ctrl.yeet(2);
 * ctrl.done("finished");
 *
 * for await (const v of ctrl.entries()) console.log(v); // 1, 2
 * ```
 */
export function createGeneratorController<Y, R=void, T=unknown>(): GeneratorController<Y, R, T> {
    const events: AsyncEvent<Y, R, T>[] = [];
    const waiters: (() => void)[] = [];

    let triggerResolveResult: ((result: R) => void)|null = null;
    let triggerRejectResult: ((error: T) => void)|null = null;

    const result_promise = new Promise<R>((resolve, reject) => {
        triggerResolveResult = resolve;
        triggerRejectResult = reject;
    });

    const push = (event: AsyncEvent<Y, R, T>) => {
        events.push(event);
        
        for(const waiter of waiters.splice(0)) {
            waiter();
        }

        switch(event.type) {
            case 'return':
                triggerResolveResult?.(event.value);
                return;
            case 'throw':
                triggerRejectResult?.(event.value);
                return;
        }
    };

    return {
        yeet(y: Y): void { push({type: 'yield', value: y}); },
        done(...args): void {
            const r = (args.length > 0 ? args[0] : (void 0)) as R;
            push({type: 'return', value: r});
        },
        fail(t: T): void { push({type: 'throw', value: t}); },
        entries(): AsyncIterable<Y, R> {
            return (async function*(): AsyncGenerator<Y, R> {
                let position = 0;

                while(true) {
                    while(position < events.length) {
                        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                        const event = events[position]!;
                        position++;

                        switch(event.type) {
                            case 'yield': { yield event.value; break; }
                            case 'return': { return event.value; }
                            case 'throw': { throw event.value; }
                        }
                    }

                    await new Promise<void>((resolve) => {
                        waiters.push(resolve);
                    });
                }
            })();
        },
        result(): Promise<R> {
            return result_promise;
        },
    };
}