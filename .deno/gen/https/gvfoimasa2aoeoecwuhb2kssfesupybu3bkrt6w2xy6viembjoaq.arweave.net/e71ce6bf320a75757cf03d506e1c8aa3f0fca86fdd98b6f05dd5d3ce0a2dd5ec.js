// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible. Do not rely on good formatting of values
// for AssertionError messages in browsers.
import { bold, gray, green, red, stripColor, white } from "../fmt/colors.ts";
import { diff, DiffType } from "./_diff.ts";
const CAN_NOT_DISPLAY = "[Cannot display]";
export class AssertionError extends Error {
    constructor(message){
        super(message);
        this.name = "AssertionError";
    }
}
/**
 * Converts the input into a string. Objects, Sets and Maps are sorted so as to
 * make tests less flaky
 * @param v Value to be formatted
 */ export function _format(v) {
    return globalThis.Deno ? Deno.inspect(v, {
        depth: Infinity,
        sorted: true,
        trailingComma: true,
        compact: false,
        iterableLimit: Infinity
    }) : `"${String(v).replace(/(?=["\\])/g, "\\")}"`;
}
/**
 * Colors the output of assertion diffs
 * @param diffType Difference type, either added or removed
 */ function createColor(diffType) {
    switch(diffType){
        case DiffType.added:
            return (s)=>green(bold(s))
            ;
        case DiffType.removed:
            return (s)=>red(bold(s))
            ;
        default:
            return white;
    }
}
/**
 * Prefixes `+` or `-` in diff output
 * @param diffType Difference type, either added or removed
 */ function createSign(diffType) {
    switch(diffType){
        case DiffType.added:
            return "+   ";
        case DiffType.removed:
            return "-   ";
        default:
            return "    ";
    }
}
function buildMessage(diffResult) {
    const messages = [];
    messages.push("");
    messages.push("");
    messages.push(`    ${gray(bold("[Diff]"))} ${red(bold("Actual"))} / ${green(bold("Expected"))}`);
    messages.push("");
    messages.push("");
    diffResult.forEach((result)=>{
        const c = createColor(result.type);
        messages.push(c(`${createSign(result.type)}${result.value}`));
    });
    messages.push("");
    return messages;
}
function isKeyedCollection(x) {
    return [
        Symbol.iterator,
        "size"
    ].every((k)=>k in x
    );
}
/**
 * Deep equality comparison used in assertions
 * @param c actual value
 * @param d expected value
 */ export function equal(c, d) {
    const seen = new Map();
    return (function compare(a, b) {
        // Have to render RegExp & Date for string comparison
        // unless it's mistreated as object
        if (a && b && (a instanceof RegExp && b instanceof RegExp || a instanceof URL && b instanceof URL)) {
            return String(a) === String(b);
        }
        if (a instanceof Date && b instanceof Date) {
            const aTime = a.getTime();
            const bTime = b.getTime();
            // Check for NaN equality manually since NaN is not
            // equal to itself.
            if (Number.isNaN(aTime) && Number.isNaN(bTime)) {
                return true;
            }
            return a.getTime() === b.getTime();
        }
        if (Object.is(a, b)) {
            return true;
        }
        if (a && typeof a === "object" && b && typeof b === "object") {
            if (seen.get(a) === b) {
                return true;
            }
            if (Object.keys(a || {
            }).length !== Object.keys(b || {
            }).length) {
                return false;
            }
            if (isKeyedCollection(a) && isKeyedCollection(b)) {
                if (a.size !== b.size) {
                    return false;
                }
                let unmatchedEntries = a.size;
                for (const [aKey, aValue] of a.entries()){
                    for (const [bKey, bValue] of b.entries()){
                        /* Given that Map keys can be references, we need
             * to ensure that they are also deeply equal */ if (aKey === aValue && bKey === bValue && compare(aKey, bKey) || compare(aKey, bKey) && compare(aValue, bValue)) {
                            unmatchedEntries--;
                        }
                    }
                }
                return unmatchedEntries === 0;
            }
            const merged = {
                ...a,
                ...b
            };
            for (const key of [
                ...Object.getOwnPropertyNames(merged),
                ...Object.getOwnPropertySymbols(merged), 
            ]){
                if (!compare(a && a[key], b && b[key])) {
                    return false;
                }
                if (key in a && !(key in b) || key in b && !(key in a)) {
                    return false;
                }
            }
            seen.set(a, b);
            return true;
        }
        return false;
    })(c, d);
}
/** Make an assertion, error will be thrown if `expr` does not have truthy value. */ export function assert(expr, msg = "") {
    if (!expr) {
        throw new AssertionError(msg);
    }
}
export function assertEquals(actual, expected, msg) {
    if (equal(actual, expected)) {
        return;
    }
    let message = "";
    const actualString = _format(actual);
    const expectedString = _format(expected);
    try {
        const diffResult = diff(actualString.split("\n"), expectedString.split("\n"));
        const diffMsg = buildMessage(diffResult).join("\n");
        message = `Values are not equal:\n${diffMsg}`;
    } catch  {
        message = `\n${red(CAN_NOT_DISPLAY)} + \n\n`;
    }
    if (msg) {
        message = msg;
    }
    throw new AssertionError(message);
}
export function assertNotEquals(actual, expected, msg) {
    if (!equal(actual, expected)) {
        return;
    }
    let actualString;
    let expectedString;
    try {
        actualString = String(actual);
    } catch  {
        actualString = "[Cannot display]";
    }
    try {
        expectedString = String(expected);
    } catch  {
        expectedString = "[Cannot display]";
    }
    if (!msg) {
        msg = `actual: ${actualString} expected: ${expectedString}`;
    }
    throw new AssertionError(msg);
}
export function assertStrictEquals(actual, expected, msg) {
    if (actual === expected) {
        return;
    }
    let message;
    if (msg) {
        message = msg;
    } else {
        const actualString = _format(actual);
        const expectedString = _format(expected);
        if (actualString === expectedString) {
            const withOffset = actualString.split("\n").map((l)=>`    ${l}`
            ).join("\n");
            message = `Values have the same structure but are not reference-equal:\n\n${red(withOffset)}\n`;
        } else {
            try {
                const diffResult = diff(actualString.split("\n"), expectedString.split("\n"));
                const diffMsg = buildMessage(diffResult).join("\n");
                message = `Values are not strictly equal:\n${diffMsg}`;
            } catch  {
                message = `\n${red(CAN_NOT_DISPLAY)} + \n\n`;
            }
        }
    }
    throw new AssertionError(message);
}
export function assertNotStrictEquals(actual, expected, msg) {
    if (actual !== expected) {
        return;
    }
    throw new AssertionError(msg ?? `Expected "actual" to be strictly unequal to: ${_format(actual)}\n`);
}
/**
 * Make an assertion that actual is not null or undefined. If not
 * then thrown.
 */ export function assertExists(actual, msg) {
    if (actual === undefined || actual === null) {
        if (!msg) {
            msg = `actual: "${actual}" expected to match anything but null or undefined`;
        }
        throw new AssertionError(msg);
    }
}
/**
 * Make an assertion that actual includes expected. If not
 * then thrown.
 */ export function assertStringIncludes(actual, expected, msg) {
    if (!actual.includes(expected)) {
        if (!msg) {
            msg = `actual: "${actual}" expected to contain: "${expected}"`;
        }
        throw new AssertionError(msg);
    }
}
export function assertArrayIncludes(actual, expected, msg) {
    const missing = [];
    for(let i = 0; i < expected.length; i++){
        let found = false;
        for(let j = 0; j < actual.length; j++){
            if (equal(expected[i], actual[j])) {
                found = true;
                break;
            }
        }
        if (!found) {
            missing.push(expected[i]);
        }
    }
    if (missing.length === 0) {
        return;
    }
    if (!msg) {
        msg = `actual: "${_format(actual)}" expected to include: "${_format(expected)}"\nmissing: ${_format(missing)}`;
    }
    throw new AssertionError(msg);
}
/**
 * Make an assertion that `actual` match RegExp `expected`. If not
 * then thrown
 */ export function assertMatch(actual, expected, msg) {
    if (!expected.test(actual)) {
        if (!msg) {
            msg = `actual: "${actual}" expected to match: "${expected}"`;
        }
        throw new AssertionError(msg);
    }
}
/**
 * Make an assertion that `actual` not match RegExp `expected`. If match
 * then thrown
 */ export function assertNotMatch(actual, expected, msg) {
    if (expected.test(actual)) {
        if (!msg) {
            msg = `actual: "${actual}" expected to not match: "${expected}"`;
        }
        throw new AssertionError(msg);
    }
}
/**
 * Make an assertion that `actual` object is a subset of `expected` object, deeply.
 * If not, then throw.
 */ export function assertObjectMatch(// deno-lint-ignore no-explicit-any
actual, expected) {
    const seen = new WeakMap();
    return assertEquals(function filter(a, b) {
        // Prevent infinite loop with circular references with same filter
        if (seen.has(a) && seen.get(a) === b) {
            return a;
        }
        seen.set(a, b);
        // Filter keys and symbols which are present in both actual and expected
        const filtered = {
        };
        const entries = [
            ...Object.getOwnPropertyNames(a),
            ...Object.getOwnPropertySymbols(a), 
        ].filter((key)=>key in b
        ).map((key)=>[
                key,
                a[key]
            ]
        );
        for (const [key, value] of entries){
            // On array references, build a filtered array and filter nested objects inside
            if (Array.isArray(value)) {
                const subset = b[key];
                if (Array.isArray(subset)) {
                    filtered[key] = value.slice(0, subset.length).map((element, index)=>{
                        const subsetElement = subset[index];
                        if (typeof subsetElement === "object" && subsetElement) {
                            return filter(element, subsetElement);
                        }
                        return element;
                    });
                    continue;
                }
            } else if (typeof value === "object") {
                const subset = b[key];
                if (typeof subset === "object" && subset) {
                    filtered[key] = filter(value, subset);
                    continue;
                }
            }
            filtered[key] = value;
        }
        return filtered;
    }(actual, expected), expected);
}
/**
 * Forcefully throws a failed assertion
 */ export function fail(msg) {
    // eslint-disable-next-line @typescript-eslint/no-use-before-define
    assert(false, `Failed assertion${msg ? `: ${msg}` : "."}`);
}
/**
 * Executes a function, expecting it to throw.  If it does not, then it
 * throws.  An error class and a string that should be included in the
 * error message can also be asserted.
 */ export function assertThrows(fn, ErrorClass, msgIncludes = "", msg) {
    let doesThrow = false;
    let error = null;
    try {
        fn();
    } catch (e) {
        if (e instanceof Error === false) {
            throw new AssertionError("A non-Error object was thrown.");
        }
        if (ErrorClass && !(e instanceof ErrorClass)) {
            msg = `Expected error to be instance of "${ErrorClass.name}", but was "${e.constructor.name}"${msg ? `: ${msg}` : "."}`;
            throw new AssertionError(msg);
        }
        if (msgIncludes && !stripColor(e.message).includes(stripColor(msgIncludes))) {
            msg = `Expected error message to include "${msgIncludes}", but got "${e.message}"${msg ? `: ${msg}` : "."}`;
            throw new AssertionError(msg);
        }
        doesThrow = true;
        error = e;
    }
    if (!doesThrow) {
        msg = `Expected function to throw${msg ? `: ${msg}` : "."}`;
        throw new AssertionError(msg);
    }
    return error;
}
/**
 * Executes a function which returns a promise, expecting it to throw or reject.
 * If it does not, then it throws.  An error class and a string that should be
 * included in the error message can also be asserted.
 */ export async function assertThrowsAsync(fn, ErrorClass, msgIncludes = "", msg) {
    let doesThrow = false;
    let error = null;
    try {
        await fn();
    } catch (e) {
        if (e instanceof Error === false) {
            throw new AssertionError("A non-Error object was thrown or rejected.");
        }
        if (ErrorClass && !(e instanceof ErrorClass)) {
            msg = `Expected error to be instance of "${ErrorClass.name}", but got "${e.name}"${msg ? `: ${msg}` : "."}`;
            throw new AssertionError(msg);
        }
        if (msgIncludes && !stripColor(e.message).includes(stripColor(msgIncludes))) {
            msg = `Expected error message to include "${msgIncludes}", but got "${e.message}"${msg ? `: ${msg}` : "."}`;
            throw new AssertionError(msg);
        }
        doesThrow = true;
        error = e;
    }
    if (!doesThrow) {
        msg = `Expected function to throw${msg ? `: ${msg}` : "."}`;
        throw new AssertionError(msg);
    }
    return error;
}
/** Use this to stub out methods that will throw when invoked. */ export function unimplemented(msg) {
    throw new AssertionError(msg || "unimplemented");
}
/** Use this to assert unreachable code. */ export function unreachable() {
    throw new AssertionError("unreachable");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZ3Zmb2ltYXNhMmFvZW9lY3d1aGIya3NzZmVzdXB5YnUzYmtydDZ3Mnh5NnZpZW1iam9hcS5hcndlYXZlLm5ldC9OVXJrTUJJR2dPSTRnclVPSFNwU0tTVkg0RFRZVlJuNjJyNDlWQkdCUzRFL3Rlc3RpbmcvYXNzZXJ0cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLiBEbyBub3QgcmVseSBvbiBnb29kIGZvcm1hdHRpbmcgb2YgdmFsdWVzXG4vLyBmb3IgQXNzZXJ0aW9uRXJyb3IgbWVzc2FnZXMgaW4gYnJvd3NlcnMuXG5cbmltcG9ydCB7IGJvbGQsIGdyYXksIGdyZWVuLCByZWQsIHN0cmlwQ29sb3IsIHdoaXRlIH0gZnJvbSBcIi4uL2ZtdC9jb2xvcnMudHNcIjtcbmltcG9ydCB7IGRpZmYsIERpZmZSZXN1bHQsIERpZmZUeXBlIH0gZnJvbSBcIi4vX2RpZmYudHNcIjtcblxuY29uc3QgQ0FOX05PVF9ESVNQTEFZID0gXCJbQ2Fubm90IGRpc3BsYXldXCI7XG5cbmludGVyZmFjZSBDb25zdHJ1Y3RvciB7XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIG5ldyAoLi4uYXJnczogYW55W10pOiBhbnk7XG59XG5cbmV4cG9ydCBjbGFzcyBBc3NlcnRpb25FcnJvciBleHRlbmRzIEVycm9yIHtcbiAgY29uc3RydWN0b3IobWVzc2FnZTogc3RyaW5nKSB7XG4gICAgc3VwZXIobWVzc2FnZSk7XG4gICAgdGhpcy5uYW1lID0gXCJBc3NlcnRpb25FcnJvclwiO1xuICB9XG59XG5cbi8qKlxuICogQ29udmVydHMgdGhlIGlucHV0IGludG8gYSBzdHJpbmcuIE9iamVjdHMsIFNldHMgYW5kIE1hcHMgYXJlIHNvcnRlZCBzbyBhcyB0b1xuICogbWFrZSB0ZXN0cyBsZXNzIGZsYWt5XG4gKiBAcGFyYW0gdiBWYWx1ZSB0byBiZSBmb3JtYXR0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIF9mb3JtYXQodjogdW5rbm93bik6IHN0cmluZyB7XG4gIHJldHVybiBnbG9iYWxUaGlzLkRlbm9cbiAgICA/IERlbm8uaW5zcGVjdCh2LCB7XG4gICAgICBkZXB0aDogSW5maW5pdHksXG4gICAgICBzb3J0ZWQ6IHRydWUsXG4gICAgICB0cmFpbGluZ0NvbW1hOiB0cnVlLFxuICAgICAgY29tcGFjdDogZmFsc2UsXG4gICAgICBpdGVyYWJsZUxpbWl0OiBJbmZpbml0eSxcbiAgICB9KVxuICAgIDogYFwiJHtTdHJpbmcodikucmVwbGFjZSgvKD89W1wiXFxcXF0pL2csIFwiXFxcXFwiKX1cImA7XG59XG5cbi8qKlxuICogQ29sb3JzIHRoZSBvdXRwdXQgb2YgYXNzZXJ0aW9uIGRpZmZzXG4gKiBAcGFyYW0gZGlmZlR5cGUgRGlmZmVyZW5jZSB0eXBlLCBlaXRoZXIgYWRkZWQgb3IgcmVtb3ZlZFxuICovXG5mdW5jdGlvbiBjcmVhdGVDb2xvcihkaWZmVHlwZTogRGlmZlR5cGUpOiAoczogc3RyaW5nKSA9PiBzdHJpbmcge1xuICBzd2l0Y2ggKGRpZmZUeXBlKSB7XG4gICAgY2FzZSBEaWZmVHlwZS5hZGRlZDpcbiAgICAgIHJldHVybiAoczogc3RyaW5nKTogc3RyaW5nID0+IGdyZWVuKGJvbGQocykpO1xuICAgIGNhc2UgRGlmZlR5cGUucmVtb3ZlZDpcbiAgICAgIHJldHVybiAoczogc3RyaW5nKTogc3RyaW5nID0+IHJlZChib2xkKHMpKTtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIHdoaXRlO1xuICB9XG59XG5cbi8qKlxuICogUHJlZml4ZXMgYCtgIG9yIGAtYCBpbiBkaWZmIG91dHB1dFxuICogQHBhcmFtIGRpZmZUeXBlIERpZmZlcmVuY2UgdHlwZSwgZWl0aGVyIGFkZGVkIG9yIHJlbW92ZWRcbiAqL1xuZnVuY3Rpb24gY3JlYXRlU2lnbihkaWZmVHlwZTogRGlmZlR5cGUpOiBzdHJpbmcge1xuICBzd2l0Y2ggKGRpZmZUeXBlKSB7XG4gICAgY2FzZSBEaWZmVHlwZS5hZGRlZDpcbiAgICAgIHJldHVybiBcIisgICBcIjtcbiAgICBjYXNlIERpZmZUeXBlLnJlbW92ZWQ6XG4gICAgICByZXR1cm4gXCItICAgXCI7XG4gICAgZGVmYXVsdDpcbiAgICAgIHJldHVybiBcIiAgICBcIjtcbiAgfVxufVxuXG5mdW5jdGlvbiBidWlsZE1lc3NhZ2UoZGlmZlJlc3VsdDogUmVhZG9ubHlBcnJheTxEaWZmUmVzdWx0PHN0cmluZz4+KTogc3RyaW5nW10ge1xuICBjb25zdCBtZXNzYWdlczogc3RyaW5nW10gPSBbXTtcbiAgbWVzc2FnZXMucHVzaChcIlwiKTtcbiAgbWVzc2FnZXMucHVzaChcIlwiKTtcbiAgbWVzc2FnZXMucHVzaChcbiAgICBgICAgICR7Z3JheShib2xkKFwiW0RpZmZdXCIpKX0gJHtyZWQoYm9sZChcIkFjdHVhbFwiKSl9IC8gJHtcbiAgICAgIGdyZWVuKGJvbGQoXCJFeHBlY3RlZFwiKSlcbiAgICB9YCxcbiAgKTtcbiAgbWVzc2FnZXMucHVzaChcIlwiKTtcbiAgbWVzc2FnZXMucHVzaChcIlwiKTtcbiAgZGlmZlJlc3VsdC5mb3JFYWNoKChyZXN1bHQ6IERpZmZSZXN1bHQ8c3RyaW5nPik6IHZvaWQgPT4ge1xuICAgIGNvbnN0IGMgPSBjcmVhdGVDb2xvcihyZXN1bHQudHlwZSk7XG4gICAgbWVzc2FnZXMucHVzaChjKGAke2NyZWF0ZVNpZ24ocmVzdWx0LnR5cGUpfSR7cmVzdWx0LnZhbHVlfWApKTtcbiAgfSk7XG4gIG1lc3NhZ2VzLnB1c2goXCJcIik7XG5cbiAgcmV0dXJuIG1lc3NhZ2VzO1xufVxuXG5mdW5jdGlvbiBpc0tleWVkQ29sbGVjdGlvbih4OiB1bmtub3duKTogeCBpcyBTZXQ8dW5rbm93bj4ge1xuICByZXR1cm4gW1N5bWJvbC5pdGVyYXRvciwgXCJzaXplXCJdLmV2ZXJ5KChrKSA9PiBrIGluICh4IGFzIFNldDx1bmtub3duPikpO1xufVxuXG4vKipcbiAqIERlZXAgZXF1YWxpdHkgY29tcGFyaXNvbiB1c2VkIGluIGFzc2VydGlvbnNcbiAqIEBwYXJhbSBjIGFjdHVhbCB2YWx1ZVxuICogQHBhcmFtIGQgZXhwZWN0ZWQgdmFsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGVxdWFsKGM6IHVua25vd24sIGQ6IHVua25vd24pOiBib29sZWFuIHtcbiAgY29uc3Qgc2VlbiA9IG5ldyBNYXAoKTtcbiAgcmV0dXJuIChmdW5jdGlvbiBjb21wYXJlKGE6IHVua25vd24sIGI6IHVua25vd24pOiBib29sZWFuIHtcbiAgICAvLyBIYXZlIHRvIHJlbmRlciBSZWdFeHAgJiBEYXRlIGZvciBzdHJpbmcgY29tcGFyaXNvblxuICAgIC8vIHVubGVzcyBpdCdzIG1pc3RyZWF0ZWQgYXMgb2JqZWN0XG4gICAgaWYgKFxuICAgICAgYSAmJlxuICAgICAgYiAmJlxuICAgICAgKChhIGluc3RhbmNlb2YgUmVnRXhwICYmIGIgaW5zdGFuY2VvZiBSZWdFeHApIHx8XG4gICAgICAgIChhIGluc3RhbmNlb2YgVVJMICYmIGIgaW5zdGFuY2VvZiBVUkwpKVxuICAgICkge1xuICAgICAgcmV0dXJuIFN0cmluZyhhKSA9PT0gU3RyaW5nKGIpO1xuICAgIH1cbiAgICBpZiAoYSBpbnN0YW5jZW9mIERhdGUgJiYgYiBpbnN0YW5jZW9mIERhdGUpIHtcbiAgICAgIGNvbnN0IGFUaW1lID0gYS5nZXRUaW1lKCk7XG4gICAgICBjb25zdCBiVGltZSA9IGIuZ2V0VGltZSgpO1xuICAgICAgLy8gQ2hlY2sgZm9yIE5hTiBlcXVhbGl0eSBtYW51YWxseSBzaW5jZSBOYU4gaXMgbm90XG4gICAgICAvLyBlcXVhbCB0byBpdHNlbGYuXG4gICAgICBpZiAoTnVtYmVyLmlzTmFOKGFUaW1lKSAmJiBOdW1iZXIuaXNOYU4oYlRpbWUpKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgcmV0dXJuIGEuZ2V0VGltZSgpID09PSBiLmdldFRpbWUoKTtcbiAgICB9XG4gICAgaWYgKE9iamVjdC5pcyhhLCBiKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmIChhICYmIHR5cGVvZiBhID09PSBcIm9iamVjdFwiICYmIGIgJiYgdHlwZW9mIGIgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgIGlmIChzZWVuLmdldChhKSA9PT0gYikge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIGlmIChPYmplY3Qua2V5cyhhIHx8IHt9KS5sZW5ndGggIT09IE9iamVjdC5rZXlzKGIgfHwge30pLmxlbmd0aCkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoaXNLZXllZENvbGxlY3Rpb24oYSkgJiYgaXNLZXllZENvbGxlY3Rpb24oYikpIHtcbiAgICAgICAgaWYgKGEuc2l6ZSAhPT0gYi5zaXplKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgbGV0IHVubWF0Y2hlZEVudHJpZXMgPSBhLnNpemU7XG5cbiAgICAgICAgZm9yIChjb25zdCBbYUtleSwgYVZhbHVlXSBvZiBhLmVudHJpZXMoKSkge1xuICAgICAgICAgIGZvciAoY29uc3QgW2JLZXksIGJWYWx1ZV0gb2YgYi5lbnRyaWVzKCkpIHtcbiAgICAgICAgICAgIC8qIEdpdmVuIHRoYXQgTWFwIGtleXMgY2FuIGJlIHJlZmVyZW5jZXMsIHdlIG5lZWRcbiAgICAgICAgICAgICAqIHRvIGVuc3VyZSB0aGF0IHRoZXkgYXJlIGFsc28gZGVlcGx5IGVxdWFsICovXG4gICAgICAgICAgICBpZiAoXG4gICAgICAgICAgICAgIChhS2V5ID09PSBhVmFsdWUgJiYgYktleSA9PT0gYlZhbHVlICYmIGNvbXBhcmUoYUtleSwgYktleSkpIHx8XG4gICAgICAgICAgICAgIChjb21wYXJlKGFLZXksIGJLZXkpICYmIGNvbXBhcmUoYVZhbHVlLCBiVmFsdWUpKVxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHVubWF0Y2hlZEVudHJpZXMtLTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gdW5tYXRjaGVkRW50cmllcyA9PT0gMDtcbiAgICAgIH1cbiAgICAgIGNvbnN0IG1lcmdlZCA9IHsgLi4uYSwgLi4uYiB9O1xuICAgICAgZm9yIChcbiAgICAgICAgY29uc3Qga2V5IG9mIFtcbiAgICAgICAgICAuLi5PYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhtZXJnZWQpLFxuICAgICAgICAgIC4uLk9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMobWVyZ2VkKSxcbiAgICAgICAgXVxuICAgICAgKSB7XG4gICAgICAgIHR5cGUgS2V5ID0ga2V5b2YgdHlwZW9mIG1lcmdlZDtcbiAgICAgICAgaWYgKCFjb21wYXJlKGEgJiYgYVtrZXkgYXMgS2V5XSwgYiAmJiBiW2tleSBhcyBLZXldKSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoKChrZXkgaW4gYSkgJiYgKCEoa2V5IGluIGIpKSkgfHwgKChrZXkgaW4gYikgJiYgKCEoa2V5IGluIGEpKSkpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHNlZW4uc2V0KGEsIGIpO1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIHJldHVybiBmYWxzZTtcbiAgfSkoYywgZCk7XG59XG5cbi8qKiBNYWtlIGFuIGFzc2VydGlvbiwgZXJyb3Igd2lsbCBiZSB0aHJvd24gaWYgYGV4cHJgIGRvZXMgbm90IGhhdmUgdHJ1dGh5IHZhbHVlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydChleHByOiB1bmtub3duLCBtc2cgPSBcIlwiKTogYXNzZXJ0cyBleHByIHtcbiAgaWYgKCFleHByKSB7XG4gICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG4gIH1cbn1cblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIGFuZCBgZXhwZWN0ZWRgIGFyZSBlcXVhbCwgZGVlcGx5LiBJZiBub3RcbiAqIGRlZXBseSBlcXVhbCwgdGhlbiB0aHJvdy5cbiAqXG4gKiBUeXBlIHBhcmFtZXRlciBjYW4gYmUgc3BlY2lmaWVkIHRvIGVuc3VyZSB2YWx1ZXMgdW5kZXIgY29tcGFyaXNvbiBoYXZlIHRoZSBzYW1lIHR5cGUuXG4gKiBGb3IgZXhhbXBsZTpcbiAqYGBgdHNcbiAqYXNzZXJ0RXF1YWxzPG51bWJlcj4oMSwgMilcbiAqYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRFcXVhbHMoXG4gIGFjdHVhbDogdW5rbm93bixcbiAgZXhwZWN0ZWQ6IHVua25vd24sXG4gIG1zZz86IHN0cmluZyxcbik6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0RXF1YWxzPFQ+KGFjdHVhbDogVCwgZXhwZWN0ZWQ6IFQsIG1zZz86IHN0cmluZyk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0RXF1YWxzKFxuICBhY3R1YWw6IHVua25vd24sXG4gIGV4cGVjdGVkOiB1bmtub3duLFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkIHtcbiAgaWYgKGVxdWFsKGFjdHVhbCwgZXhwZWN0ZWQpKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGxldCBtZXNzYWdlID0gXCJcIjtcbiAgY29uc3QgYWN0dWFsU3RyaW5nID0gX2Zvcm1hdChhY3R1YWwpO1xuICBjb25zdCBleHBlY3RlZFN0cmluZyA9IF9mb3JtYXQoZXhwZWN0ZWQpO1xuICB0cnkge1xuICAgIGNvbnN0IGRpZmZSZXN1bHQgPSBkaWZmKFxuICAgICAgYWN0dWFsU3RyaW5nLnNwbGl0KFwiXFxuXCIpLFxuICAgICAgZXhwZWN0ZWRTdHJpbmcuc3BsaXQoXCJcXG5cIiksXG4gICAgKTtcbiAgICBjb25zdCBkaWZmTXNnID0gYnVpbGRNZXNzYWdlKGRpZmZSZXN1bHQpLmpvaW4oXCJcXG5cIik7XG4gICAgbWVzc2FnZSA9IGBWYWx1ZXMgYXJlIG5vdCBlcXVhbDpcXG4ke2RpZmZNc2d9YDtcbiAgfSBjYXRjaCB7XG4gICAgbWVzc2FnZSA9IGBcXG4ke3JlZChDQU5fTk9UX0RJU1BMQVkpfSArIFxcblxcbmA7XG4gIH1cbiAgaWYgKG1zZykge1xuICAgIG1lc3NhZ2UgPSBtc2c7XG4gIH1cbiAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1lc3NhZ2UpO1xufVxuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgYW5kIGBleHBlY3RlZGAgYXJlIG5vdCBlcXVhbCwgZGVlcGx5LlxuICogSWYgbm90IHRoZW4gdGhyb3cuXG4gKlxuICogVHlwZSBwYXJhbWV0ZXIgY2FuIGJlIHNwZWNpZmllZCB0byBlbnN1cmUgdmFsdWVzIHVuZGVyIGNvbXBhcmlzb24gaGF2ZSB0aGUgc2FtZSB0eXBlLlxuICogRm9yIGV4YW1wbGU6XG4gKmBgYHRzXG4gKmFzc2VydE5vdEVxdWFsczxudW1iZXI+KDEsIDIpXG4gKmBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Tm90RXF1YWxzKFxuICBhY3R1YWw6IHVua25vd24sXG4gIGV4cGVjdGVkOiB1bmtub3duLFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vdEVxdWFsczxUPihhY3R1YWw6IFQsIGV4cGVjdGVkOiBULCBtc2c/OiBzdHJpbmcpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vdEVxdWFscyhcbiAgYWN0dWFsOiB1bmtub3duLFxuICBleHBlY3RlZDogdW5rbm93bixcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZCB7XG4gIGlmICghZXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgbGV0IGFjdHVhbFN0cmluZzogc3RyaW5nO1xuICBsZXQgZXhwZWN0ZWRTdHJpbmc6IHN0cmluZztcbiAgdHJ5IHtcbiAgICBhY3R1YWxTdHJpbmcgPSBTdHJpbmcoYWN0dWFsKTtcbiAgfSBjYXRjaCB7XG4gICAgYWN0dWFsU3RyaW5nID0gXCJbQ2Fubm90IGRpc3BsYXldXCI7XG4gIH1cbiAgdHJ5IHtcbiAgICBleHBlY3RlZFN0cmluZyA9IFN0cmluZyhleHBlY3RlZCk7XG4gIH0gY2F0Y2gge1xuICAgIGV4cGVjdGVkU3RyaW5nID0gXCJbQ2Fubm90IGRpc3BsYXldXCI7XG4gIH1cbiAgaWYgKCFtc2cpIHtcbiAgICBtc2cgPSBgYWN0dWFsOiAke2FjdHVhbFN0cmluZ30gZXhwZWN0ZWQ6ICR7ZXhwZWN0ZWRTdHJpbmd9YDtcbiAgfVxuICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbn1cblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIGFuZCBgZXhwZWN0ZWRgIGFyZSBzdHJpY3RseSBlcXVhbC4gIElmXG4gKiBub3QgdGhlbiB0aHJvdy5cbiAqIGBgYHRzXG4gKiBhc3NlcnRTdHJpY3RFcXVhbHMoMSwgMilcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0U3RyaWN0RXF1YWxzKFxuICBhY3R1YWw6IHVua25vd24sXG4gIGV4cGVjdGVkOiB1bmtub3duLFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFN0cmljdEVxdWFsczxUPihcbiAgYWN0dWFsOiBULFxuICBleHBlY3RlZDogVCxcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRTdHJpY3RFcXVhbHMoXG4gIGFjdHVhbDogdW5rbm93bixcbiAgZXhwZWN0ZWQ6IHVua25vd24sXG4gIG1zZz86IHN0cmluZyxcbik6IHZvaWQge1xuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGxldCBtZXNzYWdlOiBzdHJpbmc7XG5cbiAgaWYgKG1zZykge1xuICAgIG1lc3NhZ2UgPSBtc2c7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgYWN0dWFsU3RyaW5nID0gX2Zvcm1hdChhY3R1YWwpO1xuICAgIGNvbnN0IGV4cGVjdGVkU3RyaW5nID0gX2Zvcm1hdChleHBlY3RlZCk7XG5cbiAgICBpZiAoYWN0dWFsU3RyaW5nID09PSBleHBlY3RlZFN0cmluZykge1xuICAgICAgY29uc3Qgd2l0aE9mZnNldCA9IGFjdHVhbFN0cmluZ1xuICAgICAgICAuc3BsaXQoXCJcXG5cIilcbiAgICAgICAgLm1hcCgobCkgPT4gYCAgICAke2x9YClcbiAgICAgICAgLmpvaW4oXCJcXG5cIik7XG4gICAgICBtZXNzYWdlID1cbiAgICAgICAgYFZhbHVlcyBoYXZlIHRoZSBzYW1lIHN0cnVjdHVyZSBidXQgYXJlIG5vdCByZWZlcmVuY2UtZXF1YWw6XFxuXFxuJHtcbiAgICAgICAgICByZWQod2l0aE9mZnNldClcbiAgICAgICAgfVxcbmA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IGRpZmZSZXN1bHQgPSBkaWZmKFxuICAgICAgICAgIGFjdHVhbFN0cmluZy5zcGxpdChcIlxcblwiKSxcbiAgICAgICAgICBleHBlY3RlZFN0cmluZy5zcGxpdChcIlxcblwiKSxcbiAgICAgICAgKTtcbiAgICAgICAgY29uc3QgZGlmZk1zZyA9IGJ1aWxkTWVzc2FnZShkaWZmUmVzdWx0KS5qb2luKFwiXFxuXCIpO1xuICAgICAgICBtZXNzYWdlID0gYFZhbHVlcyBhcmUgbm90IHN0cmljdGx5IGVxdWFsOlxcbiR7ZGlmZk1zZ31gO1xuICAgICAgfSBjYXRjaCB7XG4gICAgICAgIG1lc3NhZ2UgPSBgXFxuJHtyZWQoQ0FOX05PVF9ESVNQTEFZKX0gKyBcXG5cXG5gO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtZXNzYWdlKTtcbn1cblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIGFuZCBgZXhwZWN0ZWRgIGFyZSBub3Qgc3RyaWN0bHkgZXF1YWwuXG4gKiBJZiB0aGUgdmFsdWVzIGFyZSBzdHJpY3RseSBlcXVhbCB0aGVuIHRocm93LlxuICogYGBgdHNcbiAqIGFzc2VydE5vdFN0cmljdEVxdWFscygxLCAxKVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROb3RTdHJpY3RFcXVhbHMoXG4gIGFjdHVhbDogdW5rbm93bixcbiAgZXhwZWN0ZWQ6IHVua25vd24sXG4gIG1zZz86IHN0cmluZyxcbik6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Tm90U3RyaWN0RXF1YWxzPFQ+KFxuICBhY3R1YWw6IFQsXG4gIGV4cGVjdGVkOiBULFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vdFN0cmljdEVxdWFscyhcbiAgYWN0dWFsOiB1bmtub3duLFxuICBleHBlY3RlZDogdW5rbm93bixcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZCB7XG4gIGlmIChhY3R1YWwgIT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgIG1zZyA/PyBgRXhwZWN0ZWQgXCJhY3R1YWxcIiB0byBiZSBzdHJpY3RseSB1bmVxdWFsIHRvOiAke19mb3JtYXQoYWN0dWFsKX1cXG5gLFxuICApO1xufVxuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYWN0dWFsIGlzIG5vdCBudWxsIG9yIHVuZGVmaW5lZC4gSWYgbm90XG4gKiB0aGVuIHRocm93bi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEV4aXN0cyhcbiAgYWN0dWFsOiB1bmtub3duLFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkIHtcbiAgaWYgKGFjdHVhbCA9PT0gdW5kZWZpbmVkIHx8IGFjdHVhbCA9PT0gbnVsbCkge1xuICAgIGlmICghbXNnKSB7XG4gICAgICBtc2cgPVxuICAgICAgICBgYWN0dWFsOiBcIiR7YWN0dWFsfVwiIGV4cGVjdGVkIHRvIG1hdGNoIGFueXRoaW5nIGJ1dCBudWxsIG9yIHVuZGVmaW5lZGA7XG4gICAgfVxuICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICB9XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBhY3R1YWwgaW5jbHVkZXMgZXhwZWN0ZWQuIElmIG5vdFxuICogdGhlbiB0aHJvd24uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRTdHJpbmdJbmNsdWRlcyhcbiAgYWN0dWFsOiBzdHJpbmcsXG4gIGV4cGVjdGVkOiBzdHJpbmcsXG4gIG1zZz86IHN0cmluZyxcbik6IHZvaWQge1xuICBpZiAoIWFjdHVhbC5pbmNsdWRlcyhleHBlY3RlZCkpIHtcbiAgICBpZiAoIW1zZykge1xuICAgICAgbXNnID0gYGFjdHVhbDogXCIke2FjdHVhbH1cIiBleHBlY3RlZCB0byBjb250YWluOiBcIiR7ZXhwZWN0ZWR9XCJgO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbiAgfVxufVxuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgaW5jbHVkZXMgdGhlIGBleHBlY3RlZGAgdmFsdWVzLlxuICogSWYgbm90IHRoZW4gYW4gZXJyb3Igd2lsbCBiZSB0aHJvd24uXG4gKlxuICogVHlwZSBwYXJhbWV0ZXIgY2FuIGJlIHNwZWNpZmllZCB0byBlbnN1cmUgdmFsdWVzIHVuZGVyIGNvbXBhcmlzb24gaGF2ZSB0aGUgc2FtZSB0eXBlLlxuICogRm9yIGV4YW1wbGU6XG4gKmBgYHRzXG4gKmFzc2VydEFycmF5SW5jbHVkZXM8bnVtYmVyPihbMSwgMl0sIFsyXSlcbiAqYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRBcnJheUluY2x1ZGVzKFxuICBhY3R1YWw6IEFycmF5TGlrZTx1bmtub3duPixcbiAgZXhwZWN0ZWQ6IEFycmF5TGlrZTx1bmtub3duPixcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRBcnJheUluY2x1ZGVzPFQ+KFxuICBhY3R1YWw6IEFycmF5TGlrZTxUPixcbiAgZXhwZWN0ZWQ6IEFycmF5TGlrZTxUPixcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRBcnJheUluY2x1ZGVzKFxuICBhY3R1YWw6IEFycmF5TGlrZTx1bmtub3duPixcbiAgZXhwZWN0ZWQ6IEFycmF5TGlrZTx1bmtub3duPixcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZCB7XG4gIGNvbnN0IG1pc3Npbmc6IHVua25vd25bXSA9IFtdO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IGV4cGVjdGVkLmxlbmd0aDsgaSsrKSB7XG4gICAgbGV0IGZvdW5kID0gZmFsc2U7XG4gICAgZm9yIChsZXQgaiA9IDA7IGogPCBhY3R1YWwubGVuZ3RoOyBqKyspIHtcbiAgICAgIGlmIChlcXVhbChleHBlY3RlZFtpXSwgYWN0dWFsW2pdKSkge1xuICAgICAgICBmb3VuZCA9IHRydWU7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuICAgIH1cbiAgICBpZiAoIWZvdW5kKSB7XG4gICAgICBtaXNzaW5nLnB1c2goZXhwZWN0ZWRbaV0pO1xuICAgIH1cbiAgfVxuICBpZiAobWlzc2luZy5sZW5ndGggPT09IDApIHtcbiAgICByZXR1cm47XG4gIH1cbiAgaWYgKCFtc2cpIHtcbiAgICBtc2cgPSBgYWN0dWFsOiBcIiR7X2Zvcm1hdChhY3R1YWwpfVwiIGV4cGVjdGVkIHRvIGluY2x1ZGU6IFwiJHtcbiAgICAgIF9mb3JtYXQoZXhwZWN0ZWQpXG4gICAgfVwiXFxubWlzc2luZzogJHtfZm9ybWF0KG1pc3NpbmcpfWA7XG4gIH1cbiAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBtYXRjaCBSZWdFeHAgYGV4cGVjdGVkYC4gSWYgbm90XG4gKiB0aGVuIHRocm93blxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0TWF0Y2goXG4gIGFjdHVhbDogc3RyaW5nLFxuICBleHBlY3RlZDogUmVnRXhwLFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkIHtcbiAgaWYgKCFleHBlY3RlZC50ZXN0KGFjdHVhbCkpIHtcbiAgICBpZiAoIW1zZykge1xuICAgICAgbXNnID0gYGFjdHVhbDogXCIke2FjdHVhbH1cIiBleHBlY3RlZCB0byBtYXRjaDogXCIke2V4cGVjdGVkfVwiYDtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG4gIH1cbn1cblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIG5vdCBtYXRjaCBSZWdFeHAgYGV4cGVjdGVkYC4gSWYgbWF0Y2hcbiAqIHRoZW4gdGhyb3duXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROb3RNYXRjaChcbiAgYWN0dWFsOiBzdHJpbmcsXG4gIGV4cGVjdGVkOiBSZWdFeHAsXG4gIG1zZz86IHN0cmluZyxcbik6IHZvaWQge1xuICBpZiAoZXhwZWN0ZWQudGVzdChhY3R1YWwpKSB7XG4gICAgaWYgKCFtc2cpIHtcbiAgICAgIG1zZyA9IGBhY3R1YWw6IFwiJHthY3R1YWx9XCIgZXhwZWN0ZWQgdG8gbm90IG1hdGNoOiBcIiR7ZXhwZWN0ZWR9XCJgO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbiAgfVxufVxuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgb2JqZWN0IGlzIGEgc3Vic2V0IG9mIGBleHBlY3RlZGAgb2JqZWN0LCBkZWVwbHkuXG4gKiBJZiBub3QsIHRoZW4gdGhyb3cuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRPYmplY3RNYXRjaChcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgYWN0dWFsOiBSZWNvcmQ8UHJvcGVydHlLZXksIGFueT4sXG4gIGV4cGVjdGVkOiBSZWNvcmQ8UHJvcGVydHlLZXksIHVua25vd24+LFxuKTogdm9pZCB7XG4gIHR5cGUgbG9vc2UgPSBSZWNvcmQ8UHJvcGVydHlLZXksIHVua25vd24+O1xuICBjb25zdCBzZWVuID0gbmV3IFdlYWtNYXAoKTtcbiAgcmV0dXJuIGFzc2VydEVxdWFscyhcbiAgICAoZnVuY3Rpb24gZmlsdGVyKGE6IGxvb3NlLCBiOiBsb29zZSk6IGxvb3NlIHtcbiAgICAgIC8vIFByZXZlbnQgaW5maW5pdGUgbG9vcCB3aXRoIGNpcmN1bGFyIHJlZmVyZW5jZXMgd2l0aCBzYW1lIGZpbHRlclxuICAgICAgaWYgKChzZWVuLmhhcyhhKSkgJiYgKHNlZW4uZ2V0KGEpID09PSBiKSkge1xuICAgICAgICByZXR1cm4gYTtcbiAgICAgIH1cbiAgICAgIHNlZW4uc2V0KGEsIGIpO1xuICAgICAgLy8gRmlsdGVyIGtleXMgYW5kIHN5bWJvbHMgd2hpY2ggYXJlIHByZXNlbnQgaW4gYm90aCBhY3R1YWwgYW5kIGV4cGVjdGVkXG4gICAgICBjb25zdCBmaWx0ZXJlZCA9IHt9IGFzIGxvb3NlO1xuICAgICAgY29uc3QgZW50cmllcyA9IFtcbiAgICAgICAgLi4uT2JqZWN0LmdldE93blByb3BlcnR5TmFtZXMoYSksXG4gICAgICAgIC4uLk9iamVjdC5nZXRPd25Qcm9wZXJ0eVN5bWJvbHMoYSksXG4gICAgICBdXG4gICAgICAgIC5maWx0ZXIoKGtleSkgPT4ga2V5IGluIGIpXG4gICAgICAgIC5tYXAoKGtleSkgPT4gW2tleSwgYVtrZXkgYXMgc3RyaW5nXV0pIGFzIEFycmF5PFtzdHJpbmcsIHVua25vd25dPjtcbiAgICAgIGZvciAoY29uc3QgW2tleSwgdmFsdWVdIG9mIGVudHJpZXMpIHtcbiAgICAgICAgLy8gT24gYXJyYXkgcmVmZXJlbmNlcywgYnVpbGQgYSBmaWx0ZXJlZCBhcnJheSBhbmQgZmlsdGVyIG5lc3RlZCBvYmplY3RzIGluc2lkZVxuICAgICAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZSkpIHtcbiAgICAgICAgICBjb25zdCBzdWJzZXQgPSAoYiBhcyBsb29zZSlba2V5XTtcbiAgICAgICAgICBpZiAoQXJyYXkuaXNBcnJheShzdWJzZXQpKSB7XG4gICAgICAgICAgICBmaWx0ZXJlZFtrZXldID0gdmFsdWVcbiAgICAgICAgICAgICAgLnNsaWNlKDAsIHN1YnNldC5sZW5ndGgpXG4gICAgICAgICAgICAgIC5tYXAoKGVsZW1lbnQsIGluZGV4KSA9PiB7XG4gICAgICAgICAgICAgICAgY29uc3Qgc3Vic2V0RWxlbWVudCA9IHN1YnNldFtpbmRleF07XG4gICAgICAgICAgICAgICAgaWYgKCh0eXBlb2Ygc3Vic2V0RWxlbWVudCA9PT0gXCJvYmplY3RcIikgJiYgKHN1YnNldEVsZW1lbnQpKSB7XG4gICAgICAgICAgICAgICAgICByZXR1cm4gZmlsdGVyKGVsZW1lbnQsIHN1YnNldEVsZW1lbnQpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICByZXR1cm4gZWxlbWVudDtcbiAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gLy8gT24gbmVzdGVkIG9iamVjdHMgcmVmZXJlbmNlcywgYnVpbGQgYSBmaWx0ZXJlZCBvYmplY3QgcmVjdXJzaXZlbHlcbiAgICAgICAgZWxzZSBpZiAodHlwZW9mIHZhbHVlID09PSBcIm9iamVjdFwiKSB7XG4gICAgICAgICAgY29uc3Qgc3Vic2V0ID0gKGIgYXMgbG9vc2UpW2tleV07XG4gICAgICAgICAgaWYgKCh0eXBlb2Ygc3Vic2V0ID09PSBcIm9iamVjdFwiKSAmJiAoc3Vic2V0KSkge1xuICAgICAgICAgICAgZmlsdGVyZWRba2V5XSA9IGZpbHRlcih2YWx1ZSBhcyBsb29zZSwgc3Vic2V0IGFzIGxvb3NlKTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBmaWx0ZXJlZFtrZXldID0gdmFsdWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gZmlsdGVyZWQ7XG4gICAgfSkoYWN0dWFsLCBleHBlY3RlZCksXG4gICAgZXhwZWN0ZWQsXG4gICk7XG59XG5cbi8qKlxuICogRm9yY2VmdWxseSB0aHJvd3MgYSBmYWlsZWQgYXNzZXJ0aW9uXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBmYWlsKG1zZz86IHN0cmluZyk6IHZvaWQge1xuICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVzZS1iZWZvcmUtZGVmaW5lXG4gIGFzc2VydChmYWxzZSwgYEZhaWxlZCBhc3NlcnRpb24ke21zZyA/IGA6ICR7bXNnfWAgOiBcIi5cIn1gKTtcbn1cblxuLyoqXG4gKiBFeGVjdXRlcyBhIGZ1bmN0aW9uLCBleHBlY3RpbmcgaXQgdG8gdGhyb3cuICBJZiBpdCBkb2VzIG5vdCwgdGhlbiBpdFxuICogdGhyb3dzLiAgQW4gZXJyb3IgY2xhc3MgYW5kIGEgc3RyaW5nIHRoYXQgc2hvdWxkIGJlIGluY2x1ZGVkIGluIHRoZVxuICogZXJyb3IgbWVzc2FnZSBjYW4gYWxzbyBiZSBhc3NlcnRlZC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFRocm93czxUID0gdm9pZD4oXG4gIGZuOiAoKSA9PiBULFxuICBFcnJvckNsYXNzPzogQ29uc3RydWN0b3IsXG4gIG1zZ0luY2x1ZGVzID0gXCJcIixcbiAgbXNnPzogc3RyaW5nLFxuKTogRXJyb3Ige1xuICBsZXQgZG9lc1Rocm93ID0gZmFsc2U7XG4gIGxldCBlcnJvciA9IG51bGw7XG4gIHRyeSB7XG4gICAgZm4oKTtcbiAgfSBjYXRjaCAoZSkge1xuICAgIGlmIChlIGluc3RhbmNlb2YgRXJyb3IgPT09IGZhbHNlKSB7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXCJBIG5vbi1FcnJvciBvYmplY3Qgd2FzIHRocm93bi5cIik7XG4gICAgfVxuICAgIGlmIChFcnJvckNsYXNzICYmICEoZSBpbnN0YW5jZW9mIEVycm9yQ2xhc3MpKSB7XG4gICAgICBtc2cgPVxuICAgICAgICBgRXhwZWN0ZWQgZXJyb3IgdG8gYmUgaW5zdGFuY2Ugb2YgXCIke0Vycm9yQ2xhc3MubmFtZX1cIiwgYnV0IHdhcyBcIiR7ZS5jb25zdHJ1Y3Rvci5uYW1lfVwiJHtcbiAgICAgICAgICBtc2cgPyBgOiAke21zZ31gIDogXCIuXCJcbiAgICAgICAgfWA7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgbXNnSW5jbHVkZXMgJiZcbiAgICAgICFzdHJpcENvbG9yKGUubWVzc2FnZSkuaW5jbHVkZXMoc3RyaXBDb2xvcihtc2dJbmNsdWRlcykpXG4gICAgKSB7XG4gICAgICBtc2cgPVxuICAgICAgICBgRXhwZWN0ZWQgZXJyb3IgbWVzc2FnZSB0byBpbmNsdWRlIFwiJHttc2dJbmNsdWRlc31cIiwgYnV0IGdvdCBcIiR7ZS5tZXNzYWdlfVwiJHtcbiAgICAgICAgICBtc2cgPyBgOiAke21zZ31gIDogXCIuXCJcbiAgICAgICAgfWA7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbiAgICB9XG4gICAgZG9lc1Rocm93ID0gdHJ1ZTtcbiAgICBlcnJvciA9IGU7XG4gIH1cbiAgaWYgKCFkb2VzVGhyb3cpIHtcbiAgICBtc2cgPSBgRXhwZWN0ZWQgZnVuY3Rpb24gdG8gdGhyb3cke21zZyA/IGA6ICR7bXNnfWAgOiBcIi5cIn1gO1xuICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICB9XG4gIHJldHVybiBlcnJvcjtcbn1cblxuLyoqXG4gKiBFeGVjdXRlcyBhIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgYSBwcm9taXNlLCBleHBlY3RpbmcgaXQgdG8gdGhyb3cgb3IgcmVqZWN0LlxuICogSWYgaXQgZG9lcyBub3QsIHRoZW4gaXQgdGhyb3dzLiAgQW4gZXJyb3IgY2xhc3MgYW5kIGEgc3RyaW5nIHRoYXQgc2hvdWxkIGJlXG4gKiBpbmNsdWRlZCBpbiB0aGUgZXJyb3IgbWVzc2FnZSBjYW4gYWxzbyBiZSBhc3NlcnRlZC5cbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGFzc2VydFRocm93c0FzeW5jPFQgPSB2b2lkPihcbiAgZm46ICgpID0+IFByb21pc2U8VD4sXG4gIEVycm9yQ2xhc3M/OiBDb25zdHJ1Y3RvcixcbiAgbXNnSW5jbHVkZXMgPSBcIlwiLFxuICBtc2c/OiBzdHJpbmcsXG4pOiBQcm9taXNlPEVycm9yPiB7XG4gIGxldCBkb2VzVGhyb3cgPSBmYWxzZTtcbiAgbGV0IGVycm9yID0gbnVsbDtcbiAgdHJ5IHtcbiAgICBhd2FpdCBmbigpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKGUgaW5zdGFuY2VvZiBFcnJvciA9PT0gZmFsc2UpIHtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcIkEgbm9uLUVycm9yIG9iamVjdCB3YXMgdGhyb3duIG9yIHJlamVjdGVkLlwiKTtcbiAgICB9XG4gICAgaWYgKEVycm9yQ2xhc3MgJiYgIShlIGluc3RhbmNlb2YgRXJyb3JDbGFzcykpIHtcbiAgICAgIG1zZyA9XG4gICAgICAgIGBFeHBlY3RlZCBlcnJvciB0byBiZSBpbnN0YW5jZSBvZiBcIiR7RXJyb3JDbGFzcy5uYW1lfVwiLCBidXQgZ290IFwiJHtlLm5hbWV9XCIke1xuICAgICAgICAgIG1zZyA/IGA6ICR7bXNnfWAgOiBcIi5cIlxuICAgICAgICB9YDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICAgIH1cbiAgICBpZiAoXG4gICAgICBtc2dJbmNsdWRlcyAmJlxuICAgICAgIXN0cmlwQ29sb3IoZS5tZXNzYWdlKS5pbmNsdWRlcyhzdHJpcENvbG9yKG1zZ0luY2x1ZGVzKSlcbiAgICApIHtcbiAgICAgIG1zZyA9XG4gICAgICAgIGBFeHBlY3RlZCBlcnJvciBtZXNzYWdlIHRvIGluY2x1ZGUgXCIke21zZ0luY2x1ZGVzfVwiLCBidXQgZ290IFwiJHtlLm1lc3NhZ2V9XCIke1xuICAgICAgICAgIG1zZyA/IGA6ICR7bXNnfWAgOiBcIi5cIlxuICAgICAgICB9YDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICAgIH1cbiAgICBkb2VzVGhyb3cgPSB0cnVlO1xuICAgIGVycm9yID0gZTtcbiAgfVxuICBpZiAoIWRvZXNUaHJvdykge1xuICAgIG1zZyA9IGBFeHBlY3RlZCBmdW5jdGlvbiB0byB0aHJvdyR7bXNnID8gYDogJHttc2d9YCA6IFwiLlwifWA7XG4gICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG4gIH1cbiAgcmV0dXJuIGVycm9yO1xufVxuXG4vKiogVXNlIHRoaXMgdG8gc3R1YiBvdXQgbWV0aG9kcyB0aGF0IHdpbGwgdGhyb3cgd2hlbiBpbnZva2VkLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVuaW1wbGVtZW50ZWQobXNnPzogc3RyaW5nKTogbmV2ZXIge1xuICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnIHx8IFwidW5pbXBsZW1lbnRlZFwiKTtcbn1cblxuLyoqIFVzZSB0aGlzIHRvIGFzc2VydCB1bnJlYWNoYWJsZSBjb2RlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHVucmVhY2hhYmxlKCk6IG5ldmVyIHtcbiAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFwidW5yZWFjaGFibGVcIik7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUFBMEUsQUFBMUUsd0VBQTBFO0FBQzFFLEVBQThFLEFBQTlFLDRFQUE4RTtBQUM5RSxFQUEyQyxBQUEzQyx5Q0FBMkM7QUFFM0MsTUFBTSxHQUFHLElBQUksRUFBRSxJQUFJLEVBQUUsS0FBSyxFQUFFLEdBQUcsRUFBRSxVQUFVLEVBQUUsS0FBSyxRQUFRLENBQWtCO0FBQzVFLE1BQU0sR0FBRyxJQUFJLEVBQWMsUUFBUSxRQUFRLENBQVk7QUFFdkQsS0FBSyxDQUFDLGVBQWUsR0FBRyxDQUFrQjtBQU8xQyxNQUFNLE9BQU8sY0FBYyxTQUFTLEtBQUs7Z0JBQzNCLE9BQWUsQ0FBRSxDQUFDO1FBQzVCLEtBQUssQ0FBQyxPQUFPO1FBQ2IsSUFBSSxDQUFD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