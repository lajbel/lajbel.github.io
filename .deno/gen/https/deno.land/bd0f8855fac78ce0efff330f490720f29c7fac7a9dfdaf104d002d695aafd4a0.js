// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible. Do not rely on good formatting of values
// for AssertionError messages in browsers.
import { bgGreen, bgRed, bold, gray, green, red, stripColor, white } from "../fmt/colors.ts";
import { diff, diffstr, DiffType } from "./_diff.ts";
const CAN_NOT_DISPLAY = "[Cannot display]";
export class AssertionError extends Error {
    name = "AssertionError";
    constructor(message){
        super(message);
    }
}
/**
 * Converts the input into a string. Objects, Sets and Maps are sorted so as to
 * make tests less flaky
 * @param v Value to be formatted
 */ export function _format(v) {
    // deno-lint-ignore no-explicit-any
    const { Deno  } = globalThis;
    return typeof Deno?.inspect === "function" ? Deno.inspect(v, {
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
 */ function createColor(diffType, { background =false  } = {
}) {
    switch(diffType){
        case DiffType.added:
            return (s)=>background ? bgGreen(white(s)) : green(bold(s))
            ;
        case DiffType.removed:
            return (s)=>background ? bgRed(white(s)) : red(bold(s))
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
function buildMessage(diffResult, { stringDiff =false  } = {
}) {
    const messages = [], diffMessages = [];
    messages.push("");
    messages.push("");
    messages.push(`    ${gray(bold("[Diff]"))} ${red(bold("Actual"))} / ${green(bold("Expected"))}`);
    messages.push("");
    messages.push("");
    diffResult.forEach((result)=>{
        const c = createColor(result.type);
        const line = result.details?.map((detail)=>detail.type !== DiffType.common ? createColor(detail.type, {
                background: true
            })(detail.value) : detail.value
        ).join("") ?? result.value;
        diffMessages.push(c(`${createSign(result.type)}${line}`));
    });
    messages.push(...stringDiff ? [
        diffMessages.join("")
    ] : diffMessages);
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
            if (a && b && !constructorsEqual(a, b)) {
                return false;
            }
            if (a instanceof WeakMap || b instanceof WeakMap) {
                if (!(a instanceof WeakMap && b instanceof WeakMap)) return false;
                throw new TypeError("cannot compare WeakMap instances");
            }
            if (a instanceof WeakSet || b instanceof WeakSet) {
                if (!(a instanceof WeakSet && b instanceof WeakSet)) return false;
                throw new TypeError("cannot compare WeakSet instances");
            }
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
            if (a instanceof WeakRef || b instanceof WeakRef) {
                if (!(a instanceof WeakRef && b instanceof WeakRef)) return false;
                return compare(a.deref(), b.deref());
            }
            return true;
        }
        return false;
    })(c, d);
}
// deno-lint-ignore ban-types
function constructorsEqual(a, b) {
    return a.constructor === b.constructor || a.constructor === Object && !b.constructor || !a.constructor && b.constructor === Object;
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
        const stringDiff = typeof actual === "string" && typeof expected === "string";
        const diffResult = stringDiff ? diffstr(actual, expected) : diff(actualString.split("\n"), expectedString.split("\n"));
        const diffMsg = buildMessage(diffResult, {
            stringDiff
        }).join("\n");
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
                const stringDiff = typeof actual === "string" && typeof expected === "string";
                const diffResult = stringDiff ? diffstr(actual, expected) : diff(actualString.split("\n"), expectedString.split("\n"));
                const diffMsg = buildMessage(diffResult, {
                    stringDiff
                }).join("\n");
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
 * Make an assertion that actual is not null or undefined.
 * If not then throw.
 */ export function assertExists(actual, msg) {
    if (actual === undefined || actual === null) {
        if (!msg) {
            msg = `actual: "${actual}" expected to not be null or undefined`;
        }
        throw new AssertionError(msg);
    }
}
/**
 * Make an assertion that actual includes expected. If not
 * then throw.
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
 * then throw.
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
 * then throw.
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
    assert(false, `Failed assertion${msg ? `: ${msg}` : "."}`);
}
export function assertThrows(fn, errorClassOrCallback, msgIncludesOrMsg, msg) {
    let ErrorClass;
    let msgIncludes;
    let errorCallback;
    if (errorClassOrCallback == null || errorClassOrCallback.prototype instanceof Error || errorClassOrCallback.prototype === Error.prototype) {
        ErrorClass = errorClassOrCallback;
        msgIncludes = msgIncludesOrMsg;
        errorCallback = null;
    } else {
        ErrorClass = null;
        msgIncludes = null;
        errorCallback = errorClassOrCallback;
        msg = msgIncludesOrMsg;
    }
    let doesThrow = false;
    let error = null;
    try {
        fn();
    } catch (e) {
        if (e instanceof Error === false) {
            throw new AssertionError("A non-Error object was thrown.");
        }
        if (ErrorClass && !(e instanceof ErrorClass)) {
            msg = `Expected error to be instance of "${ErrorClass.name}", but was "${typeof e === "object" ? e?.constructor?.name : "[not an object]"}"${msg ? `: ${msg}` : "."}`;
            throw new AssertionError(msg);
        }
        if (msgIncludes && (!(e instanceof Error) || !stripColor(e.message).includes(stripColor(msgIncludes)))) {
            msg = `Expected error message to include "${msgIncludes}", but got "${e instanceof Error ? e.message : "[not an Error]"}"${msg ? `: ${msg}` : "."}`;
            throw new AssertionError(msg);
        }
        doesThrow = true;
        error = e;
    }
    if (!doesThrow) {
        msg = `Expected function to throw${msg ? `: ${msg}` : "."}`;
        throw new AssertionError(msg);
    }
    if (typeof errorCallback == "function") {
        errorCallback(error);
    }
}
export async function assertRejects(fn, errorClassOrCallback, msgIncludesOrMsg, msg) {
    let ErrorClass;
    let msgIncludes;
    let errorCallback;
    if (errorClassOrCallback == null || errorClassOrCallback.prototype instanceof Error || errorClassOrCallback.prototype === Error.prototype) {
        ErrorClass = errorClassOrCallback;
        msgIncludes = msgIncludesOrMsg;
        errorCallback = null;
    } else {
        ErrorClass = null;
        msgIncludes = null;
        errorCallback = errorClassOrCallback;
        msg = msgIncludesOrMsg;
    }
    let doesThrow = false;
    let error = null;
    try {
        await fn();
    } catch (e) {
        if (e instanceof Error === false) {
            throw new AssertionError("A non-Error object was thrown or rejected.");
        }
        if (ErrorClass && !(e instanceof ErrorClass)) {
            msg = `Expected error to be instance of "${ErrorClass.name}", but was "${typeof e === "object" ? e?.constructor?.name : "[not an object]"}"${msg ? `: ${msg}` : "."}`;
            throw new AssertionError(msg);
        }
        if (msgIncludes && (!(e instanceof Error) || !stripColor(e.message).includes(stripColor(msgIncludes)))) {
            msg = `Expected error message to include "${msgIncludes}", but got "${e instanceof Error ? e.message : "[not an Error]"}"${msg ? `: ${msg}` : "."}`;
            throw new AssertionError(msg);
        }
        doesThrow = true;
        error = e;
    }
    if (!doesThrow) {
        msg = `Expected function to throw${msg ? `: ${msg}` : "."}`;
        throw new AssertionError(msg);
    }
    if (typeof errorCallback == "function") {
        errorCallback(error);
    }
}
/**
 * Executes a function which returns a promise, expecting it to throw or reject.
 * If it does not, then it throws.  An error class and a string that should be
 * included in the error message can also be asserted.
 *
 * @deprecated
 */ export { assertRejects as assertThrowsAsync };
/** Use this to stub out methods that will throw when invoked. */ export function unimplemented(msg) {
    throw new AssertionError(msg || "unimplemented");
}
/** Use this to assert unreachable code. */ export function unreachable() {
    throw new AssertionError("unreachable");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEwOS4wL3Rlc3RpbmcvYXNzZXJ0cy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLiBEbyBub3QgcmVseSBvbiBnb29kIGZvcm1hdHRpbmcgb2YgdmFsdWVzXG4vLyBmb3IgQXNzZXJ0aW9uRXJyb3IgbWVzc2FnZXMgaW4gYnJvd3NlcnMuXG5cbmltcG9ydCB7XG4gIGJnR3JlZW4sXG4gIGJnUmVkLFxuICBib2xkLFxuICBncmF5LFxuICBncmVlbixcbiAgcmVkLFxuICBzdHJpcENvbG9yLFxuICB3aGl0ZSxcbn0gZnJvbSBcIi4uL2ZtdC9jb2xvcnMudHNcIjtcbmltcG9ydCB7IGRpZmYsIERpZmZSZXN1bHQsIGRpZmZzdHIsIERpZmZUeXBlIH0gZnJvbSBcIi4vX2RpZmYudHNcIjtcblxuY29uc3QgQ0FOX05PVF9ESVNQTEFZID0gXCJbQ2Fubm90IGRpc3BsYXldXCI7XG5cbmV4cG9ydCBpbnRlcmZhY2UgQ29uc3RydWN0b3Ige1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBuZXcgKC4uLmFyZ3M6IGFueVtdKTogYW55O1xufVxuXG5leHBvcnQgY2xhc3MgQXNzZXJ0aW9uRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIG5hbWUgPSBcIkFzc2VydGlvbkVycm9yXCI7XG4gIGNvbnN0cnVjdG9yKG1lc3NhZ2U6IHN0cmluZykge1xuICAgIHN1cGVyKG1lc3NhZ2UpO1xuICB9XG59XG5cbi8qKlxuICogQ29udmVydHMgdGhlIGlucHV0IGludG8gYSBzdHJpbmcuIE9iamVjdHMsIFNldHMgYW5kIE1hcHMgYXJlIHNvcnRlZCBzbyBhcyB0b1xuICogbWFrZSB0ZXN0cyBsZXNzIGZsYWt5XG4gKiBAcGFyYW0gdiBWYWx1ZSB0byBiZSBmb3JtYXR0ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIF9mb3JtYXQodjogdW5rbm93bik6IHN0cmluZyB7XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gIGNvbnN0IHsgRGVubyB9ID0gZ2xvYmFsVGhpcyBhcyBhbnk7XG4gIHJldHVybiB0eXBlb2YgRGVubz8uaW5zcGVjdCA9PT0gXCJmdW5jdGlvblwiXG4gICAgPyBEZW5vLmluc3BlY3Qodiwge1xuICAgICAgZGVwdGg6IEluZmluaXR5LFxuICAgICAgc29ydGVkOiB0cnVlLFxuICAgICAgdHJhaWxpbmdDb21tYTogdHJ1ZSxcbiAgICAgIGNvbXBhY3Q6IGZhbHNlLFxuICAgICAgaXRlcmFibGVMaW1pdDogSW5maW5pdHksXG4gICAgfSlcbiAgICA6IGBcIiR7U3RyaW5nKHYpLnJlcGxhY2UoLyg/PVtcIlxcXFxdKS9nLCBcIlxcXFxcIil9XCJgO1xufVxuXG4vKipcbiAqIENvbG9ycyB0aGUgb3V0cHV0IG9mIGFzc2VydGlvbiBkaWZmc1xuICogQHBhcmFtIGRpZmZUeXBlIERpZmZlcmVuY2UgdHlwZSwgZWl0aGVyIGFkZGVkIG9yIHJlbW92ZWRcbiAqL1xuZnVuY3Rpb24gY3JlYXRlQ29sb3IoXG4gIGRpZmZUeXBlOiBEaWZmVHlwZSxcbiAgeyBiYWNrZ3JvdW5kID0gZmFsc2UgfSA9IHt9LFxuKTogKHM6IHN0cmluZykgPT4gc3RyaW5nIHtcbiAgc3dpdGNoIChkaWZmVHlwZSkge1xuICAgIGNhc2UgRGlmZlR5cGUuYWRkZWQ6XG4gICAgICByZXR1cm4gKHM6IHN0cmluZyk6IHN0cmluZyA9PlxuICAgICAgICBiYWNrZ3JvdW5kID8gYmdHcmVlbih3aGl0ZShzKSkgOiBncmVlbihib2xkKHMpKTtcbiAgICBjYXNlIERpZmZUeXBlLnJlbW92ZWQ6XG4gICAgICByZXR1cm4gKHM6IHN0cmluZyk6IHN0cmluZyA9PiBiYWNrZ3JvdW5kID8gYmdSZWQod2hpdGUocykpIDogcmVkKGJvbGQocykpO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gd2hpdGU7XG4gIH1cbn1cblxuLyoqXG4gKiBQcmVmaXhlcyBgK2Agb3IgYC1gIGluIGRpZmYgb3V0cHV0XG4gKiBAcGFyYW0gZGlmZlR5cGUgRGlmZmVyZW5jZSB0eXBlLCBlaXRoZXIgYWRkZWQgb3IgcmVtb3ZlZFxuICovXG5mdW5jdGlvbiBjcmVhdGVTaWduKGRpZmZUeXBlOiBEaWZmVHlwZSk6IHN0cmluZyB7XG4gIHN3aXRjaCAoZGlmZlR5cGUpIHtcbiAgICBjYXNlIERpZmZUeXBlLmFkZGVkOlxuICAgICAgcmV0dXJuIFwiKyAgIFwiO1xuICAgIGNhc2UgRGlmZlR5cGUucmVtb3ZlZDpcbiAgICAgIHJldHVybiBcIi0gICBcIjtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIFwiICAgIFwiO1xuICB9XG59XG5cbmZ1bmN0aW9uIGJ1aWxkTWVzc2FnZShcbiAgZGlmZlJlc3VsdDogUmVhZG9ubHlBcnJheTxEaWZmUmVzdWx0PHN0cmluZz4+LFxuICB7IHN0cmluZ0RpZmYgPSBmYWxzZSB9ID0ge30sXG4pOiBzdHJpbmdbXSB7XG4gIGNvbnN0IG1lc3NhZ2VzOiBzdHJpbmdbXSA9IFtdLCBkaWZmTWVzc2FnZXM6IHN0cmluZ1tdID0gW107XG4gIG1lc3NhZ2VzLnB1c2goXCJcIik7XG4gIG1lc3NhZ2VzLnB1c2goXCJcIik7XG4gIG1lc3NhZ2VzLnB1c2goXG4gICAgYCAgICAke2dyYXkoYm9sZChcIltEaWZmXVwiKSl9ICR7cmVkKGJvbGQoXCJBY3R1YWxcIikpfSAvICR7XG4gICAgICBncmVlbihib2xkKFwiRXhwZWN0ZWRcIikpXG4gICAgfWAsXG4gICk7XG4gIG1lc3NhZ2VzLnB1c2goXCJcIik7XG4gIG1lc3NhZ2VzLnB1c2goXCJcIik7XG4gIGRpZmZSZXN1bHQuZm9yRWFjaCgocmVzdWx0OiBEaWZmUmVzdWx0PHN0cmluZz4pOiB2b2lkID0+IHtcbiAgICBjb25zdCBjID0gY3JlYXRlQ29sb3IocmVzdWx0LnR5cGUpO1xuICAgIGNvbnN0IGxpbmUgPSByZXN1bHQuZGV0YWlscz8ubWFwKChkZXRhaWwpID0+XG4gICAgICBkZXRhaWwudHlwZSAhPT0gRGlmZlR5cGUuY29tbW9uXG4gICAgICAgID8gY3JlYXRlQ29sb3IoZGV0YWlsLnR5cGUsIHsgYmFja2dyb3VuZDogdHJ1ZSB9KShkZXRhaWwudmFsdWUpXG4gICAgICAgIDogZGV0YWlsLnZhbHVlXG4gICAgKS5qb2luKFwiXCIpID8/IHJlc3VsdC52YWx1ZTtcbiAgICBkaWZmTWVzc2FnZXMucHVzaChjKGAke2NyZWF0ZVNpZ24ocmVzdWx0LnR5cGUpfSR7bGluZX1gKSk7XG4gIH0pO1xuICBtZXNzYWdlcy5wdXNoKC4uLihzdHJpbmdEaWZmID8gW2RpZmZNZXNzYWdlcy5qb2luKFwiXCIpXSA6IGRpZmZNZXNzYWdlcykpO1xuICBtZXNzYWdlcy5wdXNoKFwiXCIpO1xuXG4gIHJldHVybiBtZXNzYWdlcztcbn1cblxuZnVuY3Rpb24gaXNLZXllZENvbGxlY3Rpb24oeDogdW5rbm93bik6IHggaXMgU2V0PHVua25vd24+IHtcbiAgcmV0dXJuIFtTeW1ib2wuaXRlcmF0b3IsIFwic2l6ZVwiXS5ldmVyeSgoaykgPT4gayBpbiAoeCBhcyBTZXQ8dW5rbm93bj4pKTtcbn1cblxuLyoqXG4gKiBEZWVwIGVxdWFsaXR5IGNvbXBhcmlzb24gdXNlZCBpbiBhc3NlcnRpb25zXG4gKiBAcGFyYW0gYyBhY3R1YWwgdmFsdWVcbiAqIEBwYXJhbSBkIGV4cGVjdGVkIHZhbHVlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBlcXVhbChjOiB1bmtub3duLCBkOiB1bmtub3duKTogYm9vbGVhbiB7XG4gIGNvbnN0IHNlZW4gPSBuZXcgTWFwKCk7XG4gIHJldHVybiAoZnVuY3Rpb24gY29tcGFyZShhOiB1bmtub3duLCBiOiB1bmtub3duKTogYm9vbGVhbiB7XG4gICAgLy8gSGF2ZSB0byByZW5kZXIgUmVnRXhwICYgRGF0ZSBmb3Igc3RyaW5nIGNvbXBhcmlzb25cbiAgICAvLyB1bmxlc3MgaXQncyBtaXN0cmVhdGVkIGFzIG9iamVjdFxuICAgIGlmIChcbiAgICAgIGEgJiZcbiAgICAgIGIgJiZcbiAgICAgICgoYSBpbnN0YW5jZW9mIFJlZ0V4cCAmJiBiIGluc3RhbmNlb2YgUmVnRXhwKSB8fFxuICAgICAgICAoYSBpbnN0YW5jZW9mIFVSTCAmJiBiIGluc3RhbmNlb2YgVVJMKSlcbiAgICApIHtcbiAgICAgIHJldHVybiBTdHJpbmcoYSkgPT09IFN0cmluZyhiKTtcbiAgICB9XG4gICAgaWYgKGEgaW5zdGFuY2VvZiBEYXRlICYmIGIgaW5zdGFuY2VvZiBEYXRlKSB7XG4gICAgICBjb25zdCBhVGltZSA9IGEuZ2V0VGltZSgpO1xuICAgICAgY29uc3QgYlRpbWUgPSBiLmdldFRpbWUoKTtcbiAgICAgIC8vIENoZWNrIGZvciBOYU4gZXF1YWxpdHkgbWFudWFsbHkgc2luY2UgTmFOIGlzIG5vdFxuICAgICAgLy8gZXF1YWwgdG8gaXRzZWxmLlxuICAgICAgaWYgKE51bWJlci5pc05hTihhVGltZSkgJiYgTnVtYmVyLmlzTmFOKGJUaW1lKSkge1xuICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBhLmdldFRpbWUoKSA9PT0gYi5nZXRUaW1lKCk7XG4gICAgfVxuICAgIGlmIChPYmplY3QuaXMoYSwgYikpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoYSAmJiB0eXBlb2YgYSA9PT0gXCJvYmplY3RcIiAmJiBiICYmIHR5cGVvZiBiID09PSBcIm9iamVjdFwiKSB7XG4gICAgICBpZiAoYSAmJiBiICYmICFjb25zdHJ1Y3RvcnNFcXVhbChhLCBiKSkge1xuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICB9XG4gICAgICBpZiAoYSBpbnN0YW5jZW9mIFdlYWtNYXAgfHwgYiBpbnN0YW5jZW9mIFdlYWtNYXApIHtcbiAgICAgICAgaWYgKCEoYSBpbnN0YW5jZW9mIFdlYWtNYXAgJiYgYiBpbnN0YW5jZW9mIFdlYWtNYXApKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJjYW5ub3QgY29tcGFyZSBXZWFrTWFwIGluc3RhbmNlc1wiKTtcbiAgICAgIH1cbiAgICAgIGlmIChhIGluc3RhbmNlb2YgV2Vha1NldCB8fCBiIGluc3RhbmNlb2YgV2Vha1NldCkge1xuICAgICAgICBpZiAoIShhIGluc3RhbmNlb2YgV2Vha1NldCAmJiBiIGluc3RhbmNlb2YgV2Vha1NldCkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcImNhbm5vdCBjb21wYXJlIFdlYWtTZXQgaW5zdGFuY2VzXCIpO1xuICAgICAgfVxuICAgICAgaWYgKHNlZW4uZ2V0KGEpID09PSBiKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKE9iamVjdC5rZXlzKGEgfHwge30pLmxlbmd0aCAhPT0gT2JqZWN0LmtleXMoYiB8fCB7fSkubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmIChpc0tleWVkQ29sbGVjdGlvbihhKSAmJiBpc0tleWVkQ29sbGVjdGlvbihiKSkge1xuICAgICAgICBpZiAoYS5zaXplICE9PSBiLnNpemUpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdW5tYXRjaGVkRW50cmllcyA9IGEuc2l6ZTtcblxuICAgICAgICBmb3IgKGNvbnN0IFthS2V5LCBhVmFsdWVdIG9mIGEuZW50cmllcygpKSB7XG4gICAgICAgICAgZm9yIChjb25zdCBbYktleSwgYlZhbHVlXSBvZiBiLmVudHJpZXMoKSkge1xuICAgICAgICAgICAgLyogR2l2ZW4gdGhhdCBNYXAga2V5cyBjYW4gYmUgcmVmZXJlbmNlcywgd2UgbmVlZFxuICAgICAgICAgICAgICogdG8gZW5zdXJlIHRoYXQgdGhleSBhcmUgYWxzbyBkZWVwbHkgZXF1YWwgKi9cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgKGFLZXkgPT09IGFWYWx1ZSAmJiBiS2V5ID09PSBiVmFsdWUgJiYgY29tcGFyZShhS2V5LCBiS2V5KSkgfHxcbiAgICAgICAgICAgICAgKGNvbXBhcmUoYUtleSwgYktleSkgJiYgY29tcGFyZShhVmFsdWUsIGJWYWx1ZSkpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgdW5tYXRjaGVkRW50cmllcy0tO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1bm1hdGNoZWRFbnRyaWVzID09PSAwO1xuICAgICAgfVxuICAgICAgY29uc3QgbWVyZ2VkID0geyAuLi5hLCAuLi5iIH07XG4gICAgICBmb3IgKFxuICAgICAgICBjb25zdCBrZXkgb2YgW1xuICAgICAgICAgIC4uLk9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG1lcmdlZCksXG4gICAgICAgICAgLi4uT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhtZXJnZWQpLFxuICAgICAgICBdXG4gICAgICApIHtcbiAgICAgICAgdHlwZSBLZXkgPSBrZXlvZiB0eXBlb2YgbWVyZ2VkO1xuICAgICAgICBpZiAoIWNvbXBhcmUoYSAmJiBhW2tleSBhcyBLZXldLCBiICYmIGJba2V5IGFzIEtleV0pKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICgoKGtleSBpbiBhKSAmJiAoIShrZXkgaW4gYikpKSB8fCAoKGtleSBpbiBiKSAmJiAoIShrZXkgaW4gYSkpKSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc2Vlbi5zZXQoYSwgYik7XG4gICAgICBpZiAoYSBpbnN0YW5jZW9mIFdlYWtSZWYgfHwgYiBpbnN0YW5jZW9mIFdlYWtSZWYpIHtcbiAgICAgICAgaWYgKCEoYSBpbnN0YW5jZW9mIFdlYWtSZWYgJiYgYiBpbnN0YW5jZW9mIFdlYWtSZWYpKSByZXR1cm4gZmFsc2U7XG4gICAgICAgIHJldHVybiBjb21wYXJlKGEuZGVyZWYoKSwgYi5kZXJlZigpKTtcbiAgICAgIH1cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICByZXR1cm4gZmFsc2U7XG4gIH0pKGMsIGQpO1xufVxuXG4vLyBkZW5vLWxpbnQtaWdub3JlIGJhbi10eXBlc1xuZnVuY3Rpb24gY29uc3RydWN0b3JzRXF1YWwoYTogb2JqZWN0LCBiOiBvYmplY3QpIHtcbiAgcmV0dXJuIGEuY29uc3RydWN0b3IgPT09IGIuY29uc3RydWN0b3IgfHxcbiAgICBhLmNvbnN0cnVjdG9yID09PSBPYmplY3QgJiYgIWIuY29uc3RydWN0b3IgfHxcbiAgICAhYS5jb25zdHJ1Y3RvciAmJiBiLmNvbnN0cnVjdG9yID09PSBPYmplY3Q7XG59XG5cbi8qKiBNYWtlIGFuIGFzc2VydGlvbiwgZXJyb3Igd2lsbCBiZSB0aHJvd24gaWYgYGV4cHJgIGRvZXMgbm90IGhhdmUgdHJ1dGh5IHZhbHVlLiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydChleHByOiB1bmtub3duLCBtc2cgPSBcIlwiKTogYXNzZXJ0cyBleHByIHtcbiAgaWYgKCFleHByKSB7XG4gICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG4gIH1cbn1cblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIGFuZCBgZXhwZWN0ZWRgIGFyZSBlcXVhbCwgZGVlcGx5LiBJZiBub3RcbiAqIGRlZXBseSBlcXVhbCwgdGhlbiB0aHJvdy5cbiAqXG4gKiBUeXBlIHBhcmFtZXRlciBjYW4gYmUgc3BlY2lmaWVkIHRvIGVuc3VyZSB2YWx1ZXMgdW5kZXIgY29tcGFyaXNvbiBoYXZlIHRoZSBzYW1lIHR5cGUuXG4gKiBGb3IgZXhhbXBsZTpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBhc3NlcnRFcXVhbHMgfSBmcm9tIFwiLi9hc3NlcnRzLnRzXCI7XG4gKlxuICogYXNzZXJ0RXF1YWxzPG51bWJlcj4oMSwgMilcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0RXF1YWxzKFxuICBhY3R1YWw6IHVua25vd24sXG4gIGV4cGVjdGVkOiB1bmtub3duLFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEVxdWFsczxUPihhY3R1YWw6IFQsIGV4cGVjdGVkOiBULCBtc2c/OiBzdHJpbmcpOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEVxdWFscyhcbiAgYWN0dWFsOiB1bmtub3duLFxuICBleHBlY3RlZDogdW5rbm93bixcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZCB7XG4gIGlmIChlcXVhbChhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBsZXQgbWVzc2FnZSA9IFwiXCI7XG4gIGNvbnN0IGFjdHVhbFN0cmluZyA9IF9mb3JtYXQoYWN0dWFsKTtcbiAgY29uc3QgZXhwZWN0ZWRTdHJpbmcgPSBfZm9ybWF0KGV4cGVjdGVkKTtcbiAgdHJ5IHtcbiAgICBjb25zdCBzdHJpbmdEaWZmID0gKHR5cGVvZiBhY3R1YWwgPT09IFwic3RyaW5nXCIpICYmXG4gICAgICAodHlwZW9mIGV4cGVjdGVkID09PSBcInN0cmluZ1wiKTtcbiAgICBjb25zdCBkaWZmUmVzdWx0ID0gc3RyaW5nRGlmZlxuICAgICAgPyBkaWZmc3RyKGFjdHVhbCBhcyBzdHJpbmcsIGV4cGVjdGVkIGFzIHN0cmluZylcbiAgICAgIDogZGlmZihhY3R1YWxTdHJpbmcuc3BsaXQoXCJcXG5cIiksIGV4cGVjdGVkU3RyaW5nLnNwbGl0KFwiXFxuXCIpKTtcbiAgICBjb25zdCBkaWZmTXNnID0gYnVpbGRNZXNzYWdlKGRpZmZSZXN1bHQsIHsgc3RyaW5nRGlmZiB9KS5qb2luKFwiXFxuXCIpO1xuICAgIG1lc3NhZ2UgPSBgVmFsdWVzIGFyZSBub3QgZXF1YWw6XFxuJHtkaWZmTXNnfWA7XG4gIH0gY2F0Y2gge1xuICAgIG1lc3NhZ2UgPSBgXFxuJHtyZWQoQ0FOX05PVF9ESVNQTEFZKX0gKyBcXG5cXG5gO1xuICB9XG4gIGlmIChtc2cpIHtcbiAgICBtZXNzYWdlID0gbXNnO1xuICB9XG4gIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtZXNzYWdlKTtcbn1cblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIGFuZCBgZXhwZWN0ZWRgIGFyZSBub3QgZXF1YWwsIGRlZXBseS5cbiAqIElmIG5vdCB0aGVuIHRocm93LlxuICpcbiAqIFR5cGUgcGFyYW1ldGVyIGNhbiBiZSBzcGVjaWZpZWQgdG8gZW5zdXJlIHZhbHVlcyB1bmRlciBjb21wYXJpc29uIGhhdmUgdGhlIHNhbWUgdHlwZS5cbiAqIEZvciBleGFtcGxlOlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGFzc2VydE5vdEVxdWFscyB9IGZyb20gXCIuL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBhc3NlcnROb3RFcXVhbHM8bnVtYmVyPigxLCAyKVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROb3RFcXVhbHMoXG4gIGFjdHVhbDogdW5rbm93bixcbiAgZXhwZWN0ZWQ6IHVua25vd24sXG4gIG1zZz86IHN0cmluZyxcbik6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Tm90RXF1YWxzPFQ+KGFjdHVhbDogVCwgZXhwZWN0ZWQ6IFQsIG1zZz86IHN0cmluZyk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Tm90RXF1YWxzKFxuICBhY3R1YWw6IHVua25vd24sXG4gIGV4cGVjdGVkOiB1bmtub3duLFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkIHtcbiAgaWYgKCFlcXVhbChhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBsZXQgYWN0dWFsU3RyaW5nOiBzdHJpbmc7XG4gIGxldCBleHBlY3RlZFN0cmluZzogc3RyaW5nO1xuICB0cnkge1xuICAgIGFjdHVhbFN0cmluZyA9IFN0cmluZyhhY3R1YWwpO1xuICB9IGNhdGNoIHtcbiAgICBhY3R1YWxTdHJpbmcgPSBcIltDYW5ub3QgZGlzcGxheV1cIjtcbiAgfVxuICB0cnkge1xuICAgIGV4cGVjdGVkU3RyaW5nID0gU3RyaW5nKGV4cGVjdGVkKTtcbiAgfSBjYXRjaCB7XG4gICAgZXhwZWN0ZWRTdHJpbmcgPSBcIltDYW5ub3QgZGlzcGxheV1cIjtcbiAgfVxuICBpZiAoIW1zZykge1xuICAgIG1zZyA9IGBhY3R1YWw6ICR7YWN0dWFsU3RyaW5nfSBleHBlY3RlZDogJHtleHBlY3RlZFN0cmluZ31gO1xuICB9XG4gIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xufVxuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgYW5kIGBleHBlY3RlZGAgYXJlIHN0cmljdGx5IGVxdWFsLiBJZlxuICogbm90IHRoZW4gdGhyb3cuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGFzc2VydFN0cmljdEVxdWFscyB9IGZyb20gXCIuL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBhc3NlcnRTdHJpY3RFcXVhbHMoMSwgMilcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0U3RyaWN0RXF1YWxzKFxuICBhY3R1YWw6IHVua25vd24sXG4gIGV4cGVjdGVkOiB1bmtub3duLFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFN0cmljdEVxdWFsczxUPihcbiAgYWN0dWFsOiBULFxuICBleHBlY3RlZDogVCxcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRTdHJpY3RFcXVhbHMoXG4gIGFjdHVhbDogdW5rbm93bixcbiAgZXhwZWN0ZWQ6IHVua25vd24sXG4gIG1zZz86IHN0cmluZyxcbik6IHZvaWQge1xuICBpZiAoYWN0dWFsID09PSBleHBlY3RlZCkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIGxldCBtZXNzYWdlOiBzdHJpbmc7XG5cbiAgaWYgKG1zZykge1xuICAgIG1lc3NhZ2UgPSBtc2c7XG4gIH0gZWxzZSB7XG4gICAgY29uc3QgYWN0dWFsU3RyaW5nID0gX2Zvcm1hdChhY3R1YWwpO1xuICAgIGNvbnN0IGV4cGVjdGVkU3RyaW5nID0gX2Zvcm1hdChleHBlY3RlZCk7XG5cbiAgICBpZiAoYWN0dWFsU3RyaW5nID09PSBleHBlY3RlZFN0cmluZykge1xuICAgICAgY29uc3Qgd2l0aE9mZnNldCA9IGFjdHVhbFN0cmluZ1xuICAgICAgICAuc3BsaXQoXCJcXG5cIilcbiAgICAgICAgLm1hcCgobCkgPT4gYCAgICAke2x9YClcbiAgICAgICAgLmpvaW4oXCJcXG5cIik7XG4gICAgICBtZXNzYWdlID1cbiAgICAgICAgYFZhbHVlcyBoYXZlIHRoZSBzYW1lIHN0cnVjdHVyZSBidXQgYXJlIG5vdCByZWZlcmVuY2UtZXF1YWw6XFxuXFxuJHtcbiAgICAgICAgICByZWQod2l0aE9mZnNldClcbiAgICAgICAgfVxcbmA7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGNvbnN0IHN0cmluZ0RpZmYgPSAodHlwZW9mIGFjdHVhbCA9PT0gXCJzdHJpbmdcIikgJiZcbiAgICAgICAgICAodHlwZW9mIGV4cGVjdGVkID09PSBcInN0cmluZ1wiKTtcbiAgICAgICAgY29uc3QgZGlmZlJlc3VsdCA9IHN0cmluZ0RpZmZcbiAgICAgICAgICA/IGRpZmZzdHIoYWN0dWFsIGFzIHN0cmluZywgZXhwZWN0ZWQgYXMgc3RyaW5nKVxuICAgICAgICAgIDogZGlmZihhY3R1YWxTdHJpbmcuc3BsaXQoXCJcXG5cIiksIGV4cGVjdGVkU3RyaW5nLnNwbGl0KFwiXFxuXCIpKTtcbiAgICAgICAgY29uc3QgZGlmZk1zZyA9IGJ1aWxkTWVzc2FnZShkaWZmUmVzdWx0LCB7IHN0cmluZ0RpZmYgfSkuam9pbihcIlxcblwiKTtcbiAgICAgICAgbWVzc2FnZSA9IGBWYWx1ZXMgYXJlIG5vdCBzdHJpY3RseSBlcXVhbDpcXG4ke2RpZmZNc2d9YDtcbiAgICAgIH0gY2F0Y2gge1xuICAgICAgICBtZXNzYWdlID0gYFxcbiR7cmVkKENBTl9OT1RfRElTUExBWSl9ICsgXFxuXFxuYDtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobWVzc2FnZSk7XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBhbmQgYGV4cGVjdGVkYCBhcmUgbm90IHN0cmljdGx5IGVxdWFsLlxuICogSWYgdGhlIHZhbHVlcyBhcmUgc3RyaWN0bHkgZXF1YWwgdGhlbiB0aHJvdy5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgYXNzZXJ0Tm90U3RyaWN0RXF1YWxzIH0gZnJvbSBcIi4vYXNzZXJ0cy50c1wiO1xuICpcbiAqIGFzc2VydE5vdFN0cmljdEVxdWFscygxLCAxKVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROb3RTdHJpY3RFcXVhbHMoXG4gIGFjdHVhbDogdW5rbm93bixcbiAgZXhwZWN0ZWQ6IHVua25vd24sXG4gIG1zZz86IHN0cmluZyxcbik6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Tm90U3RyaWN0RXF1YWxzPFQ+KFxuICBhY3R1YWw6IFQsXG4gIGV4cGVjdGVkOiBULFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vdFN0cmljdEVxdWFscyhcbiAgYWN0dWFsOiB1bmtub3duLFxuICBleHBlY3RlZDogdW5rbm93bixcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZCB7XG4gIGlmIChhY3R1YWwgIT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFxuICAgIG1zZyA/PyBgRXhwZWN0ZWQgXCJhY3R1YWxcIiB0byBiZSBzdHJpY3RseSB1bmVxdWFsIHRvOiAke19mb3JtYXQoYWN0dWFsKX1cXG5gLFxuICApO1xufVxuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYWN0dWFsIGlzIG5vdCBudWxsIG9yIHVuZGVmaW5lZC5cbiAqIElmIG5vdCB0aGVuIHRocm93LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0RXhpc3RzPFQ+KFxuICBhY3R1YWw6IFQsXG4gIG1zZz86IHN0cmluZyxcbik6IGFzc2VydHMgYWN0dWFsIGlzIE5vbk51bGxhYmxlPFQ+IHtcbiAgaWYgKGFjdHVhbCA9PT0gdW5kZWZpbmVkIHx8IGFjdHVhbCA9PT0gbnVsbCkge1xuICAgIGlmICghbXNnKSB7XG4gICAgICBtc2cgPSBgYWN0dWFsOiBcIiR7YWN0dWFsfVwiIGV4cGVjdGVkIHRvIG5vdCBiZSBudWxsIG9yIHVuZGVmaW5lZGA7XG4gICAgfVxuICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICB9XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBhY3R1YWwgaW5jbHVkZXMgZXhwZWN0ZWQuIElmIG5vdFxuICogdGhlbiB0aHJvdy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFN0cmluZ0luY2x1ZGVzKFxuICBhY3R1YWw6IHN0cmluZyxcbiAgZXhwZWN0ZWQ6IHN0cmluZyxcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZCB7XG4gIGlmICghYWN0dWFsLmluY2x1ZGVzKGV4cGVjdGVkKSkge1xuICAgIGlmICghbXNnKSB7XG4gICAgICBtc2cgPSBgYWN0dWFsOiBcIiR7YWN0dWFsfVwiIGV4cGVjdGVkIHRvIGNvbnRhaW46IFwiJHtleHBlY3RlZH1cImA7XG4gICAgfVxuICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICB9XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBpbmNsdWRlcyB0aGUgYGV4cGVjdGVkYCB2YWx1ZXMuXG4gKiBJZiBub3QgdGhlbiBhbiBlcnJvciB3aWxsIGJlIHRocm93bi5cbiAqXG4gKiBUeXBlIHBhcmFtZXRlciBjYW4gYmUgc3BlY2lmaWVkIHRvIGVuc3VyZSB2YWx1ZXMgdW5kZXIgY29tcGFyaXNvbiBoYXZlIHRoZSBzYW1lIHR5cGUuXG4gKiBGb3IgZXhhbXBsZTpcbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgYXNzZXJ0QXJyYXlJbmNsdWRlcyB9IGZyb20gXCIuL2Fzc2VydHMudHNcIjtcbiAqXG4gKiBhc3NlcnRBcnJheUluY2x1ZGVzPG51bWJlcj4oWzEsIDJdLCBbMl0pXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEFycmF5SW5jbHVkZXMoXG4gIGFjdHVhbDogQXJyYXlMaWtlPHVua25vd24+LFxuICBleHBlY3RlZDogQXJyYXlMaWtlPHVua25vd24+LFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEFycmF5SW5jbHVkZXM8VD4oXG4gIGFjdHVhbDogQXJyYXlMaWtlPFQ+LFxuICBleHBlY3RlZDogQXJyYXlMaWtlPFQ+LFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEFycmF5SW5jbHVkZXMoXG4gIGFjdHVhbDogQXJyYXlMaWtlPHVua25vd24+LFxuICBleHBlY3RlZDogQXJyYXlMaWtlPHVua25vd24+LFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkIHtcbiAgY29uc3QgbWlzc2luZzogdW5rbm93bltdID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZXhwZWN0ZWQubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGFjdHVhbC5sZW5ndGg7IGorKykge1xuICAgICAgaWYgKGVxdWFsKGV4cGVjdGVkW2ldLCBhY3R1YWxbal0pKSB7XG4gICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghZm91bmQpIHtcbiAgICAgIG1pc3NpbmcucHVzaChleHBlY3RlZFtpXSk7XG4gICAgfVxuICB9XG4gIGlmIChtaXNzaW5nLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoIW1zZykge1xuICAgIG1zZyA9IGBhY3R1YWw6IFwiJHtfZm9ybWF0KGFjdHVhbCl9XCIgZXhwZWN0ZWQgdG8gaW5jbHVkZTogXCIke1xuICAgICAgX2Zvcm1hdChleHBlY3RlZClcbiAgICB9XCJcXG5taXNzaW5nOiAke19mb3JtYXQobWlzc2luZyl9YDtcbiAgfVxuICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbn1cblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIG1hdGNoIFJlZ0V4cCBgZXhwZWN0ZWRgLiBJZiBub3RcbiAqIHRoZW4gdGhyb3cuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRNYXRjaChcbiAgYWN0dWFsOiBzdHJpbmcsXG4gIGV4cGVjdGVkOiBSZWdFeHAsXG4gIG1zZz86IHN0cmluZyxcbik6IHZvaWQge1xuICBpZiAoIWV4cGVjdGVkLnRlc3QoYWN0dWFsKSkge1xuICAgIGlmICghbXNnKSB7XG4gICAgICBtc2cgPSBgYWN0dWFsOiBcIiR7YWN0dWFsfVwiIGV4cGVjdGVkIHRvIG1hdGNoOiBcIiR7ZXhwZWN0ZWR9XCJgO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbiAgfVxufVxuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgbm90IG1hdGNoIFJlZ0V4cCBgZXhwZWN0ZWRgLiBJZiBtYXRjaFxuICogdGhlbiB0aHJvdy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vdE1hdGNoKFxuICBhY3R1YWw6IHN0cmluZyxcbiAgZXhwZWN0ZWQ6IFJlZ0V4cCxcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZCB7XG4gIGlmIChleHBlY3RlZC50ZXN0KGFjdHVhbCkpIHtcbiAgICBpZiAoIW1zZykge1xuICAgICAgbXNnID0gYGFjdHVhbDogXCIke2FjdHVhbH1cIiBleHBlY3RlZCB0byBub3QgbWF0Y2g6IFwiJHtleHBlY3RlZH1cImA7XG4gICAgfVxuICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICB9XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBvYmplY3QgaXMgYSBzdWJzZXQgb2YgYGV4cGVjdGVkYCBvYmplY3QsIGRlZXBseS5cbiAqIElmIG5vdCwgdGhlbiB0aHJvdy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE9iamVjdE1hdGNoKFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBhY3R1YWw6IFJlY29yZDxQcm9wZXJ0eUtleSwgYW55PixcbiAgZXhwZWN0ZWQ6IFJlY29yZDxQcm9wZXJ0eUtleSwgdW5rbm93bj4sXG4pOiB2b2lkIHtcbiAgdHlwZSBsb29zZSA9IFJlY29yZDxQcm9wZXJ0eUtleSwgdW5rbm93bj47XG4gIGNvbnN0IHNlZW4gPSBuZXcgV2Vha01hcCgpO1xuICByZXR1cm4gYXNzZXJ0RXF1YWxzKFxuICAgIChmdW5jdGlvbiBmaWx0ZXIoYTogbG9vc2UsIGI6IGxvb3NlKTogbG9vc2Uge1xuICAgICAgLy8gUHJldmVudCBpbmZpbml0ZSBsb29wIHdpdGggY2lyY3VsYXIgcmVmZXJlbmNlcyB3aXRoIHNhbWUgZmlsdGVyXG4gICAgICBpZiAoKHNlZW4uaGFzKGEpKSAmJiAoc2Vlbi5nZXQoYSkgPT09IGIpKSB7XG4gICAgICAgIHJldHVybiBhO1xuICAgICAgfVxuICAgICAgc2Vlbi5zZXQoYSwgYik7XG4gICAgICAvLyBGaWx0ZXIga2V5cyBhbmQgc3ltYm9scyB3aGljaCBhcmUgcHJlc2VudCBpbiBib3RoIGFjdHVhbCBhbmQgZXhwZWN0ZWRcbiAgICAgIGNvbnN0IGZpbHRlcmVkID0ge30gYXMgbG9vc2U7XG4gICAgICBjb25zdCBlbnRyaWVzID0gW1xuICAgICAgICAuLi5PYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhhKSxcbiAgICAgICAgLi4uT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhhKSxcbiAgICAgIF1cbiAgICAgICAgLmZpbHRlcigoa2V5KSA9PiBrZXkgaW4gYilcbiAgICAgICAgLm1hcCgoa2V5KSA9PiBba2V5LCBhW2tleSBhcyBzdHJpbmddXSkgYXMgQXJyYXk8W3N0cmluZywgdW5rbm93bl0+O1xuICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgZW50cmllcykge1xuICAgICAgICAvLyBPbiBhcnJheSByZWZlcmVuY2VzLCBidWlsZCBhIGZpbHRlcmVkIGFycmF5IGFuZCBmaWx0ZXIgbmVzdGVkIG9iamVjdHMgaW5zaWRlXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgIGNvbnN0IHN1YnNldCA9IChiIGFzIGxvb3NlKVtrZXldO1xuICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHN1YnNldCkpIHtcbiAgICAgICAgICAgIGZpbHRlcmVkW2tleV0gPSB2YWx1ZVxuICAgICAgICAgICAgICAuc2xpY2UoMCwgc3Vic2V0Lmxlbmd0aClcbiAgICAgICAgICAgICAgLm1hcCgoZWxlbWVudCwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWJzZXRFbGVtZW50ID0gc3Vic2V0W2luZGV4XTtcbiAgICAgICAgICAgICAgICBpZiAoKHR5cGVvZiBzdWJzZXRFbGVtZW50ID09PSBcIm9iamVjdFwiKSAmJiAoc3Vic2V0RWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXIoZWxlbWVudCwgc3Vic2V0RWxlbWVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSAvLyBPbiBuZXN0ZWQgb2JqZWN0cyByZWZlcmVuY2VzLCBidWlsZCBhIGZpbHRlcmVkIG9iamVjdCByZWN1cnNpdmVseVxuICAgICAgICBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICBjb25zdCBzdWJzZXQgPSAoYiBhcyBsb29zZSlba2V5XTtcbiAgICAgICAgICBpZiAoKHR5cGVvZiBzdWJzZXQgPT09IFwib2JqZWN0XCIpICYmIChzdWJzZXQpKSB7XG4gICAgICAgICAgICBmaWx0ZXJlZFtrZXldID0gZmlsdGVyKHZhbHVlIGFzIGxvb3NlLCBzdWJzZXQgYXMgbG9vc2UpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZpbHRlcmVkW2tleV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmaWx0ZXJlZDtcbiAgICB9KShhY3R1YWwsIGV4cGVjdGVkKSxcbiAgICBleHBlY3RlZCxcbiAgKTtcbn1cblxuLyoqXG4gKiBGb3JjZWZ1bGx5IHRocm93cyBhIGZhaWxlZCBhc3NlcnRpb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZhaWwobXNnPzogc3RyaW5nKTogbmV2ZXIge1xuICBhc3NlcnQoZmFsc2UsIGBGYWlsZWQgYXNzZXJ0aW9uJHttc2cgPyBgOiAke21zZ31gIDogXCIuXCJ9YCk7XG59XG5cbi8qKlxuICogRXhlY3V0ZXMgYSBmdW5jdGlvbiwgZXhwZWN0aW5nIGl0IHRvIHRocm93LiAgSWYgaXQgZG9lcyBub3QsIHRoZW4gaXRcbiAqIHRocm93cy4gQW4gZXJyb3IgY2xhc3MgYW5kIGEgc3RyaW5nIHRoYXQgc2hvdWxkIGJlIGluY2x1ZGVkIGluIHRoZVxuICogZXJyb3IgbWVzc2FnZSBjYW4gYWxzbyBiZSBhc3NlcnRlZC4gT3IgeW91IGNhbiBwYXNzIGFcbiAqIGNhbGxiYWNrIHdoaWNoIHdpbGwgYmUgcGFzc2VkIHRoZSBlcnJvciwgdXN1YWxseSB0byBhcHBseSBzb21lIGN1c3RvbVxuICogYXNzZXJ0aW9ucyBvbiBpdC5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFRocm93cyhcbiAgZm46ICgpID0+IHVua25vd24sXG4gIEVycm9yQ2xhc3M/OiBDb25zdHJ1Y3RvcixcbiAgbXNnSW5jbHVkZXM/OiBzdHJpbmcsXG4gIG1zZz86IHN0cmluZyxcbik6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0VGhyb3dzKFxuICBmbjogKCkgPT4gdW5rbm93bixcbiAgZXJyb3JDYWxsYmFjazogKGU6IEVycm9yKSA9PiB1bmtub3duLFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFRocm93cyhcbiAgZm46ICgpID0+IHVua25vd24sXG4gIGVycm9yQ2xhc3NPckNhbGxiYWNrPzogQ29uc3RydWN0b3IgfCAoKGU6IEVycm9yKSA9PiB1bmtub3duKSxcbiAgbXNnSW5jbHVkZXNPck1zZz86IHN0cmluZyxcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZCB7XG4gIGxldCBFcnJvckNsYXNzO1xuICBsZXQgbXNnSW5jbHVkZXM7XG4gIGxldCBlcnJvckNhbGxiYWNrO1xuICBpZiAoXG4gICAgZXJyb3JDbGFzc09yQ2FsbGJhY2sgPT0gbnVsbCB8fFxuICAgIGVycm9yQ2xhc3NPckNhbGxiYWNrLnByb3RvdHlwZSBpbnN0YW5jZW9mIEVycm9yIHx8XG4gICAgZXJyb3JDbGFzc09yQ2FsbGJhY2sucHJvdG90eXBlID09PSBFcnJvci5wcm90b3R5cGVcbiAgKSB7XG4gICAgRXJyb3JDbGFzcyA9IGVycm9yQ2xhc3NPckNhbGxiYWNrO1xuICAgIG1zZ0luY2x1ZGVzID0gbXNnSW5jbHVkZXNPck1zZztcbiAgICBlcnJvckNhbGxiYWNrID0gbnVsbDtcbiAgfSBlbHNlIHtcbiAgICBFcnJvckNsYXNzID0gbnVsbDtcbiAgICBtc2dJbmNsdWRlcyA9IG51bGw7XG4gICAgZXJyb3JDYWxsYmFjayA9IGVycm9yQ2xhc3NPckNhbGxiYWNrIGFzIChlOiBFcnJvcikgPT4gdW5rbm93bjtcbiAgICBtc2cgPSBtc2dJbmNsdWRlc09yTXNnO1xuICB9XG4gIGxldCBkb2VzVGhyb3cgPSBmYWxzZTtcbiAgbGV0IGVycm9yID0gbnVsbDtcbiAgdHJ5IHtcbiAgICBmbigpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKGUgaW5zdGFuY2VvZiBFcnJvciA9PT0gZmFsc2UpIHtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcIkEgbm9uLUVycm9yIG9iamVjdCB3YXMgdGhyb3duLlwiKTtcbiAgICB9XG4gICAgaWYgKEVycm9yQ2xhc3MgJiYgIShlIGluc3RhbmNlb2YgRXJyb3JDbGFzcykpIHtcbiAgICAgIG1zZyA9IGBFeHBlY3RlZCBlcnJvciB0byBiZSBpbnN0YW5jZSBvZiBcIiR7RXJyb3JDbGFzcy5uYW1lfVwiLCBidXQgd2FzIFwiJHtcbiAgICAgICAgdHlwZW9mIGUgPT09IFwib2JqZWN0XCIgPyBlPy5jb25zdHJ1Y3Rvcj8ubmFtZSA6IFwiW25vdCBhbiBvYmplY3RdXCJcbiAgICAgIH1cIiR7bXNnID8gYDogJHttc2d9YCA6IFwiLlwifWA7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgbXNnSW5jbHVkZXMgJiYgKCEoZSBpbnN0YW5jZW9mIEVycm9yKSB8fFxuICAgICAgICAhc3RyaXBDb2xvcihlLm1lc3NhZ2UpLmluY2x1ZGVzKHN0cmlwQ29sb3IobXNnSW5jbHVkZXMpKSlcbiAgICApIHtcbiAgICAgIG1zZyA9IGBFeHBlY3RlZCBlcnJvciBtZXNzYWdlIHRvIGluY2x1ZGUgXCIke21zZ0luY2x1ZGVzfVwiLCBidXQgZ290IFwiJHtcbiAgICAgICAgZSBpbnN0YW5jZW9mIEVycm9yID8gZS5tZXNzYWdlIDogXCJbbm90IGFuIEVycm9yXVwiXG4gICAgICB9XCIke21zZyA/IGA6ICR7bXNnfWAgOiBcIi5cIn1gO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG4gICAgfVxuICAgIGRvZXNUaHJvdyA9IHRydWU7XG4gICAgZXJyb3IgPSBlO1xuICB9XG4gIGlmICghZG9lc1Rocm93KSB7XG4gICAgbXNnID0gYEV4cGVjdGVkIGZ1bmN0aW9uIHRvIHRocm93JHttc2cgPyBgOiAke21zZ31gIDogXCIuXCJ9YDtcbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbiAgfVxuICBpZiAodHlwZW9mIGVycm9yQ2FsbGJhY2sgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgZXJyb3JDYWxsYmFjayhlcnJvciBhcyBFcnJvcik7XG4gIH1cbn1cblxuLyoqXG4gKiBFeGVjdXRlcyBhIGZ1bmN0aW9uIHdoaWNoIHJldHVybnMgYSBwcm9taXNlLCBleHBlY3RpbmcgaXQgdG8gdGhyb3cgb3IgcmVqZWN0LlxuICogSWYgaXQgZG9lcyBub3QsIHRoZW4gaXQgdGhyb3dzLiBBbiBlcnJvciBjbGFzcyBhbmQgYSBzdHJpbmcgdGhhdCBzaG91bGQgYmVcbiAqIGluY2x1ZGVkIGluIHRoZSBlcnJvciBtZXNzYWdlIGNhbiBhbHNvIGJlIGFzc2VydGVkLiBPciB5b3UgY2FuIHBhc3MgYVxuICogY2FsbGJhY2sgd2hpY2ggd2lsbCBiZSBwYXNzZWQgdGhlIGVycm9yLCB1c3VhbGx5IHRvIGFwcGx5IHNvbWUgY3VzdG9tXG4gKiBhc3NlcnRpb25zIG9uIGl0LlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0UmVqZWN0cyhcbiAgZm46ICgpID0+IFByb21pc2U8dW5rbm93bj4sXG4gIEVycm9yQ2xhc3M/OiBDb25zdHJ1Y3RvcixcbiAgbXNnSW5jbHVkZXM/OiBzdHJpbmcsXG4gIG1zZz86IHN0cmluZyxcbik6IFByb21pc2U8dm9pZD47XG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0UmVqZWN0cyhcbiAgZm46ICgpID0+IFByb21pc2U8dW5rbm93bj4sXG4gIGVycm9yQ2FsbGJhY2s6IChlOiBFcnJvcikgPT4gdW5rbm93bixcbiAgbXNnPzogc3RyaW5nLFxuKTogUHJvbWlzZTx2b2lkPjtcbmV4cG9ydCBhc3luYyBmdW5jdGlvbiBhc3NlcnRSZWplY3RzKFxuICBmbjogKCkgPT4gUHJvbWlzZTx1bmtub3duPixcbiAgZXJyb3JDbGFzc09yQ2FsbGJhY2s/OiBDb25zdHJ1Y3RvciB8ICgoZTogRXJyb3IpID0+IHVua25vd24pLFxuICBtc2dJbmNsdWRlc09yTXNnPzogc3RyaW5nLFxuICBtc2c/OiBzdHJpbmcsXG4pOiBQcm9taXNlPHZvaWQ+IHtcbiAgbGV0IEVycm9yQ2xhc3M7XG4gIGxldCBtc2dJbmNsdWRlcztcbiAgbGV0IGVycm9yQ2FsbGJhY2s7XG4gIGlmIChcbiAgICBlcnJvckNsYXNzT3JDYWxsYmFjayA9PSBudWxsIHx8XG4gICAgZXJyb3JDbGFzc09yQ2FsbGJhY2sucHJvdG90eXBlIGluc3RhbmNlb2YgRXJyb3IgfHxcbiAgICBlcnJvckNsYXNzT3JDYWxsYmFjay5wcm90b3R5cGUgPT09IEVycm9yLnByb3RvdHlwZVxuICApIHtcbiAgICBFcnJvckNsYXNzID0gZXJyb3JDbGFzc09yQ2FsbGJhY2s7XG4gICAgbXNnSW5jbHVkZXMgPSBtc2dJbmNsdWRlc09yTXNnO1xuICAgIGVycm9yQ2FsbGJhY2sgPSBudWxsO1xuICB9IGVsc2Uge1xuICAgIEVycm9yQ2xhc3MgPSBudWxsO1xuICAgIG1zZ0luY2x1ZGVzID0gbnVsbDtcbiAgICBlcnJvckNhbGxiYWNrID0gZXJyb3JDbGFzc09yQ2FsbGJhY2sgYXMgKGU6IEVycm9yKSA9PiB1bmtub3duO1xuICAgIG1zZyA9IG1zZ0luY2x1ZGVzT3JNc2c7XG4gIH1cbiAgbGV0IGRvZXNUaHJvdyA9IGZhbHNlO1xuICBsZXQgZXJyb3IgPSBudWxsO1xuICB0cnkge1xuICAgIGF3YWl0IGZuKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoZSBpbnN0YW5jZW9mIEVycm9yID09PSBmYWxzZSkge1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFwiQSBub24tRXJyb3Igb2JqZWN0IHdhcyB0aHJvd24gb3IgcmVqZWN0ZWQuXCIpO1xuICAgIH1cbiAgICBpZiAoRXJyb3JDbGFzcyAmJiAhKGUgaW5zdGFuY2VvZiBFcnJvckNsYXNzKSkge1xuICAgICAgbXNnID0gYEV4cGVjdGVkIGVycm9yIHRvIGJlIGluc3RhbmNlIG9mIFwiJHtFcnJvckNsYXNzLm5hbWV9XCIsIGJ1dCB3YXMgXCIke1xuICAgICAgICB0eXBlb2YgZSA9PT0gXCJvYmplY3RcIiA/IGU/LmNvbnN0cnVjdG9yPy5uYW1lIDogXCJbbm90IGFuIG9iamVjdF1cIlxuICAgICAgfVwiJHttc2cgPyBgOiAke21zZ31gIDogXCIuXCJ9YDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICAgIH1cbiAgICBpZiAoXG4gICAgICBtc2dJbmNsdWRlcyAmJiAoIShlIGluc3RhbmNlb2YgRXJyb3IpIHx8XG4gICAgICAgICFzdHJpcENvbG9yKGUubWVzc2FnZSkuaW5jbHVkZXMoc3RyaXBDb2xvcihtc2dJbmNsdWRlcykpKVxuICAgICkge1xuICAgICAgbXNnID0gYEV4cGVjdGVkIGVycm9yIG1lc3NhZ2UgdG8gaW5jbHVkZSBcIiR7bXNnSW5jbHVkZXN9XCIsIGJ1dCBnb3QgXCIke1xuICAgICAgICBlIGluc3RhbmNlb2YgRXJyb3IgPyBlLm1lc3NhZ2UgOiBcIltub3QgYW4gRXJyb3JdXCJcbiAgICAgIH1cIiR7bXNnID8gYDogJHttc2d9YCA6IFwiLlwifWA7XG4gICAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbiAgICB9XG4gICAgZG9lc1Rocm93ID0gdHJ1ZTtcbiAgICBlcnJvciA9IGU7XG4gIH1cbiAgaWYgKCFkb2VzVGhyb3cpIHtcbiAgICBtc2cgPSBgRXhwZWN0ZWQgZnVuY3Rpb24gdG8gdGhyb3cke21zZyA/IGA6ICR7bXNnfWAgOiBcIi5cIn1gO1xuICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICB9XG4gIGlmICh0eXBlb2YgZXJyb3JDYWxsYmFjayA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBlcnJvckNhbGxiYWNrKGVycm9yIGFzIEVycm9yKTtcbiAgfVxufVxuXG4vKipcbiAqIEV4ZWN1dGVzIGEgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBhIHByb21pc2UsIGV4cGVjdGluZyBpdCB0byB0aHJvdyBvciByZWplY3QuXG4gKiBJZiBpdCBkb2VzIG5vdCwgdGhlbiBpdCB0aHJvd3MuICBBbiBlcnJvciBjbGFzcyBhbmQgYSBzdHJpbmcgdGhhdCBzaG91bGQgYmVcbiAqIGluY2x1ZGVkIGluIHRoZSBlcnJvciBtZXNzYWdlIGNhbiBhbHNvIGJlIGFzc2VydGVkLlxuICpcbiAqIEBkZXByZWNhdGVkXG4gKi9cbmV4cG9ydCB7IGFzc2VydFJlamVjdHMgYXMgYXNzZXJ0VGhyb3dzQXN5bmMgfTtcblxuLyoqIFVzZSB0aGlzIHRvIHN0dWIgb3V0IG1ldGhvZHMgdGhhdCB3aWxsIHRocm93IHdoZW4gaW52b2tlZC4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bmltcGxlbWVudGVkKG1zZz86IHN0cmluZyk6IG5ldmVyIHtcbiAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyB8fCBcInVuaW1wbGVtZW50ZWRcIik7XG59XG5cbi8qKiBVc2UgdGhpcyB0byBhc3NlcnQgdW5yZWFjaGFibGUgY29kZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiB1bnJlYWNoYWJsZSgpOiBuZXZlciB7XG4gIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcInVucmVhY2hhYmxlXCIpO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEVBQTBFLEFBQTFFLHdFQUEwRTtBQUMxRSxFQUE4RSxBQUE5RSw0RUFBOEU7QUFDOUUsRUFBMkMsQUFBM0MseUNBQTJDO0FBRTNDLE1BQU0sR0FDSixPQUFPLEVBQ1AsS0FBSyxFQUNMLElBQUksRUFDSixJQUFJLEVBQ0osS0FBSyxFQUNMLEdBQUcsRUFDSCxVQUFVLEVBQ1YsS0FBSyxRQUNBLENBQWtCO0FBQ3pCLE1BQU0sR0FBRyxJQUFJLEVBQWMsT0FBTyxFQUFFLFFBQVEsUUFBUSxDQUFZO0FBRWhFLEtBQUssQ0FBQyxlQUFlLEdBQUcsQ0FBa0I7QUFPMUMsTUFBTSxPQUFPLGNBQWMsU0FBUyxL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