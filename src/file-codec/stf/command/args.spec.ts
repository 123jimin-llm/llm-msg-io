import { assert } from 'chai';
import { parseCommandArgs } from './args.js';

describe("file-codec/stf/command/args", () => {
    describe("parseCommandArgs()", () => {
        context("key-value format", () => {
            it("should parse simple key-value pairs", () => {
                const result = parseCommandArgs("role=user name=John");
                assert.deepStrictEqual(result, { role: 'user', name: 'John' });
            });
            
            it("should handle quoted values", () => {
                const result = parseCommandArgs(`role='user' name="John Doe"`);
                assert.deepStrictEqual(result, { role: 'user', name: 'John Doe' });
            });

            it("should handle values with spaces inside quotes", () => {
                const result = parseCommandArgs(`name="John Doe"`);
                assert.deepStrictEqual(result, { name: 'John Doe' });
            });

            it("should handle escaped quotes", () => {
                const result = parseCommandArgs(`data='he said \\'hi\\'' msg="she said \\"bye\\""`);
                assert.deepStrictEqual(result, { data: "he said 'hi'", msg: 'she said "bye"' });
            });

            it("should handle extra whitespace", () => {
                const result = parseCommandArgs("  role=user\t   name=John  ");
                assert.deepStrictEqual(result, { role: 'user', name: 'John' });
            });
            
            it("should not regard certain characters as whitespace", () => {
                const result = parseCommandArgs("  role=\vuser\v   name=\fJohn\f  ");
                assert.deepStrictEqual(result, { "role": "\vuser\v", name: "\fJohn\f" });
            });

            it("should return an empty object for an empty string", () => {
                const result = parseCommandArgs("");
                assert.deepStrictEqual(result, {});
            });

            it("should return an empty object for a whitespace-only string", () => {
                const result = parseCommandArgs("   ");
                assert.deepStrictEqual(result, {});
            });

            it("should handle empty quoted string values", () => {
                const result = parseCommandArgs(`role="" name=''`);
                assert.deepStrictEqual(result, { role: '', name: '' });
            });
        });

        context("JSON5 format", () => {
            it("should parse a simple JSON5 object", () => {
                const result = parseCommandArgs(`{role: "user", name: "John"}`);
                assert.deepStrictEqual(result, { role: 'user', name: 'John' });
            });

            it("should parse JSON5 with single quotes and unquoted keys", () => {
                const result = parseCommandArgs(`{role: 'user', name: 'John Doe'}`);
                assert.deepStrictEqual(result, { role: 'user', name: 'John Doe' });
            });

            it("should parse JSON5 with comments", () => {
                const result = parseCommandArgs(`{
                    // This is a comment
                    role: 'user', /* another comment */
                }`);
                assert.deepStrictEqual(result, { role: 'user' });
            });

            it("should parse JSON5 with various data types", () => {
                const result = parseCommandArgs(`{
                    str: 'value',
                    num: 123,
                    bool: true,
                    nil: null,
                }`);
                assert.deepStrictEqual(result, { str: 'value', num: 123, bool: true, nil: null });
            });

            it("should parse JSON5 with nested structures", () => {
                const result = parseCommandArgs(`{
                    user: { name: "John", role: "admin" },
                    tags: ["a", "b"],
                }`);
                assert.deepStrictEqual(result, {
                    user: { name: 'John', role: 'admin' },
                    tags: ['a', 'b'],
                });
            });

            it("should handle trailing commas in JSON5", () => {
                const result = parseCommandArgs(`{role: 'user',}`);
                assert.deepStrictEqual(result, { role: 'user' });
            });
        });

        context("invalid format", () => {
            it("should throw an error for unterminated quotes in key-value pairs", () => {
                assert.throws(() => parseCommandArgs(`name="John`));
            });

            it("should throw an error for invalid key-value format", () => {
                assert.throws(() => parseCommandArgs(`role=`));
                assert.throws(() => parseCommandArgs(`=user`));
                assert.throws(() => parseCommandArgs(`justa-key`));
            });

            it("should throw an error for invalid JSON5", () => {
                assert.throws(() => parseCommandArgs(`{role: 'user`));
            });

            it("should throw an error when mixing key-value and JSON5 formats", () => {
                assert.throws(() => parseCommandArgs(`role=user {name: 'John'}`));
            });
        });
    });
});