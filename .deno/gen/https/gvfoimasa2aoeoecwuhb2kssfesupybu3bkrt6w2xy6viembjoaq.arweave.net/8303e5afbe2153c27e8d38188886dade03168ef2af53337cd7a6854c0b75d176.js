// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
// This module is browser compatible.
import { isWindows, osType } from "../_util/os.ts";
import { SEP, SEP_PATTERN } from "./separator.ts";
import * as _win32 from "./win32.ts";
import * as _posix from "./posix.ts";
const path = isWindows ? _win32 : _posix;
const { join , normalize  } = path;
// deno-fmt-ignore
const regExpEscapeChars = [
    "!",
    "$",
    "(",
    ")",
    "*",
    "+",
    ".",
    "=",
    "?",
    "[",
    "\\",
    "^",
    "{",
    "|"
];
const rangeEscapeChars = [
    "-",
    "\\",
    "]"
];
/** Convert a glob string to a regular expression.
 *
 * Tries to match bash glob expansion as closely as possible.
 *
 * Basic glob syntax:
 * - `*` - Matches everything without leaving the path segment.
 * - `{foo,bar}` - Matches `foo` or `bar`.
 * - `[abcd]` - Matches `a`, `b`, `c` or `d`.
 * - `[a-d]` - Matches `a`, `b`, `c` or `d`.
 * - `[!abcd]` - Matches any single character besides `a`, `b`, `c` or `d`.
 * - `[[:<class>:]]` - Matches any character belonging to `<class>`.
 *     - `[[:alnum:]]` - Matches any digit or letter.
 *     - `[[:digit:]abc]` - Matches any digit, `a`, `b` or `c`.
 *     - See https://facelessuser.github.io/wcmatch/glob/#posix-character-classes
 *       for a complete list of supported character classes.
 * - `\` - Escapes the next character for an `os` other than `"windows"`.
 * - \` - Escapes the next character for `os` set to `"windows"`.
 * - `/` - Path separator.
 * - `\` - Additional path separator only for `os` set to `"windows"`.
 *
 * Extended syntax:
 * - Requires `{ extended: true }`.
 * - `?(foo|bar)` - Matches 0 or 1 instance of `{foo,bar}`.
 * - `@(foo|bar)` - Matches 1 instance of `{foo,bar}`. They behave the same.
 * - `*(foo|bar)` - Matches _n_ instances of `{foo,bar}`.
 * - `+(foo|bar)` - Matches _n > 0_ instances of `{foo,bar}`.
 * - `!(foo|bar)` - Matches anything other than `{foo,bar}`.
 * - See https://www.linuxjournal.com/content/bash-extended-globbing.
 *
 * Globstar syntax:
 * - Requires `{ globstar: true }`.
 * - `**` - Matches any number of any path segments.
 *     - Must comprise its entire path segment in the provided glob.
 * - See https://www.linuxjournal.com/content/globstar-new-bash-globbing-option.
 *
 * Note the following properties:
 * - The generated `RegExp` is anchored at both start and end.
 * - Repeating and trailing separators are tolerated. Trailing separators in the
 *   provided glob have no meaning and are discarded.
 * - Absolute globs will only match absolute paths, etc.
 * - Empty globs will match nothing.
 * - Any special glob syntax must be contained to one path segment. For example,
 *   `?(foo|bar/baz)` is invalid. The separator will take precendence and the
 *   first segment ends with an unclosed group.
 * - If a path segment ends with unclosed groups or a dangling escape prefix, a
 *   parse error has occured. Every character for that segment is taken
 *   literally in this event.
 *
 * Limitations:
 * - A negative group like `!(foo|bar)` will wrongly be converted to a negative
 *   look-ahead followed by a wildcard. This means that `!(foo).js` will wrongly
 *   fail to match `foobar.js`, even though `foobar` is not `foo`. Effectively,
 *   `!(foo|bar)` is treated like `!(@(foo|bar)*)`. This will work correctly if
 *   the group occurs not nested at the end of the segment. */ export function globToRegExp(glob, { extended =true , globstar: globstarOption = true , os =osType , caseInsensitive =false  } = {
}) {
    if (glob == "") {
        return /(?!)/;
    }
    const sep = os == "windows" ? "(?:\\\\|/)+" : "/+";
    const sepMaybe = os == "windows" ? "(?:\\\\|/)*" : "/*";
    const seps = os == "windows" ? [
        "\\",
        "/"
    ] : [
        "/"
    ];
    const globstar = os == "windows" ? "(?:[^\\\\/]*(?:\\\\|/|$)+)*" : "(?:[^/]*(?:/|$)+)*";
    const wildcard = os == "windows" ? "[^\\\\/]*" : "[^/]*";
    const escapePrefix = os == "windows" ? "`" : "\\";
    // Remove trailing separators.
    let newLength = glob.length;
    for(; newLength > 1 && seps.includes(glob[newLength - 1]); newLength--);
    glob = glob.slice(0, newLength);
    let regExpString = "";
    // Terminates correctly. Trust that `j` is incremented every iteration.
    for(let j = 0; j < glob.length;){
        let segment = "";
        const groupStack = [];
        let inRange = false;
        let inEscape = false;
        let endsWithSep = false;
        let i = j;
        // Terminates with `i` at the non-inclusive end of the current segment.
        for(; i < glob.length && !seps.includes(glob[i]); i++){
            if (inEscape) {
                inEscape = false;
                const escapeChars = inRange ? rangeEscapeChars : regExpEscapeChars;
                segment += escapeChars.includes(glob[i]) ? `\\${glob[i]}` : glob[i];
                continue;
            }
            if (glob[i] == escapePrefix) {
                inEscape = true;
                continue;
            }
            if (glob[i] == "[") {
                if (!inRange) {
                    inRange = true;
                    segment += "[";
                    if (glob[i + 1] == "!") {
                        i++;
                        segment += "^";
                    } else if (glob[i + 1] == "^") {
                        i++;
                        segment += "\\^";
                    }
                    continue;
                } else if (glob[i + 1] == ":") {
                    let k = i + 1;
                    let value = "";
                    while(glob[k + 1] != null && glob[k + 1] != ":"){
                        value += glob[k + 1];
                        k++;
                    }
                    if (glob[k + 1] == ":" && glob[k + 2] == "]") {
                        i = k + 2;
                        if (value == "alnum") segment += "\\dA-Za-z";
                        else if (value == "alpha") segment += "A-Za-z";
                        else if (value == "ascii") segment += "\x00-\x7F";
                        else if (value == "blank") segment += "\t ";
                        else if (value == "cntrl") segment += "\x00-\x1F\x7F";
                        else if (value == "digit") segment += "\\d";
                        else if (value == "graph") segment += "\x21-\x7E";
                        else if (value == "lower") segment += "a-z";
                        else if (value == "print") segment += "\x20-\x7E";
                        else if (value == "punct") {
                            segment += "!\"#$%&'()*+,\\-./:;<=>?@[\\\\\\]^_‘{|}~";
                        } else if (value == "space") segment += "\\s\v";
                        else if (value == "upper") segment += "A-Z";
                        else if (value == "word") segment += "\\w";
                        else if (value == "xdigit") segment += "\\dA-Fa-f";
                        continue;
                    }
                }
            }
            if (glob[i] == "]" && inRange) {
                inRange = false;
                segment += "]";
                continue;
            }
            if (inRange) {
                if (glob[i] == "\\") {
                    segment += `\\\\`;
                } else {
                    segment += glob[i];
                }
                continue;
            }
            if (glob[i] == ")" && groupStack.length > 0 && groupStack[groupStack.length - 1] != "BRACE") {
                segment += ")";
                const type = groupStack.pop();
                if (type == "!") {
                    segment += wildcard;
                } else if (type != "@") {
                    segment += type;
                }
                continue;
            }
            if (glob[i] == "|" && groupStack.length > 0 && groupStack[groupStack.length - 1] != "BRACE") {
                segment += "|";
                continue;
            }
            if (glob[i] == "+" && extended && glob[i + 1] == "(") {
                i++;
                groupStack.push("+");
                segment += "(?:";
                continue;
            }
            if (glob[i] == "@" && extended && glob[i + 1] == "(") {
                i++;
                groupStack.push("@");
                segment += "(?:";
                continue;
            }
            if (glob[i] == "?") {
                if (extended && glob[i + 1] == "(") {
                    i++;
                    groupStack.push("?");
                    segment += "(?:";
                } else {
                    segment += ".";
                }
                continue;
            }
            if (glob[i] == "!" && extended && glob[i + 1] == "(") {
                i++;
                groupStack.push("!");
                segment += "(?!";
                continue;
            }
            if (glob[i] == "{") {
                groupStack.push("BRACE");
                segment += "(?:";
                continue;
            }
            if (glob[i] == "}" && groupStack[groupStack.length - 1] == "BRACE") {
                groupStack.pop();
                segment += ")";
                continue;
            }
            if (glob[i] == "," && groupStack[groupStack.length - 1] == "BRACE") {
                segment += "|";
                continue;
            }
            if (glob[i] == "*") {
                if (extended && glob[i + 1] == "(") {
                    i++;
                    groupStack.push("*");
                    segment += "(?:";
                } else {
                    const prevChar = glob[i - 1];
                    let numStars = 1;
                    while(glob[i + 1] == "*"){
                        i++;
                        numStars++;
                    }
                    const nextChar = glob[i + 1];
                    if (globstarOption && numStars == 2 && [
                        ...seps,
                        undefined
                    ].includes(prevChar) && [
                        ...seps,
                        undefined
                    ].includes(nextChar)) {
                        segment += globstar;
                        endsWithSep = true;
                    } else {
                        segment += wildcard;
                    }
                }
                continue;
            }
            segment += regExpEscapeChars.includes(glob[i]) ? `\\${glob[i]}` : glob[i];
        }
        // Check for unclosed groups or a dangling backslash.
        if (groupStack.length > 0 || inRange || inEscape) {
            // Parse failure. Take all characters from this segment literally.
            segment = "";
            for (const c of glob.slice(j, i)){
                segment += regExpEscapeChars.includes(c) ? `\\${c}` : c;
                endsWithSep = false;
            }
        }
        regExpString += segment;
        if (!endsWithSep) {
            regExpString += i < glob.length ? sep : sepMaybe;
            endsWithSep = true;
        }
        // Terminates with `i` at the start of the next segment.
        while(seps.includes(glob[i]))i++;
        // Check that the next value of `j` is indeed higher than the current value.
        if (!(i > j)) {
            throw new Error("Assertion failure: i > j (potential infinite loop)");
        }
        j = i;
    }
    regExpString = `^${regExpString}$`;
    return new RegExp(regExpString, caseInsensitive ? "i" : "");
}
/** Test whether the given string is a glob */ export function isGlob(str) {
    const chars = {
        "{": "}",
        "(": ")",
        "[": "]"
    };
    const regex = /\\(.)|(^!|\*|[\].+)]\?|\[[^\\\]]+\]|\{[^\\}]+\}|\(\?[:!=][^\\)]+\)|\([^|]+\|[^\\)]+\))/;
    if (str === "") {
        return false;
    }
    let match;
    while(match = regex.exec(str)){
        if (match[2]) return true;
        let idx = match.index + match[0].length;
        // if an open bracket/brace/paren is escaped,
        // set the index to the next closing character
        const open = match[1];
        const close = open ? chars[open] : null;
        if (open && close) {
            const n = str.indexOf(close, idx);
            if (n !== -1) {
                idx = n + 1;
            }
        }
        str = str.slice(idx);
    }
    return false;
}
/** Like normalize(), but doesn't collapse "**\/.." when `globstar` is true. */ export function normalizeGlob(glob, { globstar =false  } = {
}) {
    if (glob.match(/\0/g)) {
        throw new Error(`Glob contains invalid characters: "${glob}"`);
    }
    if (!globstar) {
        return normalize(glob);
    }
    const s = SEP_PATTERN.source;
    const badParentPattern = new RegExp(`(?<=(${s}|^)\\*\\*${s})\\.\\.(?=${s}|$)`, "g");
    return normalize(glob.replace(badParentPattern, "\0")).replace(/\0/g, "..");
}
/** Like join(), but doesn't collapse "**\/.." when `globstar` is true. */ export function joinGlobs(globs, { extended =false , globstar =false  } = {
}) {
    if (!globstar || globs.length == 0) {
        return join(...globs);
    }
    if (globs.length === 0) return ".";
    let joined;
    for (const glob of globs){
        const path = glob;
        if (path.length > 0) {
            if (!joined) joined = path;
            else joined += `${SEP}${path}`;
        }
    }
    if (!joined) return ".";
    return normalizeGlob(joined, {
        extended,
        globstar
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZ3Zmb2ltYXNhMmFvZW9lY3d1aGIya3NzZmVzdXB5YnUzYmtydDZ3Mnh5NnZpZW1iam9hcS5hcndlYXZlLm5ldC9OVXJrTUJJR2dPSTRnclVPSFNwU0tTVkg0RFRZVlJuNjJyNDlWQkdCUzRFL3BhdGgvZ2xvYi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgeyBpc1dpbmRvd3MsIG9zVHlwZSB9IGZyb20gXCIuLi9fdXRpbC9vcy50c1wiO1xuaW1wb3J0IHsgU0VQLCBTRVBfUEFUVEVSTiB9IGZyb20gXCIuL3NlcGFyYXRvci50c1wiO1xuaW1wb3J0ICogYXMgX3dpbjMyIGZyb20gXCIuL3dpbjMyLnRzXCI7XG5pbXBvcnQgKiBhcyBfcG9zaXggZnJvbSBcIi4vcG9zaXgudHNcIjtcblxuY29uc3QgcGF0aCA9IGlzV2luZG93cyA/IF93aW4zMiA6IF9wb3NpeDtcbmNvbnN0IHsgam9pbiwgbm9ybWFsaXplIH0gPSBwYXRoO1xuXG5leHBvcnQgaW50ZXJmYWNlIEdsb2JPcHRpb25zIHtcbiAgLyoqIEV4dGVuZGVkIGdsb2Igc3ludGF4LlxuICAgKiBTZWUgaHR0cHM6Ly93d3cubGludXhqb3VybmFsLmNvbS9jb250ZW50L2Jhc2gtZXh0ZW5kZWQtZ2xvYmJpbmcuIERlZmF1bHRzXG4gICAqIHRvIHRydWUuICovXG4gIGV4dGVuZGVkPzogYm9vbGVhbjtcbiAgLyoqIEdsb2JzdGFyIHN5bnRheC5cbiAgICogU2VlIGh0dHBzOi8vd3d3LmxpbnV4am91cm5hbC5jb20vY29udGVudC9nbG9ic3Rhci1uZXctYmFzaC1nbG9iYmluZy1vcHRpb24uXG4gICAqIElmIGZhbHNlLCBgKipgIGlzIHRyZWF0ZWQgbGlrZSBgKmAuIERlZmF1bHRzIHRvIHRydWUuICovXG4gIGdsb2JzdGFyPzogYm9vbGVhbjtcbiAgLyoqIFdoZXRoZXIgZ2xvYnN0YXIgc2hvdWxkIGJlIGNhc2UgaW5zZW5zaXRpdmUuICovXG4gIGNhc2VJbnNlbnNpdGl2ZT86IGJvb2xlYW47XG4gIC8qKiBPcGVyYXRpbmcgc3lzdGVtLiBEZWZhdWx0cyB0byB0aGUgbmF0aXZlIE9TLiAqL1xuICBvcz86IHR5cGVvZiBEZW5vLmJ1aWxkLm9zO1xufVxuXG5leHBvcnQgdHlwZSBHbG9iVG9SZWdFeHBPcHRpb25zID0gR2xvYk9wdGlvbnM7XG5cbi8vIGRlbm8tZm10LWlnbm9yZVxuY29uc3QgcmVnRXhwRXNjYXBlQ2hhcnMgPSBbXCIhXCIsIFwiJFwiLCBcIihcIiwgXCIpXCIsIFwiKlwiLCBcIitcIiwgXCIuXCIsIFwiPVwiLCBcIj9cIiwgXCJbXCIsIFwiXFxcXFwiLCBcIl5cIiwgXCJ7XCIsIFwifFwiXTtcbmNvbnN0IHJhbmdlRXNjYXBlQ2hhcnMgPSBbXCItXCIsIFwiXFxcXFwiLCBcIl1cIl07XG5cbi8qKiBDb252ZXJ0IGEgZ2xvYiBzdHJpbmcgdG8gYSByZWd1bGFyIGV4cHJlc3Npb24uXG4gKlxuICogVHJpZXMgdG8gbWF0Y2ggYmFzaCBnbG9iIGV4cGFuc2lvbiBhcyBjbG9zZWx5IGFzIHBvc3NpYmxlLlxuICpcbiAqIEJhc2ljIGdsb2Igc3ludGF4OlxuICogLSBgKmAgLSBNYXRjaGVzIGV2ZXJ5dGhpbmcgd2l0aG91dCBsZWF2aW5nIHRoZSBwYXRoIHNlZ21lbnQuXG4gKiAtIGB7Zm9vLGJhcn1gIC0gTWF0Y2hlcyBgZm9vYCBvciBgYmFyYC5cbiAqIC0gYFthYmNkXWAgLSBNYXRjaGVzIGBhYCwgYGJgLCBgY2Agb3IgYGRgLlxuICogLSBgW2EtZF1gIC0gTWF0Y2hlcyBgYWAsIGBiYCwgYGNgIG9yIGBkYC5cbiAqIC0gYFshYWJjZF1gIC0gTWF0Y2hlcyBhbnkgc2luZ2xlIGNoYXJhY3RlciBiZXNpZGVzIGBhYCwgYGJgLCBgY2Agb3IgYGRgLlxuICogLSBgW1s6PGNsYXNzPjpdXWAgLSBNYXRjaGVzIGFueSBjaGFyYWN0ZXIgYmVsb25naW5nIHRvIGA8Y2xhc3M+YC5cbiAqICAgICAtIGBbWzphbG51bTpdXWAgLSBNYXRjaGVzIGFueSBkaWdpdCBvciBsZXR0ZXIuXG4gKiAgICAgLSBgW1s6ZGlnaXQ6XWFiY11gIC0gTWF0Y2hlcyBhbnkgZGlnaXQsIGBhYCwgYGJgIG9yIGBjYC5cbiAqICAgICAtIFNlZSBodHRwczovL2ZhY2VsZXNzdXNlci5naXRodWIuaW8vd2NtYXRjaC9nbG9iLyNwb3NpeC1jaGFyYWN0ZXItY2xhc3Nlc1xuICogICAgICAgZm9yIGEgY29tcGxldGUgbGlzdCBvZiBzdXBwb3J0ZWQgY2hhcmFjdGVyIGNsYXNzZXMuXG4gKiAtIGBcXGAgLSBFc2NhcGVzIHRoZSBuZXh0IGNoYXJhY3RlciBmb3IgYW4gYG9zYCBvdGhlciB0aGFuIGBcIndpbmRvd3NcImAuXG4gKiAtIFxcYCAtIEVzY2FwZXMgdGhlIG5leHQgY2hhcmFjdGVyIGZvciBgb3NgIHNldCB0byBgXCJ3aW5kb3dzXCJgLlxuICogLSBgL2AgLSBQYXRoIHNlcGFyYXRvci5cbiAqIC0gYFxcYCAtIEFkZGl0aW9uYWwgcGF0aCBzZXBhcmF0b3Igb25seSBmb3IgYG9zYCBzZXQgdG8gYFwid2luZG93c1wiYC5cbiAqXG4gKiBFeHRlbmRlZCBzeW50YXg6XG4gKiAtIFJlcXVpcmVzIGB7IGV4dGVuZGVkOiB0cnVlIH1gLlxuICogLSBgPyhmb298YmFyKWAgLSBNYXRjaGVzIDAgb3IgMSBpbnN0YW5jZSBvZiBge2ZvbyxiYXJ9YC5cbiAqIC0gYEAoZm9vfGJhcilgIC0gTWF0Y2hlcyAxIGluc3RhbmNlIG9mIGB7Zm9vLGJhcn1gLiBUaGV5IGJlaGF2ZSB0aGUgc2FtZS5cbiAqIC0gYCooZm9vfGJhcilgIC0gTWF0Y2hlcyBfbl8gaW5zdGFuY2VzIG9mIGB7Zm9vLGJhcn1gLlxuICogLSBgKyhmb298YmFyKWAgLSBNYXRjaGVzIF9uID4gMF8gaW5zdGFuY2VzIG9mIGB7Zm9vLGJhcn1gLlxuICogLSBgIShmb298YmFyKWAgLSBNYXRjaGVzIGFueXRoaW5nIG90aGVyIHRoYW4gYHtmb28sYmFyfWAuXG4gKiAtIFNlZSBodHRwczovL3d3dy5saW51eGpvdXJuYWwuY29tL2NvbnRlbnQvYmFzaC1leHRlbmRlZC1nbG9iYmluZy5cbiAqXG4gKiBHbG9ic3RhciBzeW50YXg6XG4gKiAtIFJlcXVpcmVzIGB7IGdsb2JzdGFyOiB0cnVlIH1gLlxuICogLSBgKipgIC0gTWF0Y2hlcyBhbnkgbnVtYmVyIG9mIGFueSBwYXRoIHNlZ21lbnRzLlxuICogICAgIC0gTXVzdCBjb21wcmlzZSBpdHMgZW50aXJlIHBhdGggc2VnbWVudCBpbiB0aGUgcHJvdmlkZWQgZ2xvYi5cbiAqIC0gU2VlIGh0dHBzOi8vd3d3LmxpbnV4am91cm5hbC5jb20vY29udGVudC9nbG9ic3Rhci1uZXctYmFzaC1nbG9iYmluZy1vcHRpb24uXG4gKlxuICogTm90ZSB0aGUgZm9sbG93aW5nIHByb3BlcnRpZXM6XG4gKiAtIFRoZSBnZW5lcmF0ZWQgYFJlZ0V4cGAgaXMgYW5jaG9yZWQgYXQgYm90aCBzdGFydCBhbmQgZW5kLlxuICogLSBSZXBlYXRpbmcgYW5kIHRyYWlsaW5nIHNlcGFyYXRvcnMgYXJlIHRvbGVyYXRlZC4gVHJhaWxpbmcgc2VwYXJhdG9ycyBpbiB0aGVcbiAqICAgcHJvdmlkZWQgZ2xvYiBoYXZlIG5vIG1lYW5pbmcgYW5kIGFyZSBkaXNjYXJkZWQuXG4gKiAtIEFic29sdXRlIGdsb2JzIHdpbGwgb25seSBtYXRjaCBhYnNvbHV0ZSBwYXRocywgZXRjLlxuICogLSBFbXB0eSBnbG9icyB3aWxsIG1hdGNoIG5vdGhpbmcuXG4gKiAtIEFueSBzcGVjaWFsIGdsb2Igc3ludGF4IG11c3QgYmUgY29udGFpbmVkIHRvIG9uZSBwYXRoIHNlZ21lbnQuIEZvciBleGFtcGxlLFxuICogICBgPyhmb298YmFyL2JheilgIGlzIGludmFsaWQuIFRoZSBzZXBhcmF0b3Igd2lsbCB0YWtlIHByZWNlbmRlbmNlIGFuZCB0aGVcbiAqICAgZmlyc3Qgc2VnbWVudCBlbmRzIHdpdGggYW4gdW5jbG9zZWQgZ3JvdXAuXG4gKiAtIElmIGEgcGF0aCBzZWdtZW50IGVuZHMgd2l0aCB1bmNsb3NlZCBncm91cHMgb3IgYSBkYW5nbGluZyBlc2NhcGUgcHJlZml4LCBhXG4gKiAgIHBhcnNlIGVycm9yIGhhcyBvY2N1cmVkLiBFdmVyeSBjaGFyYWN0ZXIgZm9yIHRoYXQgc2VnbWVudCBpcyB0YWtlblxuICogICBsaXRlcmFsbHkgaW4gdGhpcyBldmVudC5cbiAqXG4gKiBMaW1pdGF0aW9uczpcbiAqIC0gQSBuZWdhdGl2ZSBncm91cCBsaWtlIGAhKGZvb3xiYXIpYCB3aWxsIHdyb25nbHkgYmUgY29udmVydGVkIHRvIGEgbmVnYXRpdmVcbiAqICAgbG9vay1haGVhZCBmb2xsb3dlZCBieSBhIHdpbGRjYXJkLiBUaGlzIG1lYW5zIHRoYXQgYCEoZm9vKS5qc2Agd2lsbCB3cm9uZ2x5XG4gKiAgIGZhaWwgdG8gbWF0Y2ggYGZvb2Jhci5qc2AsIGV2ZW4gdGhvdWdoIGBmb29iYXJgIGlzIG5vdCBgZm9vYC4gRWZmZWN0aXZlbHksXG4gKiAgIGAhKGZvb3xiYXIpYCBpcyB0cmVhdGVkIGxpa2UgYCEoQChmb298YmFyKSopYC4gVGhpcyB3aWxsIHdvcmsgY29ycmVjdGx5IGlmXG4gKiAgIHRoZSBncm91cCBvY2N1cnMgbm90IG5lc3RlZCBhdCB0aGUgZW5kIG9mIHRoZSBzZWdtZW50LiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdsb2JUb1JlZ0V4cChcbiAgZ2xvYjogc3RyaW5nLFxuICB7XG4gICAgZXh0ZW5kZWQgPSB0cnVlLFxuICAgIGdsb2JzdGFyOiBnbG9ic3Rhck9wdGlvbiA9IHRydWUsXG4gICAgb3MgPSBvc1R5cGUsXG4gICAgY2FzZUluc2Vuc2l0aXZlID0gZmFsc2UsXG4gIH06IEdsb2JUb1JlZ0V4cE9wdGlvbnMgPSB7fSxcbik6IFJlZ0V4cCB7XG4gIGlmIChnbG9iID09IFwiXCIpIHtcbiAgICByZXR1cm4gLyg/ISkvO1xuICB9XG5cbiAgY29uc3Qgc2VwID0gb3MgPT0gXCJ3aW5kb3dzXCIgPyBcIig/OlxcXFxcXFxcfC8pK1wiIDogXCIvK1wiO1xuICBjb25zdCBzZXBNYXliZSA9IG9zID09IFwid2luZG93c1wiID8gXCIoPzpcXFxcXFxcXHwvKSpcIiA6IFwiLypcIjtcbiAgY29uc3Qgc2VwcyA9IG9zID09IFwid2luZG93c1wiID8gW1wiXFxcXFwiLCBcIi9cIl0gOiBbXCIvXCJdO1xuICBjb25zdCBnbG9ic3RhciA9IG9zID09IFwid2luZG93c1wiXG4gICAgPyBcIig/OlteXFxcXFxcXFwvXSooPzpcXFxcXFxcXHwvfCQpKykqXCJcbiAgICA6IFwiKD86W14vXSooPzovfCQpKykqXCI7XG4gIGNvbnN0IHdpbGRjYXJkID0gb3MgPT0gXCJ3aW5kb3dzXCIgPyBcIlteXFxcXFxcXFwvXSpcIiA6IFwiW14vXSpcIjtcbiAgY29uc3QgZXNjYXBlUHJlZml4ID0gb3MgPT0gXCJ3aW5kb3dzXCIgPyBcImBcIiA6IFwiXFxcXFwiO1xuXG4gIC8vIFJlbW92ZSB0cmFpbGluZyBzZXBhcmF0b3JzLlxuICBsZXQgbmV3TGVuZ3RoID0gZ2xvYi5sZW5ndGg7XG4gIGZvciAoOyBuZXdMZW5ndGggPiAxICYmIHNlcHMuaW5jbHVkZXMoZ2xvYltuZXdMZW5ndGggLSAxXSk7IG5ld0xlbmd0aC0tKTtcbiAgZ2xvYiA9IGdsb2Iuc2xpY2UoMCwgbmV3TGVuZ3RoKTtcblxuICBsZXQgcmVnRXhwU3RyaW5nID0gXCJcIjtcblxuICAvLyBUZXJtaW5hdGVzIGNvcnJlY3RseS4gVHJ1c3QgdGhhdCBgamAgaXMgaW5jcmVtZW50ZWQgZXZlcnkgaXRlcmF0aW9uLlxuICBmb3IgKGxldCBqID0gMDsgaiA8IGdsb2IubGVuZ3RoOykge1xuICAgIGxldCBzZWdtZW50ID0gXCJcIjtcbiAgICBjb25zdCBncm91cFN0YWNrID0gW107XG4gICAgbGV0IGluUmFuZ2UgPSBmYWxzZTtcbiAgICBsZXQgaW5Fc2NhcGUgPSBmYWxzZTtcbiAgICBsZXQgZW5kc1dpdGhTZXAgPSBmYWxzZTtcbiAgICBsZXQgaSA9IGo7XG5cbiAgICAvLyBUZXJtaW5hdGVzIHdpdGggYGlgIGF0IHRoZSBub24taW5jbHVzaXZlIGVuZCBvZiB0aGUgY3VycmVudCBzZWdtZW50LlxuICAgIGZvciAoOyBpIDwgZ2xvYi5sZW5ndGggJiYgIXNlcHMuaW5jbHVkZXMoZ2xvYltpXSk7IGkrKykge1xuICAgICAgaWYgKGluRXNjYXBlKSB7XG4gICAgICAgIGluRXNjYXBlID0gZmFsc2U7XG4gICAgICAgIGNvbnN0IGVzY2FwZUNoYXJzID0gaW5SYW5nZSA/IHJhbmdlRXNjYXBlQ2hhcnMgOiByZWdFeHBFc2NhcGVDaGFycztcbiAgICAgICAgc2VnbWVudCArPSBlc2NhcGVDaGFycy5pbmNsdWRlcyhnbG9iW2ldKSA/IGBcXFxcJHtnbG9iW2ldfWAgOiBnbG9iW2ldO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGdsb2JbaV0gPT0gZXNjYXBlUHJlZml4KSB7XG4gICAgICAgIGluRXNjYXBlID0gdHJ1ZTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09IFwiW1wiKSB7XG4gICAgICAgIGlmICghaW5SYW5nZSkge1xuICAgICAgICAgIGluUmFuZ2UgPSB0cnVlO1xuICAgICAgICAgIHNlZ21lbnQgKz0gXCJbXCI7XG4gICAgICAgICAgaWYgKGdsb2JbaSArIDFdID09IFwiIVwiKSB7XG4gICAgICAgICAgICBpKys7XG4gICAgICAgICAgICBzZWdtZW50ICs9IFwiXlwiO1xuICAgICAgICAgIH0gZWxzZSBpZiAoZ2xvYltpICsgMV0gPT0gXCJeXCIpIHtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIHNlZ21lbnQgKz0gXCJcXFxcXlwiO1xuICAgICAgICAgIH1cbiAgICAgICAgICBjb250aW51ZTtcbiAgICAgICAgfSBlbHNlIGlmIChnbG9iW2kgKyAxXSA9PSBcIjpcIikge1xuICAgICAgICAgIGxldCBrID0gaSArIDE7XG4gICAgICAgICAgbGV0IHZhbHVlID0gXCJcIjtcbiAgICAgICAgICB3aGlsZSAoZ2xvYltrICsgMV0gIT0gbnVsbCAmJiBnbG9iW2sgKyAxXSAhPSBcIjpcIikge1xuICAgICAgICAgICAgdmFsdWUgKz0gZ2xvYltrICsgMV07XG4gICAgICAgICAgICBrKys7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChnbG9iW2sgKyAxXSA9PSBcIjpcIiAmJiBnbG9iW2sgKyAyXSA9PSBcIl1cIikge1xuICAgICAgICAgICAgaSA9IGsgKyAyO1xuICAgICAgICAgICAgaWYgKHZhbHVlID09IFwiYWxudW1cIikgc2VnbWVudCArPSBcIlxcXFxkQS1aYS16XCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PSBcImFscGhhXCIpIHNlZ21lbnQgKz0gXCJBLVphLXpcIjtcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlID09IFwiYXNjaWlcIikgc2VnbWVudCArPSBcIlxceDAwLVxceDdGXCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PSBcImJsYW5rXCIpIHNlZ21lbnQgKz0gXCJcXHQgXCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PSBcImNudHJsXCIpIHNlZ21lbnQgKz0gXCJcXHgwMC1cXHgxRlxceDdGXCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PSBcImRpZ2l0XCIpIHNlZ21lbnQgKz0gXCJcXFxcZFwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT0gXCJncmFwaFwiKSBzZWdtZW50ICs9IFwiXFx4MjEtXFx4N0VcIjtcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlID09IFwibG93ZXJcIikgc2VnbWVudCArPSBcImEtelwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT0gXCJwcmludFwiKSBzZWdtZW50ICs9IFwiXFx4MjAtXFx4N0VcIjtcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlID09IFwicHVuY3RcIikge1xuICAgICAgICAgICAgICBzZWdtZW50ICs9IFwiIVxcXCIjJCUmJygpKissXFxcXC0uLzo7PD0+P0BbXFxcXFxcXFxcXFxcXV5f4oCYe3x9flwiO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PSBcInNwYWNlXCIpIHNlZ21lbnQgKz0gXCJcXFxcc1xcdlwiO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT0gXCJ1cHBlclwiKSBzZWdtZW50ICs9IFwiQS1aXCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PSBcIndvcmRcIikgc2VnbWVudCArPSBcIlxcXFx3XCI7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PSBcInhkaWdpdFwiKSBzZWdtZW50ICs9IFwiXFxcXGRBLUZhLWZcIjtcbiAgICAgICAgICAgIGNvbnRpbnVlO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoZ2xvYltpXSA9PSBcIl1cIiAmJiBpblJhbmdlKSB7XG4gICAgICAgIGluUmFuZ2UgPSBmYWxzZTtcbiAgICAgICAgc2VnbWVudCArPSBcIl1cIjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChpblJhbmdlKSB7XG4gICAgICAgIGlmIChnbG9iW2ldID09IFwiXFxcXFwiKSB7XG4gICAgICAgICAgc2VnbWVudCArPSBgXFxcXFxcXFxgO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHNlZ21lbnQgKz0gZ2xvYltpXTtcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKFxuICAgICAgICBnbG9iW2ldID09IFwiKVwiICYmIGdyb3VwU3RhY2subGVuZ3RoID4gMCAmJlxuICAgICAgICBncm91cFN0YWNrW2dyb3VwU3RhY2subGVuZ3RoIC0gMV0gIT0gXCJCUkFDRVwiXG4gICAgICApIHtcbiAgICAgICAgc2VnbWVudCArPSBcIilcIjtcbiAgICAgICAgY29uc3QgdHlwZSA9IGdyb3VwU3RhY2sucG9wKCkhO1xuICAgICAgICBpZiAodHlwZSA9PSBcIiFcIikge1xuICAgICAgICAgIHNlZ21lbnQgKz0gd2lsZGNhcmQ7XG4gICAgICAgIH0gZWxzZSBpZiAodHlwZSAhPSBcIkBcIikge1xuICAgICAgICAgIHNlZ21lbnQgKz0gdHlwZTtcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKFxuICAgICAgICBnbG9iW2ldID09IFwifFwiICYmIGdyb3VwU3RhY2subGVuZ3RoID4gMCAmJlxuICAgICAgICBncm91cFN0YWNrW2dyb3VwU3RhY2subGVuZ3RoIC0gMV0gIT0gXCJCUkFDRVwiXG4gICAgICApIHtcbiAgICAgICAgc2VnbWVudCArPSBcInxcIjtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9XG5cbiAgICAgIGlmIChnbG9iW2ldID09IFwiK1wiICYmIGV4dGVuZGVkICYmIGdsb2JbaSArIDFdID09IFwiKFwiKSB7XG4gICAgICAgIGkrKztcbiAgICAgICAgZ3JvdXBTdGFjay5wdXNoKFwiK1wiKTtcbiAgICAgICAgc2VnbWVudCArPSBcIig/OlwiO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGdsb2JbaV0gPT0gXCJAXCIgJiYgZXh0ZW5kZWQgJiYgZ2xvYltpICsgMV0gPT0gXCIoXCIpIHtcbiAgICAgICAgaSsrO1xuICAgICAgICBncm91cFN0YWNrLnB1c2goXCJAXCIpO1xuICAgICAgICBzZWdtZW50ICs9IFwiKD86XCI7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZ2xvYltpXSA9PSBcIj9cIikge1xuICAgICAgICBpZiAoZXh0ZW5kZWQgJiYgZ2xvYltpICsgMV0gPT0gXCIoXCIpIHtcbiAgICAgICAgICBpKys7XG4gICAgICAgICAgZ3JvdXBTdGFjay5wdXNoKFwiP1wiKTtcbiAgICAgICAgICBzZWdtZW50ICs9IFwiKD86XCI7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgc2VnbWVudCArPSBcIi5cIjtcbiAgICAgICAgfVxuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGdsb2JbaV0gPT0gXCIhXCIgJiYgZXh0ZW5kZWQgJiYgZ2xvYltpICsgMV0gPT0gXCIoXCIpIHtcbiAgICAgICAgaSsrO1xuICAgICAgICBncm91cFN0YWNrLnB1c2goXCIhXCIpO1xuICAgICAgICBzZWdtZW50ICs9IFwiKD8hXCI7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBpZiAoZ2xvYltpXSA9PSBcIntcIikge1xuICAgICAgICBncm91cFN0YWNrLnB1c2goXCJCUkFDRVwiKTtcbiAgICAgICAgc2VnbWVudCArPSBcIig/OlwiO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGdsb2JbaV0gPT0gXCJ9XCIgJiYgZ3JvdXBTdGFja1tncm91cFN0YWNrLmxlbmd0aCAtIDFdID09IFwiQlJBQ0VcIikge1xuICAgICAgICBncm91cFN0YWNrLnBvcCgpO1xuICAgICAgICBzZWdtZW50ICs9IFwiKVwiO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGdsb2JbaV0gPT0gXCIsXCIgJiYgZ3JvdXBTdGFja1tncm91cFN0YWNrLmxlbmd0aCAtIDFdID09IFwiQlJBQ0VcIikge1xuICAgICAgICBzZWdtZW50ICs9IFwifFwiO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cblxuICAgICAgaWYgKGdsb2JbaV0gPT0gXCIqXCIpIHtcbiAgICAgICAgaWYgKGV4dGVuZGVkICYmIGdsb2JbaSArIDFdID09IFwiKFwiKSB7XG4gICAgICAgICAgaSsrO1xuICAgICAgICAgIGdyb3VwU3RhY2sucHVzaChcIipcIik7XG4gICAgICAgICAgc2VnbWVudCArPSBcIig/OlwiO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNvbnN0IHByZXZDaGFyID0gZ2xvYltpIC0gMV07XG4gICAgICAgICAgbGV0IG51bVN0YXJzID0gMTtcbiAgICAgICAgICB3aGlsZSAoZ2xvYltpICsgMV0gPT0gXCIqXCIpIHtcbiAgICAgICAgICAgIGkrKztcbiAgICAgICAgICAgIG51bVN0YXJzKys7XG4gICAgICAgICAgfVxuICAgICAgICAgIGNvbnN0IG5leHRDaGFyID0gZ2xvYltpICsgMV07XG4gICAgICAgICAgaWYgKFxuICAgICAgICAgICAgZ2xvYnN0YXJPcHRpb24gJiYgbnVtU3RhcnMgPT0gMiAmJlxuICAgICAgICAgICAgWy4uLnNlcHMsIHVuZGVmaW5lZF0uaW5jbHVkZXMocHJldkNoYXIpICYmXG4gICAgICAgICAgICBbLi4uc2VwcywgdW5kZWZpbmVkXS5pbmNsdWRlcyhuZXh0Q2hhcilcbiAgICAgICAgICApIHtcbiAgICAgICAgICAgIHNlZ21lbnQgKz0gZ2xvYnN0YXI7XG4gICAgICAgICAgICBlbmRzV2l0aFNlcCA9IHRydWU7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlZ21lbnQgKz0gd2lsZGNhcmQ7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuXG4gICAgICBzZWdtZW50ICs9IHJlZ0V4cEVzY2FwZUNoYXJzLmluY2x1ZGVzKGdsb2JbaV0pID8gYFxcXFwke2dsb2JbaV19YCA6IGdsb2JbaV07XG4gICAgfVxuXG4gICAgLy8gQ2hlY2sgZm9yIHVuY2xvc2VkIGdyb3VwcyBvciBhIGRhbmdsaW5nIGJhY2tzbGFzaC5cbiAgICBpZiAoZ3JvdXBTdGFjay5sZW5ndGggPiAwIHx8IGluUmFuZ2UgfHwgaW5Fc2NhcGUpIHtcbiAgICAgIC8vIFBhcnNlIGZhaWx1cmUuIFRha2UgYWxsIGNoYXJhY3RlcnMgZnJvbSB0aGlzIHNlZ21lbnQgbGl0ZXJhbGx5LlxuICAgICAgc2VnbWVudCA9IFwiXCI7XG4gICAgICBmb3IgKGNvbnN0IGMgb2YgZ2xvYi5zbGljZShqLCBpKSkge1xuICAgICAgICBzZWdtZW50ICs9IHJlZ0V4cEVzY2FwZUNoYXJzLmluY2x1ZGVzKGMpID8gYFxcXFwke2N9YCA6IGM7XG4gICAgICAgIGVuZHNXaXRoU2VwID0gZmFsc2U7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcmVnRXhwU3RyaW5nICs9IHNlZ21lbnQ7XG4gICAgaWYgKCFlbmRzV2l0aFNlcCkge1xuICAgICAgcmVnRXhwU3RyaW5nICs9IGkgPCBnbG9iLmxlbmd0aCA/IHNlcCA6IHNlcE1heWJlO1xuICAgICAgZW5kc1dpdGhTZXAgPSB0cnVlO1xuICAgIH1cblxuICAgIC8vIFRlcm1pbmF0ZXMgd2l0aCBgaWAgYXQgdGhlIHN0YXJ0IG9mIHRoZSBuZXh0IHNlZ21lbnQuXG4gICAgd2hpbGUgKHNlcHMuaW5jbHVkZXMoZ2xvYltpXSkpIGkrKztcblxuICAgIC8vIENoZWNrIHRoYXQgdGhlIG5leHQgdmFsdWUgb2YgYGpgIGlzIGluZGVlZCBoaWdoZXIgdGhhbiB0aGUgY3VycmVudCB2YWx1ZS5cbiAgICBpZiAoIShpID4gaikpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIkFzc2VydGlvbiBmYWlsdXJlOiBpID4gaiAocG90ZW50aWFsIGluZmluaXRlIGxvb3ApXCIpO1xuICAgIH1cbiAgICBqID0gaTtcbiAgfVxuXG4gIHJlZ0V4cFN0cmluZyA9IGBeJHtyZWdFeHBTdHJpbmd9JGA7XG4gIHJldHVybiBuZXcgUmVnRXhwKHJlZ0V4cFN0cmluZywgY2FzZUluc2Vuc2l0aXZlID8gXCJpXCIgOiBcIlwiKTtcbn1cblxuLyoqIFRlc3Qgd2hldGhlciB0aGUgZ2l2ZW4gc3RyaW5nIGlzIGEgZ2xvYiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGlzR2xvYihzdHI6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBjaGFyczogUmVjb3JkPHN0cmluZywgc3RyaW5nPiA9IHsgXCJ7XCI6IFwifVwiLCBcIihcIjogXCIpXCIsIFwiW1wiOiBcIl1cIiB9O1xuICBjb25zdCByZWdleCA9XG4gICAgL1xcXFwoLil8KF4hfFxcKnxbXFxdLispXVxcP3xcXFtbXlxcXFxcXF1dK1xcXXxcXHtbXlxcXFx9XStcXH18XFwoXFw/WzohPV1bXlxcXFwpXStcXCl8XFwoW158XStcXHxbXlxcXFwpXStcXCkpLztcblxuICBpZiAoc3RyID09PSBcIlwiKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgbGV0IG1hdGNoOiBSZWdFeHBFeGVjQXJyYXkgfCBudWxsO1xuXG4gIHdoaWxlICgobWF0Y2ggPSByZWdleC5leGVjKHN0cikpKSB7XG4gICAgaWYgKG1hdGNoWzJdKSByZXR1cm4gdHJ1ZTtcbiAgICBsZXQgaWR4ID0gbWF0Y2guaW5kZXggKyBtYXRjaFswXS5sZW5ndGg7XG5cbiAgICAvLyBpZiBhbiBvcGVuIGJyYWNrZXQvYnJhY2UvcGFyZW4gaXMgZXNjYXBlZCxcbiAgICAvLyBzZXQgdGhlIGluZGV4IHRvIHRoZSBuZXh0IGNsb3NpbmcgY2hhcmFjdGVyXG4gICAgY29uc3Qgb3BlbiA9IG1hdGNoWzFdO1xuICAgIGNvbnN0IGNsb3NlID0gb3BlbiA/IGNoYXJzW29wZW5dIDogbnVsbDtcbiAgICBpZiAob3BlbiAmJiBjbG9zZSkge1xuICAgICAgY29uc3QgbiA9IHN0ci5pbmRleE9mKGNsb3NlLCBpZHgpO1xuICAgICAgaWYgKG4gIT09IC0xKSB7XG4gICAgICAgIGlkeCA9IG4gKyAxO1xuICAgICAgfVxuICAgIH1cblxuICAgIHN0ciA9IHN0ci5zbGljZShpZHgpO1xuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vKiogTGlrZSBub3JtYWxpemUoKSwgYnV0IGRvZXNuJ3QgY29sbGFwc2UgXCIqKlxcLy4uXCIgd2hlbiBgZ2xvYnN0YXJgIGlzIHRydWUuICovXG5leHBvcnQgZnVuY3Rpb24gbm9ybWFsaXplR2xvYihcbiAgZ2xvYjogc3RyaW5nLFxuICB7IGdsb2JzdGFyID0gZmFsc2UgfTogR2xvYk9wdGlvbnMgPSB7fSxcbik6IHN0cmluZyB7XG4gIGlmIChnbG9iLm1hdGNoKC9cXDAvZykpIHtcbiAgICB0aHJvdyBuZXcgRXJyb3IoYEdsb2IgY29udGFpbnMgaW52YWxpZCBjaGFyYWN0ZXJzOiBcIiR7Z2xvYn1cImApO1xuICB9XG4gIGlmICghZ2xvYnN0YXIpIHtcbiAgICByZXR1cm4gbm9ybWFsaXplKGdsb2IpO1xuICB9XG4gIGNvbnN0IHMgPSBTRVBfUEFUVEVSTi5zb3VyY2U7XG4gIGNvbnN0IGJhZFBhcmVudFBhdHRlcm4gPSBuZXcgUmVnRXhwKFxuICAgIGAoPzw9KCR7c318XilcXFxcKlxcXFwqJHtzfSlcXFxcLlxcXFwuKD89JHtzfXwkKWAsXG4gICAgXCJnXCIsXG4gICk7XG4gIHJldHVybiBub3JtYWxpemUoZ2xvYi5yZXBsYWNlKGJhZFBhcmVudFBhdHRlcm4sIFwiXFwwXCIpKS5yZXBsYWNlKC9cXDAvZywgXCIuLlwiKTtcbn1cblxuLyoqIExpa2Ugam9pbigpLCBidXQgZG9lc24ndCBjb2xsYXBzZSBcIioqXFwvLi5cIiB3aGVuIGBnbG9ic3RhcmAgaXMgdHJ1ZS4gKi9cbmV4cG9ydCBmdW5jdGlvbiBqb2luR2xvYnMoXG4gIGdsb2JzOiBzdHJpbmdbXSxcbiAgeyBleHRlbmRlZCA9IGZhbHNlLCBnbG9ic3RhciA9IGZhbHNlIH06IEdsb2JPcHRpb25zID0ge30sXG4pOiBzdHJpbmcge1xuICBpZiAoIWdsb2JzdGFyIHx8IGdsb2JzLmxlbmd0aCA9PSAwKSB7XG4gICAgcmV0dXJuIGpvaW4oLi4uZ2xvYnMpO1xuICB9XG4gIGlmIChnbG9icy5sZW5ndGggPT09IDApIHJldHVybiBcIi5cIjtcbiAgbGV0IGpvaW5lZDogc3RyaW5nIHwgdW5kZWZpbmVkO1xuICBmb3IgKGNvbnN0IGdsb2Igb2YgZ2xvYnMpIHtcbiAgICBjb25zdCBwYXRoID0gZ2xvYjtcbiAgICBpZiAocGF0aC5sZW5ndGggPiAwKSB7XG4gICAgICBpZiAoIWpvaW5lZCkgam9pbmVkID0gcGF0aDtcbiAgICAgIGVsc2Ugam9pbmVkICs9IGAke1NFUH0ke3BhdGh9YDtcbiAgICB9XG4gIH1cbiAgaWYgKCFqb2luZWQpIHJldHVybiBcIi5cIjtcbiAgcmV0dXJuIG5vcm1hbGl6ZUdsb2Ioam9pbmVkLCB7IGV4dGVuZGVkLCBnbG9ic3RhciB9KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUEwRSxBQUExRSx3RUFBMEU7QUFDMUUsRUFBcUMsQUFBckMsbUNBQXFDO0FBRXJDLE1BQU0sR0FBRyxTQUFTLEVBQUUsTUFBTSxRQUFRLENBQWdCO0FBQ2xELE1BQU0sR0FBRyxHQUFHLEVBQUUsV0FBVyxRQUFRLENBQWdCO0FBQ2pELE1BQU0sTUFBTSxNQUFNLE1BQU0sQ0FBWTtBQUNwQyxNQUFNLE1BQU0sTUFBTSxNQUFNLENBQVk7QUFFcEMsS0FBSyxDQUFDLElBQUksR0FBRyxTQUFTLEdBQUcsTUFBTSxHQUFHLE1BQU07QUFDeEMsS0FBSyxDQUFDLENBQUMsQ0FBQyxJQUFJLEdBQUUsU0FBUyxFQUFDLENBQUMsR0FBRyxJQUFJO0FBbUJoQyxFQUFrQixBQUFsQixnQkFBa0I7QUFDbEIsS0FBSyxDQUFDLGlCQUFpQixHQUFHLENBQUM7SUFBQSxDQUFHO0lBQUUsQ0FBRztJQUFFLENBQUc7SUFBRSxDQUFHO0lBQUUsQ0FBRztJQUFFLENBQUc7SUFBRSxDQUFHO0lBQUUsQ0FBRztJQUFFLENBQUc7SUFBRSxDQUFHO0lBQUUsQ0FBSTtJQUFFLENBQUc7SUFBRSxDQUFHO0lBQUUsQ0FBRztBQUFBLENBQUM7QUFDakcsS0FBSyxDQUFDLGdCQUFnQixHQUFHLENBQUM7SUFBQSxDQUFHO0lBQUUsQ0FBSTtJQUFFLENBQUc7QUFBQSxDQUFDO0FBRXpDLEVBcUQ4RCxBQXJEOUQ7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OzREQXFEOEQsQUFyRDlELEVBcUQ4RCxDQUM5RCxNQUFNLFVBQVUsWUFBWSxDQUMxQixJQUFZLEVBQ1osQ0FBQyxDQUNDLFFBQVEsRUFBRyxJQUFJLEdBQ2YsUUFBUSxFQUFFLGNBQWMsR0FBRyxJQUFJLEdBQy9CLEVBQUUsRUFBRyxNQUFNLEdBQ1gsZUFBZSxFQUFHLEtBQUssRUFDSixD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