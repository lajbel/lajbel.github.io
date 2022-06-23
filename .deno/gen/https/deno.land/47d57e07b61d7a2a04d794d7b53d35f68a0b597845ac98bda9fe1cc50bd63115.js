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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjk3LjAvdGVzdGluZy9hc3NlcnRzLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjEgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBUaGlzIG1vZHVsZSBpcyBicm93c2VyIGNvbXBhdGlibGUuIERvIG5vdCByZWx5IG9uIGdvb2QgZm9ybWF0dGluZyBvZiB2YWx1ZXNcbi8vIGZvciBBc3NlcnRpb25FcnJvciBtZXNzYWdlcyBpbiBicm93c2Vycy5cblxuaW1wb3J0IHsgYm9sZCwgZ3JheSwgZ3JlZW4sIHJlZCwgc3RyaXBDb2xvciwgd2hpdGUgfSBmcm9tIFwiLi4vZm10L2NvbG9ycy50c1wiO1xuaW1wb3J0IHsgZGlmZiwgRGlmZlJlc3VsdCwgRGlmZlR5cGUgfSBmcm9tIFwiLi9fZGlmZi50c1wiO1xuXG5jb25zdCBDQU5fTk9UX0RJU1BMQVkgPSBcIltDYW5ub3QgZGlzcGxheV1cIjtcblxuaW50ZXJmYWNlIENvbnN0cnVjdG9yIHtcbiAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgbmV3ICguLi5hcmdzOiBhbnlbXSk6IGFueTtcbn1cblxuZXhwb3J0IGNsYXNzIEFzc2VydGlvbkVycm9yIGV4dGVuZHMgRXJyb3Ige1xuICBjb25zdHJ1Y3RvcihtZXNzYWdlOiBzdHJpbmcpIHtcbiAgICBzdXBlcihtZXNzYWdlKTtcbiAgICB0aGlzLm5hbWUgPSBcIkFzc2VydGlvbkVycm9yXCI7XG4gIH1cbn1cblxuLyoqXG4gKiBDb252ZXJ0cyB0aGUgaW5wdXQgaW50byBhIHN0cmluZy4gT2JqZWN0cywgU2V0cyBhbmQgTWFwcyBhcmUgc29ydGVkIHNvIGFzIHRvXG4gKiBtYWtlIHRlc3RzIGxlc3MgZmxha3lcbiAqIEBwYXJhbSB2IFZhbHVlIHRvIGJlIGZvcm1hdHRlZFxuICovXG5leHBvcnQgZnVuY3Rpb24gX2Zvcm1hdCh2OiB1bmtub3duKTogc3RyaW5nIHtcbiAgcmV0dXJuIGdsb2JhbFRoaXMuRGVub1xuICAgID8gRGVuby5pbnNwZWN0KHYsIHtcbiAgICAgIGRlcHRoOiBJbmZpbml0eSxcbiAgICAgIHNvcnRlZDogdHJ1ZSxcbiAgICAgIHRyYWlsaW5nQ29tbWE6IHRydWUsXG4gICAgICBjb21wYWN0OiBmYWxzZSxcbiAgICAgIGl0ZXJhYmxlTGltaXQ6IEluZmluaXR5LFxuICAgIH0pXG4gICAgOiBgXCIke1N0cmluZyh2KS5yZXBsYWNlKC8oPz1bXCJcXFxcXSkvZywgXCJcXFxcXCIpfVwiYDtcbn1cblxuLyoqXG4gKiBDb2xvcnMgdGhlIG91dHB1dCBvZiBhc3NlcnRpb24gZGlmZnNcbiAqIEBwYXJhbSBkaWZmVHlwZSBEaWZmZXJlbmNlIHR5cGUsIGVpdGhlciBhZGRlZCBvciByZW1vdmVkXG4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUNvbG9yKGRpZmZUeXBlOiBEaWZmVHlwZSk6IChzOiBzdHJpbmcpID0+IHN0cmluZyB7XG4gIHN3aXRjaCAoZGlmZlR5cGUpIHtcbiAgICBjYXNlIERpZmZUeXBlLmFkZGVkOlxuICAgICAgcmV0dXJuIChzOiBzdHJpbmcpOiBzdHJpbmcgPT4gZ3JlZW4oYm9sZChzKSk7XG4gICAgY2FzZSBEaWZmVHlwZS5yZW1vdmVkOlxuICAgICAgcmV0dXJuIChzOiBzdHJpbmcpOiBzdHJpbmcgPT4gcmVkKGJvbGQocykpO1xuICAgIGRlZmF1bHQ6XG4gICAgICByZXR1cm4gd2hpdGU7XG4gIH1cbn1cblxuLyoqXG4gKiBQcmVmaXhlcyBgK2Agb3IgYC1gIGluIGRpZmYgb3V0cHV0XG4gKiBAcGFyYW0gZGlmZlR5cGUgRGlmZmVyZW5jZSB0eXBlLCBlaXRoZXIgYWRkZWQgb3IgcmVtb3ZlZFxuICovXG5mdW5jdGlvbiBjcmVhdGVTaWduKGRpZmZUeXBlOiBEaWZmVHlwZSk6IHN0cmluZyB7XG4gIHN3aXRjaCAoZGlmZlR5cGUpIHtcbiAgICBjYXNlIERpZmZUeXBlLmFkZGVkOlxuICAgICAgcmV0dXJuIFwiKyAgIFwiO1xuICAgIGNhc2UgRGlmZlR5cGUucmVtb3ZlZDpcbiAgICAgIHJldHVybiBcIi0gICBcIjtcbiAgICBkZWZhdWx0OlxuICAgICAgcmV0dXJuIFwiICAgIFwiO1xuICB9XG59XG5cbmZ1bmN0aW9uIGJ1aWxkTWVzc2FnZShkaWZmUmVzdWx0OiBSZWFkb25seUFycmF5PERpZmZSZXN1bHQ8c3RyaW5nPj4pOiBzdHJpbmdbXSB7XG4gIGNvbnN0IG1lc3NhZ2VzOiBzdHJpbmdbXSA9IFtdO1xuICBtZXNzYWdlcy5wdXNoKFwiXCIpO1xuICBtZXNzYWdlcy5wdXNoKFwiXCIpO1xuICBtZXNzYWdlcy5wdXNoKFxuICAgIGAgICAgJHtncmF5KGJvbGQoXCJbRGlmZl1cIikpfSAke3JlZChib2xkKFwiQWN0dWFsXCIpKX0gLyAke1xuICAgICAgZ3JlZW4oYm9sZChcIkV4cGVjdGVkXCIpKVxuICAgIH1gLFxuICApO1xuICBtZXNzYWdlcy5wdXNoKFwiXCIpO1xuICBtZXNzYWdlcy5wdXNoKFwiXCIpO1xuICBkaWZmUmVzdWx0LmZvckVhY2goKHJlc3VsdDogRGlmZlJlc3VsdDxzdHJpbmc+KTogdm9pZCA9PiB7XG4gICAgY29uc3QgYyA9IGNyZWF0ZUNvbG9yKHJlc3VsdC50eXBlKTtcbiAgICBtZXNzYWdlcy5wdXNoKGMoYCR7Y3JlYXRlU2lnbihyZXN1bHQudHlwZSl9JHtyZXN1bHQudmFsdWV9YCkpO1xuICB9KTtcbiAgbWVzc2FnZXMucHVzaChcIlwiKTtcblxuICByZXR1cm4gbWVzc2FnZXM7XG59XG5cbmZ1bmN0aW9uIGlzS2V5ZWRDb2xsZWN0aW9uKHg6IHVua25vd24pOiB4IGlzIFNldDx1bmtub3duPiB7XG4gIHJldHVybiBbU3ltYm9sLml0ZXJhdG9yLCBcInNpemVcIl0uZXZlcnkoKGspID0+IGsgaW4gKHggYXMgU2V0PHVua25vd24+KSk7XG59XG5cbi8qKlxuICogRGVlcCBlcXVhbGl0eSBjb21wYXJpc29uIHVzZWQgaW4gYXNzZXJ0aW9uc1xuICogQHBhcmFtIGMgYWN0dWFsIHZhbHVlXG4gKiBAcGFyYW0gZCBleHBlY3RlZCB2YWx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZXF1YWwoYzogdW5rbm93biwgZDogdW5rbm93bik6IGJvb2xlYW4ge1xuICBjb25zdCBzZWVuID0gbmV3IE1hcCgpO1xuICByZXR1cm4gKGZ1bmN0aW9uIGNvbXBhcmUoYTogdW5rbm93biwgYjogdW5rbm93bik6IGJvb2xlYW4ge1xuICAgIC8vIEhhdmUgdG8gcmVuZGVyIFJlZ0V4cCAmIERhdGUgZm9yIHN0cmluZyBjb21wYXJpc29uXG4gICAgLy8gdW5sZXNzIGl0J3MgbWlzdHJlYXRlZCBhcyBvYmplY3RcbiAgICBpZiAoXG4gICAgICBhICYmXG4gICAgICBiICYmXG4gICAgICAoKGEgaW5zdGFuY2VvZiBSZWdFeHAgJiYgYiBpbnN0YW5jZW9mIFJlZ0V4cCkgfHxcbiAgICAgICAgKGEgaW5zdGFuY2VvZiBVUkwgJiYgYiBpbnN0YW5jZW9mIFVSTCkpXG4gICAgKSB7XG4gICAgICByZXR1cm4gU3RyaW5nKGEpID09PSBTdHJpbmcoYik7XG4gICAgfVxuICAgIGlmIChhIGluc3RhbmNlb2YgRGF0ZSAmJiBiIGluc3RhbmNlb2YgRGF0ZSkge1xuICAgICAgY29uc3QgYVRpbWUgPSBhLmdldFRpbWUoKTtcbiAgICAgIGNvbnN0IGJUaW1lID0gYi5nZXRUaW1lKCk7XG4gICAgICAvLyBDaGVjayBmb3IgTmFOIGVxdWFsaXR5IG1hbnVhbGx5IHNpbmNlIE5hTiBpcyBub3RcbiAgICAgIC8vIGVxdWFsIHRvIGl0c2VsZi5cbiAgICAgIGlmIChOdW1iZXIuaXNOYU4oYVRpbWUpICYmIE51bWJlci5pc05hTihiVGltZSkpIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgICByZXR1cm4gYS5nZXRUaW1lKCkgPT09IGIuZ2V0VGltZSgpO1xuICAgIH1cbiAgICBpZiAoT2JqZWN0LmlzKGEsIGIpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKGEgJiYgdHlwZW9mIGEgPT09IFwib2JqZWN0XCIgJiYgYiAmJiB0eXBlb2YgYiA9PT0gXCJvYmplY3RcIikge1xuICAgICAgaWYgKHNlZW4uZ2V0KGEpID09PSBiKSB7XG4gICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgfVxuICAgICAgaWYgKE9iamVjdC5rZXlzKGEgfHwge30pLmxlbmd0aCAhPT0gT2JqZWN0LmtleXMoYiB8fCB7fSkubGVuZ3RoKSB7XG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgIH1cbiAgICAgIGlmIChpc0tleWVkQ29sbGVjdGlvbihhKSAmJiBpc0tleWVkQ29sbGVjdGlvbihiKSkge1xuICAgICAgICBpZiAoYS5zaXplICE9PSBiLnNpemUpIHtcbiAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICBsZXQgdW5tYXRjaGVkRW50cmllcyA9IGEuc2l6ZTtcblxuICAgICAgICBmb3IgKGNvbnN0IFthS2V5LCBhVmFsdWVdIG9mIGEuZW50cmllcygpKSB7XG4gICAgICAgICAgZm9yIChjb25zdCBbYktleSwgYlZhbHVlXSBvZiBiLmVudHJpZXMoKSkge1xuICAgICAgICAgICAgLyogR2l2ZW4gdGhhdCBNYXAga2V5cyBjYW4gYmUgcmVmZXJlbmNlcywgd2UgbmVlZFxuICAgICAgICAgICAgICogdG8gZW5zdXJlIHRoYXQgdGhleSBhcmUgYWxzbyBkZWVwbHkgZXF1YWwgKi9cbiAgICAgICAgICAgIGlmIChcbiAgICAgICAgICAgICAgKGFLZXkgPT09IGFWYWx1ZSAmJiBiS2V5ID09PSBiVmFsdWUgJiYgY29tcGFyZShhS2V5LCBiS2V5KSkgfHxcbiAgICAgICAgICAgICAgKGNvbXBhcmUoYUtleSwgYktleSkgJiYgY29tcGFyZShhVmFsdWUsIGJWYWx1ZSkpXG4gICAgICAgICAgICApIHtcbiAgICAgICAgICAgICAgdW5tYXRjaGVkRW50cmllcy0tO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB1bm1hdGNoZWRFbnRyaWVzID09PSAwO1xuICAgICAgfVxuICAgICAgY29uc3QgbWVyZ2VkID0geyAuLi5hLCAuLi5iIH07XG4gICAgICBmb3IgKFxuICAgICAgICBjb25zdCBrZXkgb2YgW1xuICAgICAgICAgIC4uLk9iamVjdC5nZXRPd25Qcm9wZXJ0eU5hbWVzKG1lcmdlZCksXG4gICAgICAgICAgLi4uT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhtZXJnZWQpLFxuICAgICAgICBdXG4gICAgICApIHtcbiAgICAgICAgdHlwZSBLZXkgPSBrZXlvZiB0eXBlb2YgbWVyZ2VkO1xuICAgICAgICBpZiAoIWNvbXBhcmUoYSAmJiBhW2tleSBhcyBLZXldLCBiICYmIGJba2V5IGFzIEtleV0pKSB7XG4gICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG4gICAgICAgIGlmICgoKGtleSBpbiBhKSAmJiAoIShrZXkgaW4gYikpKSB8fCAoKGtleSBpbiBiKSAmJiAoIShrZXkgaW4gYSkpKSkge1xuICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgc2Vlbi5zZXQoYSwgYik7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9KShjLCBkKTtcbn1cblxuLyoqIE1ha2UgYW4gYXNzZXJ0aW9uLCBlcnJvciB3aWxsIGJlIHRocm93biBpZiBgZXhwcmAgZG9lcyBub3QgaGF2ZSB0cnV0aHkgdmFsdWUuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0KGV4cHI6IHVua25vd24sIG1zZyA9IFwiXCIpOiBhc3NlcnRzIGV4cHIge1xuICBpZiAoIWV4cHIpIHtcbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbiAgfVxufVxuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgYW5kIGBleHBlY3RlZGAgYXJlIGVxdWFsLCBkZWVwbHkuIElmIG5vdFxuICogZGVlcGx5IGVxdWFsLCB0aGVuIHRocm93LlxuICpcbiAqIFR5cGUgcGFyYW1ldGVyIGNhbiBiZSBzcGVjaWZpZWQgdG8gZW5zdXJlIHZhbHVlcyB1bmRlciBjb21wYXJpc29uIGhhdmUgdGhlIHNhbWUgdHlwZS5cbiAqIEZvciBleGFtcGxlOlxuICpgYGB0c1xuICphc3NlcnRFcXVhbHM8bnVtYmVyPigxLCAyKVxuICpgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEVxdWFscyhcbiAgYWN0dWFsOiB1bmtub3duLFxuICBleHBlY3RlZDogdW5rbm93bixcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRFcXVhbHM8VD4oYWN0dWFsOiBULCBleHBlY3RlZDogVCwgbXNnPzogc3RyaW5nKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRFcXVhbHMoXG4gIGFjdHVhbDogdW5rbm93bixcbiAgZXhwZWN0ZWQ6IHVua25vd24sXG4gIG1zZz86IHN0cmluZyxcbik6IHZvaWQge1xuICBpZiAoZXF1YWwoYWN0dWFsLCBleHBlY3RlZCkpIHtcbiAgICByZXR1cm47XG4gIH1cbiAgbGV0IG1lc3NhZ2UgPSBcIlwiO1xuICBjb25zdCBhY3R1YWxTdHJpbmcgPSBfZm9ybWF0KGFjdHVhbCk7XG4gIGNvbnN0IGV4cGVjdGVkU3RyaW5nID0gX2Zvcm1hdChleHBlY3RlZCk7XG4gIHRyeSB7XG4gICAgY29uc3QgZGlmZlJlc3VsdCA9IGRpZmYoXG4gICAgICBhY3R1YWxTdHJpbmcuc3BsaXQoXCJcXG5cIiksXG4gICAgICBleHBlY3RlZFN0cmluZy5zcGxpdChcIlxcblwiKSxcbiAgICApO1xuICAgIGNvbnN0IGRpZmZNc2cgPSBidWlsZE1lc3NhZ2UoZGlmZlJlc3VsdCkuam9pbihcIlxcblwiKTtcbiAgICBtZXNzYWdlID0gYFZhbHVlcyBhcmUgbm90IGVxdWFsOlxcbiR7ZGlmZk1zZ31gO1xuICB9IGNhdGNoIHtcbiAgICBtZXNzYWdlID0gYFxcbiR7cmVkKENBTl9OT1RfRElTUExBWSl9ICsgXFxuXFxuYDtcbiAgfVxuICBpZiAobXNnKSB7XG4gICAgbWVzc2FnZSA9IG1zZztcbiAgfVxuICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobWVzc2FnZSk7XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBhbmQgYGV4cGVjdGVkYCBhcmUgbm90IGVxdWFsLCBkZWVwbHkuXG4gKiBJZiBub3QgdGhlbiB0aHJvdy5cbiAqXG4gKiBUeXBlIHBhcmFtZXRlciBjYW4gYmUgc3BlY2lmaWVkIHRvIGVuc3VyZSB2YWx1ZXMgdW5kZXIgY29tcGFyaXNvbiBoYXZlIHRoZSBzYW1lIHR5cGUuXG4gKiBGb3IgZXhhbXBsZTpcbiAqYGBgdHNcbiAqYXNzZXJ0Tm90RXF1YWxzPG51bWJlcj4oMSwgMilcbiAqYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROb3RFcXVhbHMoXG4gIGFjdHVhbDogdW5rbm93bixcbiAgZXhwZWN0ZWQ6IHVua25vd24sXG4gIG1zZz86IHN0cmluZyxcbik6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Tm90RXF1YWxzPFQ+KGFjdHVhbDogVCwgZXhwZWN0ZWQ6IFQsIG1zZz86IHN0cmluZyk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Tm90RXF1YWxzKFxuICBhY3R1YWw6IHVua25vd24sXG4gIGV4cGVjdGVkOiB1bmtub3duLFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkIHtcbiAgaWYgKCFlcXVhbChhY3R1YWwsIGV4cGVjdGVkKSkge1xuICAgIHJldHVybjtcbiAgfVxuICBsZXQgYWN0dWFsU3RyaW5nOiBzdHJpbmc7XG4gIGxldCBleHBlY3RlZFN0cmluZzogc3RyaW5nO1xuICB0cnkge1xuICAgIGFjdHVhbFN0cmluZyA9IFN0cmluZyhhY3R1YWwpO1xuICB9IGNhdGNoIHtcbiAgICBhY3R1YWxTdHJpbmcgPSBcIltDYW5ub3QgZGlzcGxheV1cIjtcbiAgfVxuICB0cnkge1xuICAgIGV4cGVjdGVkU3RyaW5nID0gU3RyaW5nKGV4cGVjdGVkKTtcbiAgfSBjYXRjaCB7XG4gICAgZXhwZWN0ZWRTdHJpbmcgPSBcIltDYW5ub3QgZGlzcGxheV1cIjtcbiAgfVxuICBpZiAoIW1zZykge1xuICAgIG1zZyA9IGBhY3R1YWw6ICR7YWN0dWFsU3RyaW5nfSBleHBlY3RlZDogJHtleHBlY3RlZFN0cmluZ31gO1xuICB9XG4gIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xufVxuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgYW5kIGBleHBlY3RlZGAgYXJlIHN0cmljdGx5IGVxdWFsLiAgSWZcbiAqIG5vdCB0aGVuIHRocm93LlxuICogYGBgdHNcbiAqIGFzc2VydFN0cmljdEVxdWFscygxLCAyKVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRTdHJpY3RFcXVhbHMoXG4gIGFjdHVhbDogdW5rbm93bixcbiAgZXhwZWN0ZWQ6IHVua25vd24sXG4gIG1zZz86IHN0cmluZyxcbik6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0U3RyaWN0RXF1YWxzPFQ+KFxuICBhY3R1YWw6IFQsXG4gIGV4cGVjdGVkOiBULFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFN0cmljdEVxdWFscyhcbiAgYWN0dWFsOiB1bmtub3duLFxuICBleHBlY3RlZDogdW5rbm93bixcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZCB7XG4gIGlmIChhY3R1YWwgPT09IGV4cGVjdGVkKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgbGV0IG1lc3NhZ2U6IHN0cmluZztcblxuICBpZiAobXNnKSB7XG4gICAgbWVzc2FnZSA9IG1zZztcbiAgfSBlbHNlIHtcbiAgICBjb25zdCBhY3R1YWxTdHJpbmcgPSBfZm9ybWF0KGFjdHVhbCk7XG4gICAgY29uc3QgZXhwZWN0ZWRTdHJpbmcgPSBfZm9ybWF0KGV4cGVjdGVkKTtcblxuICAgIGlmIChhY3R1YWxTdHJpbmcgPT09IGV4cGVjdGVkU3RyaW5nKSB7XG4gICAgICBjb25zdCB3aXRoT2Zmc2V0ID0gYWN0dWFsU3RyaW5nXG4gICAgICAgIC5zcGxpdChcIlxcblwiKVxuICAgICAgICAubWFwKChsKSA9PiBgICAgICR7bH1gKVxuICAgICAgICAuam9pbihcIlxcblwiKTtcbiAgICAgIG1lc3NhZ2UgPVxuICAgICAgICBgVmFsdWVzIGhhdmUgdGhlIHNhbWUgc3RydWN0dXJlIGJ1dCBhcmUgbm90IHJlZmVyZW5jZS1lcXVhbDpcXG5cXG4ke1xuICAgICAgICAgIHJlZCh3aXRoT2Zmc2V0KVxuICAgICAgICB9XFxuYDtcbiAgICB9IGVsc2Uge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgZGlmZlJlc3VsdCA9IGRpZmYoXG4gICAgICAgICAgYWN0dWFsU3RyaW5nLnNwbGl0KFwiXFxuXCIpLFxuICAgICAgICAgIGV4cGVjdGVkU3RyaW5nLnNwbGl0KFwiXFxuXCIpLFxuICAgICAgICApO1xuICAgICAgICBjb25zdCBkaWZmTXNnID0gYnVpbGRNZXNzYWdlKGRpZmZSZXN1bHQpLmpvaW4oXCJcXG5cIik7XG4gICAgICAgIG1lc3NhZ2UgPSBgVmFsdWVzIGFyZSBub3Qgc3RyaWN0bHkgZXF1YWw6XFxuJHtkaWZmTXNnfWA7XG4gICAgICB9IGNhdGNoIHtcbiAgICAgICAgbWVzc2FnZSA9IGBcXG4ke3JlZChDQU5fTk9UX0RJU1BMQVkpfSArIFxcblxcbmA7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1lc3NhZ2UpO1xufVxuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgYW5kIGBleHBlY3RlZGAgYXJlIG5vdCBzdHJpY3RseSBlcXVhbC5cbiAqIElmIHRoZSB2YWx1ZXMgYXJlIHN0cmljdGx5IGVxdWFsIHRoZW4gdGhyb3cuXG4gKiBgYGB0c1xuICogYXNzZXJ0Tm90U3RyaWN0RXF1YWxzKDEsIDEpXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vdFN0cmljdEVxdWFscyhcbiAgYWN0dWFsOiB1bmtub3duLFxuICBleHBlY3RlZDogdW5rbm93bixcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnROb3RTdHJpY3RFcXVhbHM8VD4oXG4gIGFjdHVhbDogVCxcbiAgZXhwZWN0ZWQ6IFQsXG4gIG1zZz86IHN0cmluZyxcbik6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0Tm90U3RyaWN0RXF1YWxzKFxuICBhY3R1YWw6IHVua25vd24sXG4gIGV4cGVjdGVkOiB1bmtub3duLFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkIHtcbiAgaWYgKGFjdHVhbCAhPT0gZXhwZWN0ZWQpIHtcbiAgICByZXR1cm47XG4gIH1cblxuICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXG4gICAgbXNnID8/IGBFeHBlY3RlZCBcImFjdHVhbFwiIHRvIGJlIHN0cmljdGx5IHVuZXF1YWwgdG86ICR7X2Zvcm1hdChhY3R1YWwpfVxcbmAsXG4gICk7XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBhY3R1YWwgaXMgbm90IG51bGwgb3IgdW5kZWZpbmVkLiBJZiBub3RcbiAqIHRoZW4gdGhyb3duLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0RXhpc3RzKFxuICBhY3R1YWw6IHVua25vd24sXG4gIG1zZz86IHN0cmluZyxcbik6IHZvaWQge1xuICBpZiAoYWN0dWFsID09PSB1bmRlZmluZWQgfHwgYWN0dWFsID09PSBudWxsKSB7XG4gICAgaWYgKCFtc2cpIHtcbiAgICAgIG1zZyA9XG4gICAgICAgIGBhY3R1YWw6IFwiJHthY3R1YWx9XCIgZXhwZWN0ZWQgdG8gbWF0Y2ggYW55dGhpbmcgYnV0IG51bGwgb3IgdW5kZWZpbmVkYDtcbiAgICB9XG4gICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG4gIH1cbn1cblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGFjdHVhbCBpbmNsdWRlcyBleHBlY3RlZC4gSWYgbm90XG4gKiB0aGVuIHRocm93bi5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydFN0cmluZ0luY2x1ZGVzKFxuICBhY3R1YWw6IHN0cmluZyxcbiAgZXhwZWN0ZWQ6IHN0cmluZyxcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZCB7XG4gIGlmICghYWN0dWFsLmluY2x1ZGVzKGV4cGVjdGVkKSkge1xuICAgIGlmICghbXNnKSB7XG4gICAgICBtc2cgPSBgYWN0dWFsOiBcIiR7YWN0dWFsfVwiIGV4cGVjdGVkIHRvIGNvbnRhaW46IFwiJHtleHBlY3RlZH1cImA7XG4gICAgfVxuICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICB9XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBpbmNsdWRlcyB0aGUgYGV4cGVjdGVkYCB2YWx1ZXMuXG4gKiBJZiBub3QgdGhlbiBhbiBlcnJvciB3aWxsIGJlIHRocm93bi5cbiAqXG4gKiBUeXBlIHBhcmFtZXRlciBjYW4gYmUgc3BlY2lmaWVkIHRvIGVuc3VyZSB2YWx1ZXMgdW5kZXIgY29tcGFyaXNvbiBoYXZlIHRoZSBzYW1lIHR5cGUuXG4gKiBGb3IgZXhhbXBsZTpcbiAqYGBgdHNcbiAqYXNzZXJ0QXJyYXlJbmNsdWRlczxudW1iZXI+KFsxLCAyXSwgWzJdKVxuICpgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEFycmF5SW5jbHVkZXMoXG4gIGFjdHVhbDogQXJyYXlMaWtlPHVua25vd24+LFxuICBleHBlY3RlZDogQXJyYXlMaWtlPHVua25vd24+LFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEFycmF5SW5jbHVkZXM8VD4oXG4gIGFjdHVhbDogQXJyYXlMaWtlPFQ+LFxuICBleHBlY3RlZDogQXJyYXlMaWtlPFQ+LFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkO1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydEFycmF5SW5jbHVkZXMoXG4gIGFjdHVhbDogQXJyYXlMaWtlPHVua25vd24+LFxuICBleHBlY3RlZDogQXJyYXlMaWtlPHVua25vd24+LFxuICBtc2c/OiBzdHJpbmcsXG4pOiB2b2lkIHtcbiAgY29uc3QgbWlzc2luZzogdW5rbm93bltdID0gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgZXhwZWN0ZWQubGVuZ3RoOyBpKyspIHtcbiAgICBsZXQgZm91bmQgPSBmYWxzZTtcbiAgICBmb3IgKGxldCBqID0gMDsgaiA8IGFjdHVhbC5sZW5ndGg7IGorKykge1xuICAgICAgaWYgKGVxdWFsKGV4cGVjdGVkW2ldLCBhY3R1YWxbal0pKSB7XG4gICAgICAgIGZvdW5kID0gdHJ1ZTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuICAgIGlmICghZm91bmQpIHtcbiAgICAgIG1pc3NpbmcucHVzaChleHBlY3RlZFtpXSk7XG4gICAgfVxuICB9XG4gIGlmIChtaXNzaW5nLmxlbmd0aCA9PT0gMCkge1xuICAgIHJldHVybjtcbiAgfVxuICBpZiAoIW1zZykge1xuICAgIG1zZyA9IGBhY3R1YWw6IFwiJHtfZm9ybWF0KGFjdHVhbCl9XCIgZXhwZWN0ZWQgdG8gaW5jbHVkZTogXCIke1xuICAgICAgX2Zvcm1hdChleHBlY3RlZClcbiAgICB9XCJcXG5taXNzaW5nOiAke19mb3JtYXQobWlzc2luZyl9YDtcbiAgfVxuICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbn1cblxuLyoqXG4gKiBNYWtlIGFuIGFzc2VydGlvbiB0aGF0IGBhY3R1YWxgIG1hdGNoIFJlZ0V4cCBgZXhwZWN0ZWRgLiBJZiBub3RcbiAqIHRoZW4gdGhyb3duXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBhc3NlcnRNYXRjaChcbiAgYWN0dWFsOiBzdHJpbmcsXG4gIGV4cGVjdGVkOiBSZWdFeHAsXG4gIG1zZz86IHN0cmluZyxcbik6IHZvaWQge1xuICBpZiAoIWV4cGVjdGVkLnRlc3QoYWN0dWFsKSkge1xuICAgIGlmICghbXNnKSB7XG4gICAgICBtc2cgPSBgYWN0dWFsOiBcIiR7YWN0dWFsfVwiIGV4cGVjdGVkIHRvIG1hdGNoOiBcIiR7ZXhwZWN0ZWR9XCJgO1xuICAgIH1cbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbiAgfVxufVxuXG4vKipcbiAqIE1ha2UgYW4gYXNzZXJ0aW9uIHRoYXQgYGFjdHVhbGAgbm90IG1hdGNoIFJlZ0V4cCBgZXhwZWN0ZWRgLiBJZiBtYXRjaFxuICogdGhlbiB0aHJvd25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE5vdE1hdGNoKFxuICBhY3R1YWw6IHN0cmluZyxcbiAgZXhwZWN0ZWQ6IFJlZ0V4cCxcbiAgbXNnPzogc3RyaW5nLFxuKTogdm9pZCB7XG4gIGlmIChleHBlY3RlZC50ZXN0KGFjdHVhbCkpIHtcbiAgICBpZiAoIW1zZykge1xuICAgICAgbXNnID0gYGFjdHVhbDogXCIke2FjdHVhbH1cIiBleHBlY3RlZCB0byBub3QgbWF0Y2g6IFwiJHtleHBlY3RlZH1cImA7XG4gICAgfVxuICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICB9XG59XG5cbi8qKlxuICogTWFrZSBhbiBhc3NlcnRpb24gdGhhdCBgYWN0dWFsYCBvYmplY3QgaXMgYSBzdWJzZXQgb2YgYGV4cGVjdGVkYCBvYmplY3QsIGRlZXBseS5cbiAqIElmIG5vdCwgdGhlbiB0aHJvdy5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFzc2VydE9iamVjdE1hdGNoKFxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBhY3R1YWw6IFJlY29yZDxQcm9wZXJ0eUtleSwgYW55PixcbiAgZXhwZWN0ZWQ6IFJlY29yZDxQcm9wZXJ0eUtleSwgdW5rbm93bj4sXG4pOiB2b2lkIHtcbiAgdHlwZSBsb29zZSA9IFJlY29yZDxQcm9wZXJ0eUtleSwgdW5rbm93bj47XG4gIGNvbnN0IHNlZW4gPSBuZXcgV2Vha01hcCgpO1xuICByZXR1cm4gYXNzZXJ0RXF1YWxzKFxuICAgIChmdW5jdGlvbiBmaWx0ZXIoYTogbG9vc2UsIGI6IGxvb3NlKTogbG9vc2Uge1xuICAgICAgLy8gUHJldmVudCBpbmZpbml0ZSBsb29wIHdpdGggY2lyY3VsYXIgcmVmZXJlbmNlcyB3aXRoIHNhbWUgZmlsdGVyXG4gICAgICBpZiAoKHNlZW4uaGFzKGEpKSAmJiAoc2Vlbi5nZXQoYSkgPT09IGIpKSB7XG4gICAgICAgIHJldHVybiBhO1xuICAgICAgfVxuICAgICAgc2Vlbi5zZXQoYSwgYik7XG4gICAgICAvLyBGaWx0ZXIga2V5cyBhbmQgc3ltYm9scyB3aGljaCBhcmUgcHJlc2VudCBpbiBib3RoIGFjdHVhbCBhbmQgZXhwZWN0ZWRcbiAgICAgIGNvbnN0IGZpbHRlcmVkID0ge30gYXMgbG9vc2U7XG4gICAgICBjb25zdCBlbnRyaWVzID0gW1xuICAgICAgICAuLi5PYmplY3QuZ2V0T3duUHJvcGVydHlOYW1lcyhhKSxcbiAgICAgICAgLi4uT2JqZWN0LmdldE93blByb3BlcnR5U3ltYm9scyhhKSxcbiAgICAgIF1cbiAgICAgICAgLmZpbHRlcigoa2V5KSA9PiBrZXkgaW4gYilcbiAgICAgICAgLm1hcCgoa2V5KSA9PiBba2V5LCBhW2tleSBhcyBzdHJpbmddXSkgYXMgQXJyYXk8W3N0cmluZywgdW5rbm93bl0+O1xuICAgICAgZm9yIChjb25zdCBba2V5LCB2YWx1ZV0gb2YgZW50cmllcykge1xuICAgICAgICAvLyBPbiBhcnJheSByZWZlcmVuY2VzLCBidWlsZCBhIGZpbHRlcmVkIGFycmF5IGFuZCBmaWx0ZXIgbmVzdGVkIG9iamVjdHMgaW5zaWRlXG4gICAgICAgIGlmIChBcnJheS5pc0FycmF5KHZhbHVlKSkge1xuICAgICAgICAgIGNvbnN0IHN1YnNldCA9IChiIGFzIGxvb3NlKVtrZXldO1xuICAgICAgICAgIGlmIChBcnJheS5pc0FycmF5KHN1YnNldCkpIHtcbiAgICAgICAgICAgIGZpbHRlcmVkW2tleV0gPSB2YWx1ZVxuICAgICAgICAgICAgICAuc2xpY2UoMCwgc3Vic2V0Lmxlbmd0aClcbiAgICAgICAgICAgICAgLm1hcCgoZWxlbWVudCwgaW5kZXgpID0+IHtcbiAgICAgICAgICAgICAgICBjb25zdCBzdWJzZXRFbGVtZW50ID0gc3Vic2V0W2luZGV4XTtcbiAgICAgICAgICAgICAgICBpZiAoKHR5cGVvZiBzdWJzZXRFbGVtZW50ID09PSBcIm9iamVjdFwiKSAmJiAoc3Vic2V0RWxlbWVudCkpIHtcbiAgICAgICAgICAgICAgICAgIHJldHVybiBmaWx0ZXIoZWxlbWVudCwgc3Vic2V0RWxlbWVudCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHJldHVybiBlbGVtZW50O1xuICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfSAvLyBPbiBuZXN0ZWQgb2JqZWN0cyByZWZlcmVuY2VzLCBidWlsZCBhIGZpbHRlcmVkIG9iamVjdCByZWN1cnNpdmVseVxuICAgICAgICBlbHNlIGlmICh0eXBlb2YgdmFsdWUgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICBjb25zdCBzdWJzZXQgPSAoYiBhcyBsb29zZSlba2V5XTtcbiAgICAgICAgICBpZiAoKHR5cGVvZiBzdWJzZXQgPT09IFwib2JqZWN0XCIpICYmIChzdWJzZXQpKSB7XG4gICAgICAgICAgICBmaWx0ZXJlZFtrZXldID0gZmlsdGVyKHZhbHVlIGFzIGxvb3NlLCBzdWJzZXQgYXMgbG9vc2UpO1xuICAgICAgICAgICAgY29udGludWU7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGZpbHRlcmVkW2tleV0gPSB2YWx1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBmaWx0ZXJlZDtcbiAgICB9KShhY3R1YWwsIGV4cGVjdGVkKSxcbiAgICBleHBlY3RlZCxcbiAgKTtcbn1cblxuLyoqXG4gKiBGb3JjZWZ1bGx5IHRocm93cyBhIGZhaWxlZCBhc3NlcnRpb25cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZhaWwobXNnPzogc3RyaW5nKTogdm9pZCB7XG4gIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdXNlLWJlZm9yZS1kZWZpbmVcbiAgYXNzZXJ0KGZhbHNlLCBgRmFpbGVkIGFzc2VydGlvbiR7bXNnID8gYDogJHttc2d9YCA6IFwiLlwifWApO1xufVxuXG4vKipcbiAqIEV4ZWN1dGVzIGEgZnVuY3Rpb24sIGV4cGVjdGluZyBpdCB0byB0aHJvdy4gIElmIGl0IGRvZXMgbm90LCB0aGVuIGl0XG4gKiB0aHJvd3MuICBBbiBlcnJvciBjbGFzcyBhbmQgYSBzdHJpbmcgdGhhdCBzaG91bGQgYmUgaW5jbHVkZWQgaW4gdGhlXG4gKiBlcnJvciBtZXNzYWdlIGNhbiBhbHNvIGJlIGFzc2VydGVkLlxuICovXG5leHBvcnQgZnVuY3Rpb24gYXNzZXJ0VGhyb3dzPFQgPSB2b2lkPihcbiAgZm46ICgpID0+IFQsXG4gIEVycm9yQ2xhc3M/OiBDb25zdHJ1Y3RvcixcbiAgbXNnSW5jbHVkZXMgPSBcIlwiLFxuICBtc2c/OiBzdHJpbmcsXG4pOiBFcnJvciB7XG4gIGxldCBkb2VzVGhyb3cgPSBmYWxzZTtcbiAgbGV0IGVycm9yID0gbnVsbDtcbiAgdHJ5IHtcbiAgICBmbigpO1xuICB9IGNhdGNoIChlKSB7XG4gICAgaWYgKGUgaW5zdGFuY2VvZiBFcnJvciA9PT0gZmFsc2UpIHtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihcIkEgbm9uLUVycm9yIG9iamVjdCB3YXMgdGhyb3duLlwiKTtcbiAgICB9XG4gICAgaWYgKEVycm9yQ2xhc3MgJiYgIShlIGluc3RhbmNlb2YgRXJyb3JDbGFzcykpIHtcbiAgICAgIG1zZyA9XG4gICAgICAgIGBFeHBlY3RlZCBlcnJvciB0byBiZSBpbnN0YW5jZSBvZiBcIiR7RXJyb3JDbGFzcy5uYW1lfVwiLCBidXQgd2FzIFwiJHtlLmNvbnN0cnVjdG9yLm5hbWV9XCIke1xuICAgICAgICAgIG1zZyA/IGA6ICR7bXNnfWAgOiBcIi5cIlxuICAgICAgICB9YDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICAgIH1cbiAgICBpZiAoXG4gICAgICBtc2dJbmNsdWRlcyAmJlxuICAgICAgIXN0cmlwQ29sb3IoZS5tZXNzYWdlKS5pbmNsdWRlcyhzdHJpcENvbG9yKG1zZ0luY2x1ZGVzKSlcbiAgICApIHtcbiAgICAgIG1zZyA9XG4gICAgICAgIGBFeHBlY3RlZCBlcnJvciBtZXNzYWdlIHRvIGluY2x1ZGUgXCIke21zZ0luY2x1ZGVzfVwiLCBidXQgZ290IFwiJHtlLm1lc3NhZ2V9XCIke1xuICAgICAgICAgIG1zZyA/IGA6ICR7bXNnfWAgOiBcIi5cIlxuICAgICAgICB9YDtcbiAgICAgIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cpO1xuICAgIH1cbiAgICBkb2VzVGhyb3cgPSB0cnVlO1xuICAgIGVycm9yID0gZTtcbiAgfVxuICBpZiAoIWRvZXNUaHJvdykge1xuICAgIG1zZyA9IGBFeHBlY3RlZCBmdW5jdGlvbiB0byB0aHJvdyR7bXNnID8gYDogJHttc2d9YCA6IFwiLlwifWA7XG4gICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG4gIH1cbiAgcmV0dXJuIGVycm9yO1xufVxuXG4vKipcbiAqIEV4ZWN1dGVzIGEgZnVuY3Rpb24gd2hpY2ggcmV0dXJucyBhIHByb21pc2UsIGV4cGVjdGluZyBpdCB0byB0aHJvdyBvciByZWplY3QuXG4gKiBJZiBpdCBkb2VzIG5vdCwgdGhlbiBpdCB0aHJvd3MuICBBbiBlcnJvciBjbGFzcyBhbmQgYSBzdHJpbmcgdGhhdCBzaG91bGQgYmVcbiAqIGluY2x1ZGVkIGluIHRoZSBlcnJvciBtZXNzYWdlIGNhbiBhbHNvIGJlIGFzc2VydGVkLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gYXNzZXJ0VGhyb3dzQXN5bmM8VCA9IHZvaWQ+KFxuICBmbjogKCkgPT4gUHJvbWlzZTxUPixcbiAgRXJyb3JDbGFzcz86IENvbnN0cnVjdG9yLFxuICBtc2dJbmNsdWRlcyA9IFwiXCIsXG4gIG1zZz86IHN0cmluZyxcbik6IFByb21pc2U8RXJyb3I+IHtcbiAgbGV0IGRvZXNUaHJvdyA9IGZhbHNlO1xuICBsZXQgZXJyb3IgPSBudWxsO1xuICB0cnkge1xuICAgIGF3YWl0IGZuKCk7XG4gIH0gY2F0Y2ggKGUpIHtcbiAgICBpZiAoZSBpbnN0YW5jZW9mIEVycm9yID09PSBmYWxzZSkge1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKFwiQSBub24tRXJyb3Igb2JqZWN0IHdhcyB0aHJvd24gb3IgcmVqZWN0ZWQuXCIpO1xuICAgIH1cbiAgICBpZiAoRXJyb3JDbGFzcyAmJiAhKGUgaW5zdGFuY2VvZiBFcnJvckNsYXNzKSkge1xuICAgICAgbXNnID1cbiAgICAgICAgYEV4cGVjdGVkIGVycm9yIHRvIGJlIGluc3RhbmNlIG9mIFwiJHtFcnJvckNsYXNzLm5hbWV9XCIsIGJ1dCBnb3QgXCIke2UubmFtZX1cIiR7XG4gICAgICAgICAgbXNnID8gYDogJHttc2d9YCA6IFwiLlwiXG4gICAgICAgIH1gO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG4gICAgfVxuICAgIGlmIChcbiAgICAgIG1zZ0luY2x1ZGVzICYmXG4gICAgICAhc3RyaXBDb2xvcihlLm1lc3NhZ2UpLmluY2x1ZGVzKHN0cmlwQ29sb3IobXNnSW5jbHVkZXMpKVxuICAgICkge1xuICAgICAgbXNnID1cbiAgICAgICAgYEV4cGVjdGVkIGVycm9yIG1lc3NhZ2UgdG8gaW5jbHVkZSBcIiR7bXNnSW5jbHVkZXN9XCIsIGJ1dCBnb3QgXCIke2UubWVzc2FnZX1cIiR7XG4gICAgICAgICAgbXNnID8gYDogJHttc2d9YCA6IFwiLlwiXG4gICAgICAgIH1gO1xuICAgICAgdGhyb3cgbmV3IEFzc2VydGlvbkVycm9yKG1zZyk7XG4gICAgfVxuICAgIGRvZXNUaHJvdyA9IHRydWU7XG4gICAgZXJyb3IgPSBlO1xuICB9XG4gIGlmICghZG9lc1Rocm93KSB7XG4gICAgbXNnID0gYEV4cGVjdGVkIGZ1bmN0aW9uIHRvIHRocm93JHttc2cgPyBgOiAke21zZ31gIDogXCIuXCJ9YDtcbiAgICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IobXNnKTtcbiAgfVxuICByZXR1cm4gZXJyb3I7XG59XG5cbi8qKiBVc2UgdGhpcyB0byBzdHViIG91dCBtZXRob2RzIHRoYXQgd2lsbCB0aHJvdyB3aGVuIGludm9rZWQuICovXG5leHBvcnQgZnVuY3Rpb24gdW5pbXBsZW1lbnRlZChtc2c/OiBzdHJpbmcpOiBuZXZlciB7XG4gIHRocm93IG5ldyBBc3NlcnRpb25FcnJvcihtc2cgfHwgXCJ1bmltcGxlbWVudGVkXCIpO1xufVxuXG4vKiogVXNlIHRoaXMgdG8gYXNzZXJ0IHVucmVhY2hhYmxlIGNvZGUuICovXG5leHBvcnQgZnVuY3Rpb24gdW5yZWFjaGFibGUoKTogbmV2ZXIge1xuICB0aHJvdyBuZXcgQXNzZXJ0aW9uRXJyb3IoXCJ1bnJlYWNoYWJsZVwiKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUEwRSxBQUExRSx3RUFBMEU7QUFDMUUsRUFBOEUsQUFBOUUsNEVBQThFO0FBQzlFLEVBQTJDLEFBQTNDLHlDQUEyQztBQUUzQyxNQUFNLEdBQUcsSUFBSSxFQUFFLElBQUksRUFBRSxLQUFLLEVBQUUsR0FBRyxFQUFFLFVBQVUsRUFBRSxLQUFLLFFBQVEsQ0FBa0I7QUFDNUUsTUFBTSxHQUFHLElBQUksRUFBYyxRQUFRLFFBQVEsQ0FBWTtBQUV2RCxLQUFLLENBQUMsZUFBZSxHQUFHLENBQWtCO0FBTzFDLE1BQU0sT0FBTyxjQUFjLFNBQVMsS0FBSztnQkFDM0IsT0FBZSxDQUFFLENBQUM7UUFDNUIsS0FBSyxDQUFDLE9BQU87UUFDYixJQUFJLENBQUMsSUFBSSxHQUFHLENBQWdCO0lBQzlCLENBQUM7O0FBR0gsRUFJRyxBQUpIOzs7O0NBSUcsQUFKSCxFQUlHLENBQ0gsTUFBTSxVQUFVLE9BQU8sQ0FBQyxD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