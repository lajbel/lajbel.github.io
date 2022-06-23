// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { YAMLError } from "../error.ts";
import * as common from "../utils.ts";
import { DumperState } from "./dumper_state.ts";
const _toString = Object.prototype.toString;
const _hasOwnProperty = Object.prototype.hasOwnProperty;
const CHAR_TAB = 9; /* Tab */ 
const CHAR_LINE_FEED = 10; /* LF */ 
const CHAR_SPACE = 32; /* Space */ 
const CHAR_EXCLAMATION = 33; /* ! */ 
const CHAR_DOUBLE_QUOTE = 34; /* " */ 
const CHAR_SHARP = 35; /* # */ 
const CHAR_PERCENT = 37; /* % */ 
const CHAR_AMPERSAND = 38; /* & */ 
const CHAR_SINGLE_QUOTE = 39; /* ' */ 
const CHAR_ASTERISK = 42; /* * */ 
const CHAR_COMMA = 44; /* , */ 
const CHAR_MINUS = 45; /* - */ 
const CHAR_COLON = 58; /* : */ 
const CHAR_GREATER_THAN = 62; /* > */ 
const CHAR_QUESTION = 63; /* ? */ 
const CHAR_COMMERCIAL_AT = 64; /* @ */ 
const CHAR_LEFT_SQUARE_BRACKET = 91; /* [ */ 
const CHAR_RIGHT_SQUARE_BRACKET = 93; /* ] */ 
const CHAR_GRAVE_ACCENT = 96; /* ` */ 
const CHAR_LEFT_CURLY_BRACKET = 123; /* { */ 
const CHAR_VERTICAL_LINE = 124; /* | */ 
const CHAR_RIGHT_CURLY_BRACKET = 125; /* } */ 
const ESCAPE_SEQUENCES = {
};
ESCAPE_SEQUENCES[0] = "\\0";
ESCAPE_SEQUENCES[7] = "\\a";
ESCAPE_SEQUENCES[8] = "\\b";
ESCAPE_SEQUENCES[9] = "\\t";
ESCAPE_SEQUENCES[10] = "\\n";
ESCAPE_SEQUENCES[11] = "\\v";
ESCAPE_SEQUENCES[12] = "\\f";
ESCAPE_SEQUENCES[13] = "\\r";
ESCAPE_SEQUENCES[27] = "\\e";
ESCAPE_SEQUENCES[34] = '\\"';
ESCAPE_SEQUENCES[92] = "\\\\";
ESCAPE_SEQUENCES[133] = "\\N";
ESCAPE_SEQUENCES[160] = "\\_";
ESCAPE_SEQUENCES[8232] = "\\L";
ESCAPE_SEQUENCES[8233] = "\\P";
const DEPRECATED_BOOLEANS_SYNTAX = [
    "y",
    "Y",
    "yes",
    "Yes",
    "YES",
    "on",
    "On",
    "ON",
    "n",
    "N",
    "no",
    "No",
    "NO",
    "off",
    "Off",
    "OFF", 
];
function encodeHex(character) {
    const string = character.toString(16).toUpperCase();
    let handle;
    let length;
    if (character <= 255) {
        handle = "x";
        length = 2;
    } else if (character <= 65535) {
        handle = "u";
        length = 4;
    } else if (character <= 4294967295) {
        handle = "U";
        length = 8;
    } else {
        throw new YAMLError("code point within a string may not be greater than 0xFFFFFFFF");
    }
    return `\\${handle}${common.repeat("0", length - string.length)}${string}`;
}
// Indents every line in a string. Empty lines (\n only) are not indented.
function indentString(string, spaces) {
    const ind = common.repeat(" ", spaces), length = string.length;
    let position = 0, next = -1, result = "", line;
    while(position < length){
        next = string.indexOf("\n", position);
        if (next === -1) {
            line = string.slice(position);
            position = length;
        } else {
            line = string.slice(position, next + 1);
            position = next + 1;
        }
        if (line.length && line !== "\n") result += ind;
        result += line;
    }
    return result;
}
function generateNextLine(state, level) {
    return `\n${common.repeat(" ", state.indent * level)}`;
}
function testImplicitResolving(state, str) {
    let type;
    for(let index = 0, length = state.implicitTypes.length; index < length; index += 1){
        type = state.implicitTypes[index];
        if (type.resolve(str)) {
            return true;
        }
    }
    return false;
}
// [33] s-white ::= s-space | s-tab
function isWhitespace(c) {
    return c === CHAR_SPACE || c === CHAR_TAB;
}
// Returns true if the character can be printed without escaping.
// From YAML 1.2: "any allowed characters known to be non-printable
// should also be escaped. [However,] This isn’t mandatory"
// Derived from nb-char - \t - #x85 - #xA0 - #x2028 - #x2029.
function isPrintable(c) {
    return 32 <= c && c <= 126 || 161 <= c && c <= 55295 && c !== 8232 && c !== 8233 || 57344 <= c && c <= 65533 && c !== 65279 || 65536 <= c && c <= 1114111;
}
// Simplified test for values allowed after the first character in plain style.
function isPlainSafe(c) {
    // Uses a subset of nb-char - c-flow-indicator - ":" - "#"
    // where nb-char ::= c-printable - b-char - c-byte-order-mark.
    return isPrintable(c) && c !== 65279 && // - c-flow-indicator
    c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && // - ":" - "#"
    c !== CHAR_COLON && c !== CHAR_SHARP;
}
// Simplified test for values allowed as the first character in plain style.
function isPlainSafeFirst(c) {
    // Uses a subset of ns-char - c-indicator
    // where ns-char = nb-char - s-white.
    return isPrintable(c) && c !== 65279 && !isWhitespace(c) && // - (c-indicator ::=
    // “-” | “?” | “:” | “,” | “[” | “]” | “{” | “}”
    c !== CHAR_MINUS && c !== CHAR_QUESTION && c !== CHAR_COLON && c !== CHAR_COMMA && c !== CHAR_LEFT_SQUARE_BRACKET && c !== CHAR_RIGHT_SQUARE_BRACKET && c !== CHAR_LEFT_CURLY_BRACKET && c !== CHAR_RIGHT_CURLY_BRACKET && // | “#” | “&” | “*” | “!” | “|” | “>” | “'” | “"”
    c !== CHAR_SHARP && c !== CHAR_AMPERSAND && c !== CHAR_ASTERISK && c !== CHAR_EXCLAMATION && c !== CHAR_VERTICAL_LINE && c !== CHAR_GREATER_THAN && c !== CHAR_SINGLE_QUOTE && c !== CHAR_DOUBLE_QUOTE && // | “%” | “@” | “`”)
    c !== CHAR_PERCENT && c !== CHAR_COMMERCIAL_AT && c !== CHAR_GRAVE_ACCENT;
}
// Determines whether block indentation indicator is required.
function needIndentIndicator(string) {
    const leadingSpaceRe = /^\n* /;
    return leadingSpaceRe.test(string);
}
const STYLE_PLAIN = 1, STYLE_SINGLE = 2, STYLE_LITERAL = 3, STYLE_FOLDED = 4, STYLE_DOUBLE = 5;
// Determines which scalar styles are possible and returns the preferred style.
// lineWidth = -1 => no limit.
// Pre-conditions: str.length > 0.
// Post-conditions:
//  STYLE_PLAIN or STYLE_SINGLE => no \n are in the string.
//  STYLE_LITERAL => no lines are suitable for folding (or lineWidth is -1).
//  STYLE_FOLDED => a line > lineWidth and can be folded (and lineWidth != -1).
function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType) {
    const shouldTrackWidth = lineWidth !== -1;
    let hasLineBreak = false, hasFoldableLine = false, previousLineBreak = -1, plain = isPlainSafeFirst(string.charCodeAt(0)) && !isWhitespace(string.charCodeAt(string.length - 1));
    let char, i;
    if (singleLineOnly) {
        // Case: no block styles.
        // Check for disallowed characters to rule out plain and single.
        for(i = 0; i < string.length; i++){
            char = string.charCodeAt(i);
            if (!isPrintable(char)) {
                return STYLE_DOUBLE;
            }
            plain = plain && isPlainSafe(char);
        }
    } else {
        // Case: block styles permitted.
        for(i = 0; i < string.length; i++){
            char = string.charCodeAt(i);
            if (char === CHAR_LINE_FEED) {
                hasLineBreak = true;
                // Check if any line can be folded.
                if (shouldTrackWidth) {
                    hasFoldableLine = hasFoldableLine || // Foldable line = too long, and not more-indented.
                    (i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ");
                    previousLineBreak = i;
                }
            } else if (!isPrintable(char)) {
                return STYLE_DOUBLE;
            }
            plain = plain && isPlainSafe(char);
        }
        // in case the end is missing a \n
        hasFoldableLine = hasFoldableLine || shouldTrackWidth && i - previousLineBreak - 1 > lineWidth && string[previousLineBreak + 1] !== " ";
    }
    // Although every style can represent \n without escaping, prefer block styles
    // for multiline, since they're more readable and they don't add empty lines.
    // Also prefer folding a super-long line.
    if (!hasLineBreak && !hasFoldableLine) {
        // Strings interpretable as another type have to be quoted;
        // e.g. the string 'true' vs. the boolean true.
        return plain && !testAmbiguousType(string) ? STYLE_PLAIN : STYLE_SINGLE;
    }
    // Edge case: block indentation indicator can only have one digit.
    if (indentPerLevel > 9 && needIndentIndicator(string)) {
        return STYLE_DOUBLE;
    }
    // At this point we know block styles are valid.
    // Prefer literal style unless we want to fold.
    return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
}
// Greedy line breaking.
// Picks the longest line under the limit each time,
// otherwise settles for the shortest line over the limit.
// NB. More-indented lines *cannot* be folded, as that would add an extra \n.
function foldLine(line, width) {
    if (line === "" || line[0] === " ") return line;
    // Since a more-indented line adds a \n, breaks can't be followed by a space.
    const breakRe = / [^ ]/g; // note: the match index will always be <= length-2.
    let match;
    // start is an inclusive index. end, curr, and next are exclusive.
    let start = 0, end, curr = 0, next = 0;
    let result = "";
    // Invariants: 0 <= start <= length-1.
    //   0 <= curr <= next <= max(0, length-2). curr - start <= width.
    // Inside the loop:
    //   A match implies length >= 2, so curr and next are <= length-2.
    // tslint:disable-next-line:no-conditional-assignment
    while(match = breakRe.exec(line)){
        next = match.index;
        // maintain invariant: curr - start <= width
        if (next - start > width) {
            end = curr > start ? curr : next; // derive end <= length-2
            result += `\n${line.slice(start, end)}`;
            // skip the space that was output as \n
            start = end + 1; // derive start <= length-1
        }
        curr = next;
    }
    // By the invariants, start <= length-1, so there is something left over.
    // It is either the whole string or a part starting from non-whitespace.
    result += "\n";
    // Insert a break if the remainder is too long and there is a break available.
    if (line.length - start > width && curr > start) {
        result += `${line.slice(start, curr)}\n${line.slice(curr + 1)}`;
    } else {
        result += line.slice(start);
    }
    return result.slice(1); // drop extra \n joiner
}
// (See the note for writeScalar.)
function dropEndingNewline(string) {
    return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
}
// Note: a long line without a suitable break point will exceed the width limit.
// Pre-conditions: every char in str isPrintable, str.length > 0, width > 0.
function foldString(string, width) {
    // In folded style, $k$ consecutive newlines output as $k+1$ newlines—
    // unless they're before or after a more-indented line, or at the very
    // beginning or end, in which case $k$ maps to $k$.
    // Therefore, parse each chunk as newline(s) followed by a content line.
    const lineRe = /(\n+)([^\n]*)/g;
    // first line (possibly an empty line)
    let result = (()=>{
        let nextLF = string.indexOf("\n");
        nextLF = nextLF !== -1 ? nextLF : string.length;
        lineRe.lastIndex = nextLF;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        return foldLine(string.slice(0, nextLF), width);
    })();
    // If we haven't reached the first content line yet, don't add an extra \n.
    let prevMoreIndented = string[0] === "\n" || string[0] === " ";
    let moreIndented;
    // rest of the lines
    let match;
    // tslint:disable-next-line:no-conditional-assignment
    while(match = lineRe.exec(string)){
        const prefix = match[1], line = match[2];
        moreIndented = line[0] === " ";
        result += prefix + (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") + // eslint-disable-next-line @typescript-eslint/no-use-before-define
        foldLine(line, width);
        prevMoreIndented = moreIndented;
    }
    return result;
}
// Escapes a double-quoted string.
function escapeString(string) {
    let result = "";
    let char, nextChar;
    let escapeSeq;
    for(let i = 0; i < string.length; i++){
        char = string.charCodeAt(i);
        // Check for surrogate pairs (reference Unicode 3.0 section "3.7 Surrogates").
        if (char >= 55296 && char <= 56319 /* high surrogate */ ) {
            nextChar = string.charCodeAt(i + 1);
            if (nextChar >= 56320 && nextChar <= 57343 /* low surrogate */ ) {
                // Combine the surrogate pair and store it escaped.
                result += encodeHex((char - 55296) * 1024 + nextChar - 56320 + 65536);
                // Advance index one extra since we already used that char here.
                i++;
                continue;
            }
        }
        escapeSeq = ESCAPE_SEQUENCES[char];
        result += !escapeSeq && isPrintable(char) ? string[i] : escapeSeq || encodeHex(char);
    }
    return result;
}
// Pre-conditions: string is valid for a block scalar, 1 <= indentPerLevel <= 9.
function blockHeader(string, indentPerLevel) {
    const indentIndicator = needIndentIndicator(string) ? String(indentPerLevel) : "";
    // note the special case: the string '\n' counts as a "trailing" empty line.
    const clip = string[string.length - 1] === "\n";
    const keep = clip && (string[string.length - 2] === "\n" || string === "\n");
    const chomp = keep ? "+" : clip ? "" : "-";
    return `${indentIndicator}${chomp}\n`;
}
// Note: line breaking/folding is implemented for only the folded style.
// NB. We drop the last trailing newline (if any) of a returned block scalar
//  since the dumper adds its own newline. This always works:
//    • No ending newline => unaffected; already using strip "-" chomping.
//    • Ending newline    => removed then restored.
//  Importantly, this keeps the "+" chomp indicator from gaining an extra line.
function writeScalar(state, string, level, iskey) {
    state.dump = (()=>{
        if (string.length === 0) {
            return "''";
        }
        if (!state.noCompatMode && DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1) {
            return `'${string}'`;
        }
        const indent = state.indent * Math.max(1, level); // no 0-indent scalars
        // As indentation gets deeper, let the width decrease monotonically
        // to the lower bound min(state.lineWidth, 40).
        // Note that this implies
        //  state.lineWidth ≤ 40 + state.indent: width is fixed at the lower bound.
        //  state.lineWidth > 40 + state.indent: width decreases until the lower
        //  bound.
        // This behaves better than a constant minimum width which disallows
        // narrower options, or an indent threshold which causes the width
        // to suddenly increase.
        const lineWidth = state.lineWidth === -1 ? -1 : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
        // Without knowing if keys are implicit/explicit,
        // assume implicit for safety.
        const singleLineOnly = iskey || // No block styles in flow mode.
        (state.flowLevel > -1 && level >= state.flowLevel);
        function testAmbiguity(str) {
            return testImplicitResolving(state, str);
        }
        switch(chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth, testAmbiguity)){
            case STYLE_PLAIN:
                return string;
            case STYLE_SINGLE:
                return `'${string.replace(/'/g, "''")}'`;
            case STYLE_LITERAL:
                return `|${blockHeader(string, state.indent)}${dropEndingNewline(indentString(string, indent))}`;
            case STYLE_FOLDED:
                return `>${blockHeader(string, state.indent)}${dropEndingNewline(indentString(foldString(string, lineWidth), indent))}`;
            case STYLE_DOUBLE:
                return `"${escapeString(string)}"`;
            default:
                throw new YAMLError("impossible error: invalid scalar style");
        }
    })();
}
function writeFlowSequence(state, level, object) {
    let _result = "";
    const _tag = state.tag;
    for(let index = 0, length = object.length; index < length; index += 1){
        // Write only valid elements.
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        if (writeNode(state, level, object[index], false, false)) {
            if (index !== 0) _result += `,${!state.condenseFlow ? " " : ""}`;
            _result += state.dump;
        }
    }
    state.tag = _tag;
    state.dump = `[${_result}]`;
}
function writeBlockSequence(state, level, object, compact = false) {
    let _result = "";
    const _tag = state.tag;
    for(let index = 0, length = object.length; index < length; index += 1){
        // Write only valid elements.
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        if (writeNode(state, level + 1, object[index], true, true)) {
            if (!compact || index !== 0) {
                _result += generateNextLine(state, level);
            }
            if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
                _result += "-";
            } else {
                _result += "- ";
            }
            _result += state.dump;
        }
    }
    state.tag = _tag;
    state.dump = _result || "[]"; // Empty sequence if no valid values.
}
function writeFlowMapping(state, level, object) {
    let _result = "";
    const _tag = state.tag, objectKeyList = Object.keys(object);
    let pairBuffer, objectKey, objectValue;
    for(let index = 0, length = objectKeyList.length; index < length; index += 1){
        pairBuffer = state.condenseFlow ? '"' : "";
        if (index !== 0) pairBuffer += ", ";
        objectKey = objectKeyList[index];
        objectValue = object[objectKey];
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        if (!writeNode(state, level, objectKey, false, false)) {
            continue; // Skip this pair because of invalid key;
        }
        if (state.dump.length > 1024) pairBuffer += "? ";
        pairBuffer += `${state.dump}${state.condenseFlow ? '"' : ""}:${state.condenseFlow ? "" : " "}`;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        if (!writeNode(state, level, objectValue, false, false)) {
            continue; // Skip this pair because of invalid value.
        }
        pairBuffer += state.dump;
        // Both key and value are valid.
        _result += pairBuffer;
    }
    state.tag = _tag;
    state.dump = `{${_result}}`;
}
function writeBlockMapping(state, level, object, compact = false) {
    const _tag = state.tag, objectKeyList = Object.keys(object);
    let _result = "";
    // Allow sorting keys so that the output file is deterministic
    if (state.sortKeys === true) {
        // Default sorting
        objectKeyList.sort();
    } else if (typeof state.sortKeys === "function") {
        // Custom sort function
        objectKeyList.sort(state.sortKeys);
    } else if (state.sortKeys) {
        // Something is wrong
        throw new YAMLError("sortKeys must be a boolean or a function");
    }
    let pairBuffer = "", objectKey, objectValue, explicitPair;
    for(let index = 0, length = objectKeyList.length; index < length; index += 1){
        pairBuffer = "";
        if (!compact || index !== 0) {
            pairBuffer += generateNextLine(state, level);
        }
        objectKey = objectKeyList[index];
        objectValue = object[objectKey];
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        if (!writeNode(state, level + 1, objectKey, true, true, true)) {
            continue; // Skip this pair because of invalid key.
        }
        explicitPair = state.tag !== null && state.tag !== "?" || state.dump && state.dump.length > 1024;
        if (explicitPair) {
            if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
                pairBuffer += "?";
            } else {
                pairBuffer += "? ";
            }
        }
        pairBuffer += state.dump;
        if (explicitPair) {
            pairBuffer += generateNextLine(state, level);
        }
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
            continue; // Skip this pair because of invalid value.
        }
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
            pairBuffer += ":";
        } else {
            pairBuffer += ": ";
        }
        pairBuffer += state.dump;
        // Both key and value are valid.
        _result += pairBuffer;
    }
    state.tag = _tag;
    state.dump = _result || "{}"; // Empty mapping if no valid pairs.
}
function detectType(state, object, explicit = false) {
    const typeList = explicit ? state.explicitTypes : state.implicitTypes;
    let type;
    let style;
    let _result;
    for(let index = 0, length = typeList.length; index < length; index += 1){
        type = typeList[index];
        if ((type.instanceOf || type.predicate) && (!type.instanceOf || typeof object === "object" && object instanceof type.instanceOf) && (!type.predicate || type.predicate(object))) {
            state.tag = explicit ? type.tag : "?";
            if (type.represent) {
                style = state.styleMap[type.tag] || type.defaultStyle;
                if (_toString.call(type.represent) === "[object Function]") {
                    _result = type.represent(object, style);
                } else if (_hasOwnProperty.call(type.represent, style)) {
                    _result = type.represent[style](object, style);
                } else {
                    throw new YAMLError(`!<${type.tag}> tag resolver accepts not "${style}" style`);
                }
                state.dump = _result;
            }
            return true;
        }
    }
    return false;
}
// Serializes `object` and writes it to global `result`.
// Returns true on success, or false on invalid object.
//
function writeNode(state, level, object, block, compact, iskey = false) {
    state.tag = null;
    state.dump = object;
    if (!detectType(state, object, false)) {
        detectType(state, object, true);
    }
    const type = _toString.call(state.dump);
    if (block) {
        block = state.flowLevel < 0 || state.flowLevel > level;
    }
    const objectOrArray = type === "[object Object]" || type === "[object Array]";
    let duplicateIndex = -1;
    let duplicate = false;
    if (objectOrArray) {
        duplicateIndex = state.duplicates.indexOf(object);
        duplicate = duplicateIndex !== -1;
    }
    if (state.tag !== null && state.tag !== "?" || duplicate || state.indent !== 2 && level > 0) {
        compact = false;
    }
    if (duplicate && state.usedDuplicates[duplicateIndex]) {
        state.dump = `*ref_${duplicateIndex}`;
    } else {
        if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
            state.usedDuplicates[duplicateIndex] = true;
        }
        if (type === "[object Object]") {
            if (block && Object.keys(state.dump).length !== 0) {
                writeBlockMapping(state, level, state.dump, compact);
                if (duplicate) {
                    state.dump = `&ref_${duplicateIndex}${state.dump}`;
                }
            } else {
                writeFlowMapping(state, level, state.dump);
                if (duplicate) {
                    state.dump = `&ref_${duplicateIndex} ${state.dump}`;
                }
            }
        } else if (type === "[object Array]") {
            const arrayLevel = state.noArrayIndent && level > 0 ? level - 1 : level;
            if (block && state.dump.length !== 0) {
                writeBlockSequence(state, arrayLevel, state.dump, compact);
                if (duplicate) {
                    state.dump = `&ref_${duplicateIndex}${state.dump}`;
                }
            } else {
                writeFlowSequence(state, arrayLevel, state.dump);
                if (duplicate) {
                    state.dump = `&ref_${duplicateIndex} ${state.dump}`;
                }
            }
        } else if (type === "[object String]") {
            if (state.tag !== "?") {
                writeScalar(state, state.dump, level, iskey);
            }
        } else {
            if (state.skipInvalid) return false;
            throw new YAMLError(`unacceptable kind of an object to dump ${type}`);
        }
        if (state.tag !== null && state.tag !== "?") {
            state.dump = `!<${state.tag}> ${state.dump}`;
        }
    }
    return true;
}
function inspectNode(object, objects, duplicatesIndexes) {
    if (object !== null && typeof object === "object") {
        const index = objects.indexOf(object);
        if (index !== -1) {
            if (duplicatesIndexes.indexOf(index) === -1) {
                duplicatesIndexes.push(index);
            }
        } else {
            objects.push(object);
            if (Array.isArray(object)) {
                for(let idx = 0, length = object.length; idx < length; idx += 1){
                    inspectNode(object[idx], objects, duplicatesIndexes);
                }
            } else {
                const objectKeyList = Object.keys(object);
                for(let idx = 0, length = objectKeyList.length; idx < length; idx += 1){
                    inspectNode(object[objectKeyList[idx]], objects, duplicatesIndexes);
                }
            }
        }
    }
}
function getDuplicateReferences(object, state) {
    const objects = [], duplicatesIndexes = [];
    inspectNode(object, objects, duplicatesIndexes);
    const length = duplicatesIndexes.length;
    for(let index = 0; index < length; index += 1){
        state.duplicates.push(objects[duplicatesIndexes[index]]);
    }
    state.usedDuplicates = new Array(length);
}
export function dump(input, options) {
    options = options || {
    };
    const state = new DumperState(options);
    if (!state.noRefs) getDuplicateReferences(input, state);
    if (writeNode(state, 0, input, true, true)) return `${state.dump}\n`;
    return "";
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjk3LjAvZW5jb2RpbmcvX3lhbWwvZHVtcGVyL2R1bXBlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBQb3J0ZWQgZnJvbSBqcy15YW1sIHYzLjEzLjE6XG4vLyBodHRwczovL2dpdGh1Yi5jb20vbm9kZWNhL2pzLXlhbWwvY29tbWl0LzY2NWFhZGRhNDIzNDlkY2FlODY5ZjEyMDQwZDliMTBlZjE4ZDEyZGFcbi8vIENvcHlyaWdodCAyMDExLTIwMTUgYnkgVml0YWx5IFB1enJpbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG5pbXBvcnQgeyBZQU1MRXJyb3IgfSBmcm9tIFwiLi4vZXJyb3IudHNcIjtcbmltcG9ydCB0eXBlIHsgUmVwcmVzZW50Rm4sIFN0eWxlVmFyaWFudCwgVHlwZSB9IGZyb20gXCIuLi90eXBlLnRzXCI7XG5pbXBvcnQgKiBhcyBjb21tb24gZnJvbSBcIi4uL3V0aWxzLnRzXCI7XG5pbXBvcnQgeyBEdW1wZXJTdGF0ZSwgRHVtcGVyU3RhdGVPcHRpb25zIH0gZnJvbSBcIi4vZHVtcGVyX3N0YXRlLnRzXCI7XG5cbnR5cGUgQW55ID0gY29tbW9uLkFueTtcbnR5cGUgQXJyYXlPYmplY3Q8VCA9IEFueT4gPSBjb21tb24uQXJyYXlPYmplY3Q8VD47XG5cbmNvbnN0IF90b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5jb25zdCBfaGFzT3duUHJvcGVydHkgPSBPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5O1xuXG5jb25zdCBDSEFSX1RBQiA9IDB4MDk7IC8qIFRhYiAqL1xuY29uc3QgQ0hBUl9MSU5FX0ZFRUQgPSAweDBhOyAvKiBMRiAqL1xuY29uc3QgQ0hBUl9TUEFDRSA9IDB4MjA7IC8qIFNwYWNlICovXG5jb25zdCBDSEFSX0VYQ0xBTUFUSU9OID0gMHgyMTsgLyogISAqL1xuY29uc3QgQ0hBUl9ET1VCTEVfUVVPVEUgPSAweDIyOyAvKiBcIiAqL1xuY29uc3QgQ0hBUl9TSEFSUCA9IDB4MjM7IC8qICMgKi9cbmNvbnN0IENIQVJfUEVSQ0VOVCA9IDB4MjU7IC8qICUgKi9cbmNvbnN0IENIQVJfQU1QRVJTQU5EID0gMHgyNjsgLyogJiAqL1xuY29uc3QgQ0hBUl9TSU5HTEVfUVVPVEUgPSAweDI3OyAvKiAnICovXG5jb25zdCBDSEFSX0FTVEVSSVNLID0gMHgyYTsgLyogKiAqL1xuY29uc3QgQ0hBUl9DT01NQSA9IDB4MmM7IC8qICwgKi9cbmNvbnN0IENIQVJfTUlOVVMgPSAweDJkOyAvKiAtICovXG5jb25zdCBDSEFSX0NPTE9OID0gMHgzYTsgLyogOiAqL1xuY29uc3QgQ0hBUl9HUkVBVEVSX1RIQU4gPSAweDNlOyAvKiA+ICovXG5jb25zdCBDSEFSX1FVRVNUSU9OID0gMHgzZjsgLyogPyAqL1xuY29uc3QgQ0hBUl9DT01NRVJDSUFMX0FUID0gMHg0MDsgLyogQCAqL1xuY29uc3QgQ0hBUl9MRUZUX1NRVUFSRV9CUkFDS0VUID0gMHg1YjsgLyogWyAqL1xuY29uc3QgQ0hBUl9SSUdIVF9TUVVBUkVfQlJBQ0tFVCA9IDB4NWQ7IC8qIF0gKi9cbmNvbnN0IENIQVJfR1JBVkVfQUNDRU5UID0gMHg2MDsgLyogYCAqL1xuY29uc3QgQ0hBUl9MRUZUX0NVUkxZX0JSQUNLRVQgPSAweDdiOyAvKiB7ICovXG5jb25zdCBDSEFSX1ZFUlRJQ0FMX0xJTkUgPSAweDdjOyAvKiB8ICovXG5jb25zdCBDSEFSX1JJR0hUX0NVUkxZX0JSQUNLRVQgPSAweDdkOyAvKiB9ICovXG5cbmNvbnN0IEVTQ0FQRV9TRVFVRU5DRVM6IHsgW2NoYXI6IG51bWJlcl06IHN0cmluZyB9ID0ge307XG5cbkVTQ0FQRV9TRVFVRU5DRVNbMHgwMF0gPSBcIlxcXFwwXCI7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4MDddID0gXCJcXFxcYVwiO1xuRVNDQVBFX1NFUVVFTkNFU1sweDA4XSA9IFwiXFxcXGJcIjtcbkVTQ0FQRV9TRVFVRU5DRVNbMHgwOV0gPSBcIlxcXFx0XCI7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4MGFdID0gXCJcXFxcblwiO1xuRVNDQVBFX1NFUVVFTkNFU1sweDBiXSA9IFwiXFxcXHZcIjtcbkVTQ0FQRV9TRVFVRU5DRVNbMHgwY10gPSBcIlxcXFxmXCI7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4MGRdID0gXCJcXFxcclwiO1xuRVNDQVBFX1NFUVVFTkNFU1sweDFiXSA9IFwiXFxcXGVcIjtcbkVTQ0FQRV9TRVFVRU5DRVNbMHgyMl0gPSAnXFxcXFwiJztcbkVTQ0FQRV9TRVFVRU5DRVNbMHg1Y10gPSBcIlxcXFxcXFxcXCI7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4ODVdID0gXCJcXFxcTlwiO1xuRVNDQVBFX1NFUVVFTkNFU1sweGEwXSA9IFwiXFxcXF9cIjtcbkVTQ0FQRV9TRVFVRU5DRVNbMHgyMDI4XSA9IFwiXFxcXExcIjtcbkVTQ0FQRV9TRVFVRU5DRVNbMHgyMDI5XSA9IFwiXFxcXFBcIjtcblxuY29uc3QgREVQUkVDQVRFRF9CT09MRUFOU19TWU5UQVggPSBbXG4gIFwieVwiLFxuICBcIllcIixcbiAgXCJ5ZXNcIixcbiAgXCJZZXNcIixcbiAgXCJZRVNcIixcbiAgXCJvblwiLFxuICBcIk9uXCIsXG4gIFwiT05cIixcbiAgXCJuXCIsXG4gIFwiTlwiLFxuICBcIm5vXCIsXG4gIFwiTm9cIixcbiAgXCJOT1wiLFxuICBcIm9mZlwiLFxuICBcIk9mZlwiLFxuICBcIk9GRlwiLFxuXTtcblxuZnVuY3Rpb24gZW5jb2RlSGV4KGNoYXJhY3RlcjogbnVtYmVyKTogc3RyaW5nIHtcbiAgY29uc3Qgc3RyaW5nID0gY2hhcmFjdGVyLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpO1xuXG4gIGxldCBoYW5kbGU6IHN0cmluZztcbiAgbGV0IGxlbmd0aDogbnVtYmVyO1xuICBpZiAoY2hhcmFjdGVyIDw9IDB4ZmYpIHtcbiAgICBoYW5kbGUgPSBcInhcIjtcbiAgICBsZW5ndGggPSAyO1xuICB9IGVsc2UgaWYgKGNoYXJhY3RlciA8PSAweGZmZmYpIHtcbiAgICBoYW5kbGUgPSBcInVcIjtcbiAgICBsZW5ndGggPSA0O1xuICB9IGVsc2UgaWYgKGNoYXJhY3RlciA8PSAweGZmZmZmZmZmKSB7XG4gICAgaGFuZGxlID0gXCJVXCI7XG4gICAgbGVuZ3RoID0gODtcbiAgfSBlbHNlIHtcbiAgICB0aHJvdyBuZXcgWUFNTEVycm9yKFxuICAgICAgXCJjb2RlIHBvaW50IHdpdGhpbiBhIHN0cmluZyBtYXkgbm90IGJlIGdyZWF0ZXIgdGhhbiAweEZGRkZGRkZGXCIsXG4gICAgKTtcbiAgfVxuXG4gIHJldHVybiBgXFxcXCR7aGFuZGxlfSR7Y29tbW9uLnJlcGVhdChcIjBcIiwgbGVuZ3RoIC0gc3RyaW5nLmxlbmd0aCl9JHtzdHJpbmd9YDtcbn1cblxuLy8gSW5kZW50cyBldmVyeSBsaW5lIGluIGEgc3RyaW5nLiBFbXB0eSBsaW5lcyAoXFxuIG9ubHkpIGFyZSBub3QgaW5kZW50ZWQuXG5mdW5jdGlvbiBpbmRlbnRTdHJpbmcoc3RyaW5nOiBzdHJpbmcsIHNwYWNlczogbnVtYmVyKTogc3RyaW5nIHtcbiAgY29uc3QgaW5kID0gY29tbW9uLnJlcGVhdChcIiBcIiwgc3BhY2VzKSxcbiAgICBsZW5ndGggPSBzdHJpbmcubGVuZ3RoO1xuICBsZXQgcG9zaXRpb24gPSAwLFxuICAgIG5leHQgPSAtMSxcbiAgICByZXN1bHQgPSBcIlwiLFxuICAgIGxpbmU6IHN0cmluZztcblxuICB3aGlsZSAocG9zaXRpb24gPCBsZW5ndGgpIHtcbiAgICBuZXh0ID0gc3RyaW5nLmluZGV4T2YoXCJcXG5cIiwgcG9zaXRpb24pO1xuICAgIGlmIChuZXh0ID09PSAtMSkge1xuICAgICAgbGluZSA9IHN0cmluZy5zbGljZShwb3NpdGlvbik7XG4gICAgICBwb3NpdGlvbiA9IGxlbmd0aDtcbiAgICB9IGVsc2Uge1xuICAgICAgbGluZSA9IHN0cmluZy5zbGljZShwb3NpdGlvbiwgbmV4dCArIDEpO1xuICAgICAgcG9zaXRpb24gPSBuZXh0ICsgMTtcbiAgICB9XG5cbiAgICBpZiAobGluZS5sZW5ndGggJiYgbGluZSAhPT0gXCJcXG5cIikgcmVzdWx0ICs9IGluZDtcblxuICAgIHJlc3VsdCArPSBsaW5lO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuZnVuY3Rpb24gZ2VuZXJhdGVOZXh0TGluZShzdGF0ZTogRHVtcGVyU3RhdGUsIGxldmVsOiBudW1iZXIpOiBzdHJpbmcge1xuICByZXR1cm4gYFxcbiR7Y29tbW9uLnJlcGVhdChcIiBcIiwgc3RhdGUuaW5kZW50ICogbGV2ZWwpfWA7XG59XG5cbmZ1bmN0aW9uIHRlc3RJbXBsaWNpdFJlc29sdmluZyhzdGF0ZTogRHVtcGVyU3RhdGUsIHN0cjogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGxldCB0eXBlOiBUeXBlO1xuICBmb3IgKFxuICAgIGxldCBpbmRleCA9IDAsIGxlbmd0aCA9IHN0YXRlLmltcGxpY2l0VHlwZXMubGVuZ3RoO1xuICAgIGluZGV4IDwgbGVuZ3RoO1xuICAgIGluZGV4ICs9IDFcbiAgKSB7XG4gICAgdHlwZSA9IHN0YXRlLmltcGxpY2l0VHlwZXNbaW5kZXhdO1xuXG4gICAgaWYgKHR5cGUucmVzb2x2ZShzdHIpKSB7XG4gICAgICByZXR1cm4gdHJ1ZTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gZmFsc2U7XG59XG5cbi8vIFszM10gcy13aGl0ZSA6Oj0gcy1zcGFjZSB8IHMtdGFiXG5mdW5jdGlvbiBpc1doaXRlc3BhY2UoYzogbnVtYmVyKTogYm9vbGVhbiB7XG4gIHJldHVybiBjID09PSBDSEFSX1NQQUNFIHx8IGMgPT09IENIQVJfVEFCO1xufVxuXG4vLyBSZXR1cm5zIHRydWUgaWYgdGhlIGNoYXJhY3RlciBjYW4gYmUgcHJpbnRlZCB3aXRob3V0IGVzY2FwaW5nLlxuLy8gRnJvbSBZQU1MIDEuMjogXCJhbnkgYWxsb3dlZCBjaGFyYWN0ZXJzIGtub3duIHRvIGJlIG5vbi1wcmludGFibGVcbi8vIHNob3VsZCBhbHNvIGJlIGVzY2FwZWQuIFtIb3dldmVyLF0gVGhpcyBpc27igJl0IG1hbmRhdG9yeVwiXG4vLyBEZXJpdmVkIGZyb20gbmItY2hhciAtIFxcdCAtICN4ODUgLSAjeEEwIC0gI3gyMDI4IC0gI3gyMDI5LlxuZnVuY3Rpb24gaXNQcmludGFibGUoYzogbnVtYmVyKTogYm9vbGVhbiB7XG4gIHJldHVybiAoXG4gICAgKDB4MDAwMjAgPD0gYyAmJiBjIDw9IDB4MDAwMDdlKSB8fFxuICAgICgweDAwMGExIDw9IGMgJiYgYyA8PSAweDAwZDdmZiAmJiBjICE9PSAweDIwMjggJiYgYyAhPT0gMHgyMDI5KSB8fFxuICAgICgweDBlMDAwIDw9IGMgJiYgYyA8PSAweDAwZmZmZCAmJiBjICE9PSAweGZlZmYpIC8qIEJPTSAqLyB8fFxuICAgICgweDEwMDAwIDw9IGMgJiYgYyA8PSAweDEwZmZmZilcbiAgKTtcbn1cblxuLy8gU2ltcGxpZmllZCB0ZXN0IGZvciB2YWx1ZXMgYWxsb3dlZCBhZnRlciB0aGUgZmlyc3QgY2hhcmFjdGVyIGluIHBsYWluIHN0eWxlLlxuZnVuY3Rpb24gaXNQbGFpblNhZmUoYzogbnVtYmVyKTogYm9vbGVhbiB7XG4gIC8vIFVzZXMgYSBzdWJzZXQgb2YgbmItY2hhciAtIGMtZmxvdy1pbmRpY2F0b3IgLSBcIjpcIiAtIFwiI1wiXG4gIC8vIHdoZXJlIG5iLWNoYXIgOjo9IGMtcHJpbnRhYmxlIC0gYi1jaGFyIC0gYy1ieXRlLW9yZGVyLW1hcmsuXG4gIHJldHVybiAoXG4gICAgaXNQcmludGFibGUoYykgJiZcbiAgICBjICE9PSAweGZlZmYgJiZcbiAgICAvLyAtIGMtZmxvdy1pbmRpY2F0b3JcbiAgICBjICE9PSBDSEFSX0NPTU1BICYmXG4gICAgYyAhPT0gQ0hBUl9MRUZUX1NRVUFSRV9CUkFDS0VUICYmXG4gICAgYyAhPT0gQ0hBUl9SSUdIVF9TUVVBUkVfQlJBQ0tFVCAmJlxuICAgIGMgIT09IENIQVJfTEVGVF9DVVJMWV9CUkFDS0VUICYmXG4gICAgYyAhPT0gQ0hBUl9SSUdIVF9DVVJMWV9CUkFDS0VUICYmXG4gICAgLy8gLSBcIjpcIiAtIFwiI1wiXG4gICAgYyAhPT0gQ0hBUl9DT0xPTiAmJlxuICAgIGMgIT09IENIQVJfU0hBUlBcbiAgKTtcbn1cblxuLy8gU2ltcGxpZmllZCB0ZXN0IGZvciB2YWx1ZXMgYWxsb3dlZCBhcyB0aGUgZmlyc3QgY2hhcmFjdGVyIGluIHBsYWluIHN0eWxlLlxuZnVuY3Rpb24gaXNQbGFpblNhZmVGaXJzdChjOiBudW1iZXIpOiBib29sZWFuIHtcbiAgLy8gVXNlcyBhIHN1YnNldCBvZiBucy1jaGFyIC0gYy1pbmRpY2F0b3JcbiAgLy8gd2hlcmUgbnMtY2hhciA9IG5iLWNoYXIgLSBzLXdoaXRlLlxuICByZXR1cm4gKFxuICAgIGlzUHJpbnRhYmxlKGMpICYmXG4gICAgYyAhPT0gMHhmZWZmICYmXG4gICAgIWlzV2hpdGVzcGFjZShjKSAmJiAvLyAtIHMtd2hpdGVcbiAgICAvLyAtIChjLWluZGljYXRvciA6Oj1cbiAgICAvLyDigJwt4oCdIHwg4oCcP+KAnSB8IOKAnDrigJ0gfCDigJws4oCdIHwg4oCcW+KAnSB8IOKAnF3igJ0gfCDigJx74oCdIHwg4oCcfeKAnVxuICAgIGMgIT09IENIQVJfTUlOVVMgJiZcbiAgICBjICE9PSBDSEFSX1FVRVNUSU9OICYmXG4gICAgYyAhPT0gQ0hBUl9DT0xPTiAmJlxuICAgIGMgIT09IENIQVJfQ09NTUEgJiZcbiAgICBjICE9PSBDSEFSX0xFRlRfU1FVQVJFX0JSQUNLRVQgJiZcbiAgICBjICE9PSBDSEFSX1JJR0hUX1NRVUFSRV9CUkFDS0VUICYmXG4gICAgYyAhPT0gQ0hBUl9MRUZUX0NVUkxZX0JSQUNLRVQgJiZcbiAgICBjICE9PSBDSEFSX1JJR0hUX0NVUkxZX0JSQUNLRVQgJiZcbiAgICAvLyB8IOKAnCPigJ0gfCDigJwm4oCdIHwg4oCcKuKAnSB8IOKAnCHigJ0gfCDigJx84oCdIHwg4oCcPuKAnSB8IOKAnCfigJ0gfCDigJxcIuKAnVxuICAgIGMgIT09IENIQVJfU0hBUlAgJiZcbiAgICBjICE9PSBDSEFSX0FNUEVSU0FORCAmJlxuICAgIGMgIT09IENIQVJfQVNURVJJU0sgJiZcbiAgICBjICE9PSBDSEFSX0VYQ0xBTUFUSU9OICYmXG4gICAgYyAhPT0gQ0hBUl9WRVJUSUNBTF9MSU5FICYmXG4gICAgYyAhPT0gQ0hBUl9HUkVBVEVSX1RIQU4gJiZcbiAgICBjICE9PSBDSEFSX1NJTkdMRV9RVU9URSAmJlxuICAgIGMgIT09IENIQVJfRE9VQkxFX1FVT1RFICYmXG4gICAgLy8gfCDigJwl4oCdIHwg4oCcQOKAnSB8IOKAnGDigJ0pXG4gICAgYyAhPT0gQ0hBUl9QRVJDRU5UICYmXG4gICAgYyAhPT0gQ0hBUl9DT01NRVJDSUFMX0FUICYmXG4gICAgYyAhPT0gQ0hBUl9HUkFWRV9BQ0NFTlRcbiAgKTtcbn1cblxuLy8gRGV0ZXJtaW5lcyB3aGV0aGVyIGJsb2NrIGluZGVudGF0aW9uIGluZGljYXRvciBpcyByZXF1aXJlZC5cbmZ1bmN0aW9uIG5lZWRJbmRlbnRJbmRpY2F0b3Ioc3RyaW5nOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgY29uc3QgbGVhZGluZ1NwYWNlUmUgPSAvXlxcbiogLztcbiAgcmV0dXJuIGxlYWRpbmdTcGFjZVJlLnRlc3Qoc3RyaW5nKTtcbn1cblxuY29uc3QgU1RZTEVfUExBSU4gPSAxLFxuICBTVFlMRV9TSU5HTEUgPSAyLFxuICBTVFlMRV9MSVRFUkFMID0gMyxcbiAgU1RZTEVfRk9MREVEID0gNCxcbiAgU1RZTEVfRE9VQkxFID0gNTtcblxuLy8gRGV0ZXJtaW5lcyB3aGljaCBzY2FsYXIgc3R5bGVzIGFyZSBwb3NzaWJsZSBhbmQgcmV0dXJucyB0aGUgcHJlZmVycmVkIHN0eWxlLlxuLy8gbGluZVdpZHRoID0gLTEgPT4gbm8gbGltaXQuXG4vLyBQcmUtY29uZGl0aW9uczogc3RyLmxlbmd0aCA+IDAuXG4vLyBQb3N0LWNvbmRpdGlvbnM6XG4vLyAgU1RZTEVfUExBSU4gb3IgU1RZTEVfU0lOR0xFID0+IG5vIFxcbiBhcmUgaW4gdGhlIHN0cmluZy5cbi8vICBTVFlMRV9MSVRFUkFMID0+IG5vIGxpbmVzIGFyZSBzdWl0YWJsZSBmb3IgZm9sZGluZyAob3IgbGluZVdpZHRoIGlzIC0xKS5cbi8vICBTVFlMRV9GT0xERUQgPT4gYSBsaW5lID4gbGluZVdpZHRoIGFuZCBjYW4gYmUgZm9sZGVkIChhbmQgbGluZVdpZHRoICE9IC0xKS5cbmZ1bmN0aW9uIGNob29zZVNjYWxhclN0eWxlKFxuICBzdHJpbmc6IHN0cmluZyxcbiAgc2luZ2xlTGluZU9ubHk6IGJvb2xlYW4sXG4gIGluZGVudFBlckxldmVsOiBudW1iZXIsXG4gIGxpbmVXaWR0aDogbnVtYmVyLFxuICB0ZXN0QW1iaWd1b3VzVHlwZTogKC4uLmFyZ3M6IEFueVtdKSA9PiBBbnksXG4pOiBudW1iZXIge1xuICBjb25zdCBzaG91bGRUcmFja1dpZHRoID0gbGluZVdpZHRoICE9PSAtMTtcbiAgbGV0IGhhc0xpbmVCcmVhayA9IGZhbHNlLFxuICAgIGhhc0ZvbGRhYmxlTGluZSA9IGZhbHNlLCAvLyBvbmx5IGNoZWNrZWQgaWYgc2hvdWxkVHJhY2tXaWR0aFxuICAgIHByZXZpb3VzTGluZUJyZWFrID0gLTEsIC8vIGNvdW50IHRoZSBmaXJzdCBsaW5lIGNvcnJlY3RseVxuICAgIHBsYWluID0gaXNQbGFpblNhZmVGaXJzdChzdHJpbmcuY2hhckNvZGVBdCgwKSkgJiZcbiAgICAgICFpc1doaXRlc3BhY2Uoc3RyaW5nLmNoYXJDb2RlQXQoc3RyaW5nLmxlbmd0aCAtIDEpKTtcblxuICBsZXQgY2hhcjogbnVtYmVyLCBpOiBudW1iZXI7XG4gIGlmIChzaW5nbGVMaW5lT25seSkge1xuICAgIC8vIENhc2U6IG5vIGJsb2NrIHN0eWxlcy5cbiAgICAvLyBDaGVjayBmb3IgZGlzYWxsb3dlZCBjaGFyYWN0ZXJzIHRvIHJ1bGUgb3V0IHBsYWluIGFuZCBzaW5nbGUuXG4gICAgZm9yIChpID0gMDsgaSA8IHN0cmluZy5sZW5ndGg7IGkrKykge1xuICAgICAgY2hhciA9IHN0cmluZy5jaGFyQ29kZUF0KGkpO1xuICAgICAgaWYgKCFpc1ByaW50YWJsZShjaGFyKSkge1xuICAgICAgICByZXR1cm4gU1RZTEVfRE9VQkxFO1xuICAgICAgfVxuICAgICAgcGxhaW4gPSBwbGFpbiAmJiBpc1BsYWluU2FmZShjaGFyKTtcbiAgICB9XG4gIH0gZWxzZSB7XG4gICAgLy8gQ2FzZTogYmxvY2sgc3R5bGVzIHBlcm1pdHRlZC5cbiAgICBmb3IgKGkgPSAwOyBpIDwgc3RyaW5nLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjaGFyID0gc3RyaW5nLmNoYXJDb2RlQXQoaSk7XG4gICAgICBpZiAoY2hhciA9PT0gQ0hBUl9MSU5FX0ZFRUQpIHtcbiAgICAgICAgaGFzTGluZUJyZWFrID0gdHJ1ZTtcbiAgICAgICAgLy8gQ2hlY2sgaWYgYW55IGxpbmUgY2FuIGJlIGZvbGRlZC5cbiAgICAgICAgaWYgKHNob3VsZFRyYWNrV2lkdGgpIHtcbiAgICAgICAgICBoYXNGb2xkYWJsZUxpbmUgPSBoYXNGb2xkYWJsZUxpbmUgfHxcbiAgICAgICAgICAgIC8vIEZvbGRhYmxlIGxpbmUgPSB0b28gbG9uZywgYW5kIG5vdCBtb3JlLWluZGVudGVkLlxuICAgICAgICAgICAgKGkgLSBwcmV2aW91c0xpbmVCcmVhayAtIDEgPiBsaW5lV2lkdGggJiZcbiAgICAgICAgICAgICAgc3RyaW5nW3ByZXZpb3VzTGluZUJyZWFrICsgMV0gIT09IFwiIFwiKTtcbiAgICAgICAgICBwcmV2aW91c0xpbmVCcmVhayA9IGk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSBpZiAoIWlzUHJpbnRhYmxlKGNoYXIpKSB7XG4gICAgICAgIHJldHVybiBTVFlMRV9ET1VCTEU7XG4gICAgICB9XG4gICAgICBwbGFpbiA9IHBsYWluICYmIGlzUGxhaW5TYWZlKGNoYXIpO1xuICAgIH1cbiAgICAvLyBpbiBjYXNlIHRoZSBlbmQgaXMgbWlzc2luZyBhIFxcblxuICAgIGhhc0ZvbGRhYmxlTGluZSA9IGhhc0ZvbGRhYmxlTGluZSB8fFxuICAgICAgKHNob3VsZFRyYWNrV2lkdGggJiZcbiAgICAgICAgaSAtIHByZXZpb3VzTGluZUJyZWFrIC0gMSA+IGxpbmVXaWR0aCAmJlxuICAgICAgICBzdHJpbmdbcHJldmlvdXNMaW5lQnJlYWsgKyAxXSAhPT0gXCIgXCIpO1xuICB9XG4gIC8vIEFsdGhvdWdoIGV2ZXJ5IHN0eWxlIGNhbiByZXByZXNlbnQgXFxuIHdpdGhvdXQgZXNjYXBpbmcsIHByZWZlciBibG9jayBzdHlsZXNcbiAgLy8gZm9yIG11bHRpbGluZSwgc2luY2UgdGhleSdyZSBtb3JlIHJlYWRhYmxlIGFuZCB0aGV5IGRvbid0IGFkZCBlbXB0eSBsaW5lcy5cbiAgLy8gQWxzbyBwcmVmZXIgZm9sZGluZyBhIHN1cGVyLWxvbmcgbGluZS5cbiAgaWYgKCFoYXNMaW5lQnJlYWsgJiYgIWhhc0ZvbGRhYmxlTGluZSkge1xuICAgIC8vIFN0cmluZ3MgaW50ZXJwcmV0YWJsZSBhcyBhbm90aGVyIHR5cGUgaGF2ZSB0byBiZSBxdW90ZWQ7XG4gICAgLy8gZS5nLiB0aGUgc3RyaW5nICd0cnVlJyB2cy4gdGhlIGJvb2xlYW4gdHJ1ZS5cbiAgICByZXR1cm4gcGxhaW4gJiYgIXRlc3RBbWJpZ3VvdXNUeXBlKHN0cmluZykgPyBTVFlMRV9QTEFJTiA6IFNUWUxFX1NJTkdMRTtcbiAgfVxuICAvLyBFZGdlIGNhc2U6IGJsb2NrIGluZGVudGF0aW9uIGluZGljYXRvciBjYW4gb25seSBoYXZlIG9uZSBkaWdpdC5cbiAgaWYgKGluZGVudFBlckxldmVsID4gOSAmJiBuZWVkSW5kZW50SW5kaWNhdG9yKHN0cmluZykpIHtcbiAgICByZXR1cm4gU1RZTEVfRE9VQkxFO1xuICB9XG4gIC8vIEF0IHRoaXMgcG9pbnQgd2Uga25vdyBibG9jayBzdHlsZXMgYXJlIHZhbGlkLlxuICAvLyBQcmVmZXIgbGl0ZXJhbCBzdHlsZSB1bmxlc3Mgd2Ugd2FudCB0byBmb2xkLlxuICByZXR1cm4gaGFzRm9sZGFibGVMaW5lID8gU1RZTEVfRk9MREVEIDogU1RZTEVfTElURVJBTDtcbn1cblxuLy8gR3JlZWR5IGxpbmUgYnJlYWtpbmcuXG4vLyBQaWNrcyB0aGUgbG9uZ2VzdCBsaW5lIHVuZGVyIHRoZSBsaW1pdCBlYWNoIHRpbWUsXG4vLyBvdGhlcndpc2Ugc2V0dGxlcyBmb3IgdGhlIHNob3J0ZXN0IGxpbmUgb3ZlciB0aGUgbGltaXQuXG4vLyBOQi4gTW9yZS1pbmRlbnRlZCBsaW5lcyAqY2Fubm90KiBiZSBmb2xkZWQsIGFzIHRoYXQgd291bGQgYWRkIGFuIGV4dHJhIFxcbi5cbmZ1bmN0aW9uIGZvbGRMaW5lKGxpbmU6IHN0cmluZywgd2lkdGg6IG51bWJlcik6IHN0cmluZyB7XG4gIGlmIChsaW5lID09PSBcIlwiIHx8IGxpbmVbMF0gPT09IFwiIFwiKSByZXR1cm4gbGluZTtcblxuICAvLyBTaW5jZSBhIG1vcmUtaW5kZW50ZWQgbGluZSBhZGRzIGEgXFxuLCBicmVha3MgY2FuJ3QgYmUgZm9sbG93ZWQgYnkgYSBzcGFjZS5cbiAgY29uc3QgYnJlYWtSZSA9IC8gW14gXS9nOyAvLyBub3RlOiB0aGUgbWF0Y2ggaW5kZXggd2lsbCBhbHdheXMgYmUgPD0gbGVuZ3RoLTIuXG4gIGxldCBtYXRjaDtcbiAgLy8gc3RhcnQgaXMgYW4gaW5jbHVzaXZlIGluZGV4LiBlbmQsIGN1cnIsIGFuZCBuZXh0IGFyZSBleGNsdXNpdmUuXG4gIGxldCBzdGFydCA9IDAsXG4gICAgZW5kLFxuICAgIGN1cnIgPSAwLFxuICAgIG5leHQgPSAwO1xuICBsZXQgcmVzdWx0ID0gXCJcIjtcblxuICAvLyBJbnZhcmlhbnRzOiAwIDw9IHN0YXJ0IDw9IGxlbmd0aC0xLlxuICAvLyAgIDAgPD0gY3VyciA8PSBuZXh0IDw9IG1heCgwLCBsZW5ndGgtMikuIGN1cnIgLSBzdGFydCA8PSB3aWR0aC5cbiAgLy8gSW5zaWRlIHRoZSBsb29wOlxuICAvLyAgIEEgbWF0Y2ggaW1wbGllcyBsZW5ndGggPj0gMiwgc28gY3VyciBhbmQgbmV4dCBhcmUgPD0gbGVuZ3RoLTIuXG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1jb25kaXRpb25hbC1hc3NpZ25tZW50XG4gIHdoaWxlICgobWF0Y2ggPSBicmVha1JlLmV4ZWMobGluZSkpKSB7XG4gICAgbmV4dCA9IG1hdGNoLmluZGV4O1xuICAgIC8vIG1haW50YWluIGludmFyaWFudDogY3VyciAtIHN0YXJ0IDw9IHdpZHRoXG4gICAgaWYgKG5leHQgLSBzdGFydCA+IHdpZHRoKSB7XG4gICAgICBlbmQgPSBjdXJyID4gc3RhcnQgPyBjdXJyIDogbmV4dDsgLy8gZGVyaXZlIGVuZCA8PSBsZW5ndGgtMlxuICAgICAgcmVzdWx0ICs9IGBcXG4ke2xpbmUuc2xpY2Uoc3RhcnQsIGVuZCl9YDtcbiAgICAgIC8vIHNraXAgdGhlIHNwYWNlIHRoYXQgd2FzIG91dHB1dCBhcyBcXG5cbiAgICAgIHN0YXJ0ID0gZW5kICsgMTsgLy8gZGVyaXZlIHN0YXJ0IDw9IGxlbmd0aC0xXG4gICAgfVxuICAgIGN1cnIgPSBuZXh0O1xuICB9XG5cbiAgLy8gQnkgdGhlIGludmFyaWFudHMsIHN0YXJ0IDw9IGxlbmd0aC0xLCBzbyB0aGVyZSBpcyBzb21ldGhpbmcgbGVmdCBvdmVyLlxuICAvLyBJdCBpcyBlaXRoZXIgdGhlIHdob2xlIHN0cmluZyBvciBhIHBhcnQgc3RhcnRpbmcgZnJvbSBub24td2hpdGVzcGFjZS5cbiAgcmVzdWx0ICs9IFwiXFxuXCI7XG4gIC8vIEluc2VydCBhIGJyZWFrIGlmIHRoZSByZW1haW5kZXIgaXMgdG9vIGxvbmcgYW5kIHRoZXJlIGlzIGEgYnJlYWsgYXZhaWxhYmxlLlxuICBpZiAobGluZS5sZW5ndGggLSBzdGFydCA+IHdpZHRoICYmIGN1cnIgPiBzdGFydCkge1xuICAgIHJlc3VsdCArPSBgJHtsaW5lLnNsaWNlKHN0YXJ0LCBjdXJyKX1cXG4ke2xpbmUuc2xpY2UoY3VyciArIDEpfWA7XG4gIH0gZWxzZSB7XG4gICAgcmVzdWx0ICs9IGxpbmUuc2xpY2Uoc3RhcnQpO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdC5zbGljZSgxKTsgLy8gZHJvcCBleHRyYSBcXG4gam9pbmVyXG59XG5cbi8vIChTZWUgdGhlIG5vdGUgZm9yIHdyaXRlU2NhbGFyLilcbmZ1bmN0aW9uIGRyb3BFbmRpbmdOZXdsaW5lKHN0cmluZzogc3RyaW5nKTogc3RyaW5nIHtcbiAgcmV0dXJuIHN0cmluZ1tzdHJpbmcubGVuZ3RoIC0gMV0gPT09IFwiXFxuXCIgPyBzdHJpbmcuc2xpY2UoMCwgLTEpIDogc3RyaW5nO1xufVxuXG4vLyBOb3RlOiBhIGxvbmcgbGluZSB3aXRob3V0IGEgc3VpdGFibGUgYnJlYWsgcG9pbnQgd2lsbCBleGNlZWQgdGhlIHdpZHRoIGxpbWl0LlxuLy8gUHJlLWNvbmRpdGlvbnM6IGV2ZXJ5IGNoYXIgaW4gc3RyIGlzUHJpbnRhYmxlLCBzdHIubGVuZ3RoID4gMCwgd2lkdGggPiAwLlxuZnVuY3Rpb24gZm9sZFN0cmluZyhzdHJpbmc6IHN0cmluZywgd2lkdGg6IG51bWJlcik6IHN0cmluZyB7XG4gIC8vIEluIGZvbGRlZCBzdHlsZSwgJGskIGNvbnNlY3V0aXZlIG5ld2xpbmVzIG91dHB1dCBhcyAkaysxJCBuZXdsaW5lc+KAlFxuICAvLyB1bmxlc3MgdGhleSdyZSBiZWZvcmUgb3IgYWZ0ZXIgYSBtb3JlLWluZGVudGVkIGxpbmUsIG9yIGF0IHRoZSB2ZXJ5XG4gIC8vIGJlZ2lubmluZyBvciBlbmQsIGluIHdoaWNoIGNhc2UgJGskIG1hcHMgdG8gJGskLlxuICAvLyBUaGVyZWZvcmUsIHBhcnNlIGVhY2ggY2h1bmsgYXMgbmV3bGluZShzKSBmb2xsb3dlZCBieSBhIGNvbnRlbnQgbGluZS5cbiAgY29uc3QgbGluZVJlID0gLyhcXG4rKShbXlxcbl0qKS9nO1xuXG4gIC8vIGZpcnN0IGxpbmUgKHBvc3NpYmx5IGFuIGVtcHR5IGxpbmUpXG4gIGxldCByZXN1bHQgPSAoKCk6IHN0cmluZyA9PiB7XG4gICAgbGV0IG5leHRMRiA9IHN0cmluZy5pbmRleE9mKFwiXFxuXCIpO1xuICAgIG5leHRMRiA9IG5leHRMRiAhPT0gLTEgPyBuZXh0TEYgOiBzdHJpbmcubGVuZ3RoO1xuICAgIGxpbmVSZS5sYXN0SW5kZXggPSBuZXh0TEY7XG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11c2UtYmVmb3JlLWRlZmluZVxuICAgIHJldHVybiBmb2xkTGluZShzdHJpbmcuc2xpY2UoMCwgbmV4dExGKSwgd2lkdGgpO1xuICB9KSgpO1xuICAvLyBJZiB3ZSBoYXZlbid0IHJlYWNoZWQgdGhlIGZpcnN0IGNvbnRlbnQgbGluZSB5ZXQsIGRvbid0IGFkZCBhbiBleHRyYSBcXG4uXG4gIGxldCBwcmV2TW9yZUluZGVudGVkID0gc3RyaW5nWzBdID09PSBcIlxcblwiIHx8IHN0cmluZ1swXSA9PT0gXCIgXCI7XG4gIGxldCBtb3JlSW5kZW50ZWQ7XG5cbiAgLy8gcmVzdCBvZiB0aGUgbGluZXNcbiAgbGV0IG1hdGNoO1xuICAvLyB0c2xpbnQ6ZGlzYWJsZS1uZXh0LWxpbmU6bm8tY29uZGl0aW9uYWwtYXNzaWdubWVudFxuICB3aGlsZSAoKG1hdGNoID0gbGluZVJlLmV4ZWMoc3RyaW5nKSkpIHtcbiAgICBjb25zdCBwcmVmaXggPSBtYXRjaFsxXSxcbiAgICAgIGxpbmUgPSBtYXRjaFsyXTtcbiAgICBtb3JlSW5kZW50ZWQgPSBsaW5lWzBdID09PSBcIiBcIjtcbiAgICByZXN1bHQgKz0gcHJlZml4ICtcbiAgICAgICghcHJldk1vcmVJbmRlbnRlZCAmJiAhbW9yZUluZGVudGVkICYmIGxpbmUgIT09IFwiXCIgPyBcIlxcblwiIDogXCJcIikgK1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11c2UtYmVmb3JlLWRlZmluZVxuICAgICAgZm9sZExpbmUobGluZSwgd2lkdGgpO1xuICAgIHByZXZNb3JlSW5kZW50ZWQgPSBtb3JlSW5kZW50ZWQ7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vLyBFc2NhcGVzIGEgZG91YmxlLXF1b3RlZCBzdHJpbmcuXG5mdW5jdGlvbiBlc2NhcGVTdHJpbmcoc3RyaW5nOiBzdHJpbmcpOiBzdHJpbmcge1xuICBsZXQgcmVzdWx0ID0gXCJcIjtcbiAgbGV0IGNoYXIsIG5leHRDaGFyO1xuICBsZXQgZXNjYXBlU2VxO1xuXG4gIGZvciAobGV0IGkgPSAwOyBpIDwgc3RyaW5nLmxlbmd0aDsgaSsrKSB7XG4gICAgY2hhciA9IHN0cmluZy5jaGFyQ29kZUF0KGkpO1xuICAgIC8vIENoZWNrIGZvciBzdXJyb2dhdGUgcGFpcnMgKHJlZmVyZW5jZSBVbmljb2RlIDMuMCBzZWN0aW9uIFwiMy43IFN1cnJvZ2F0ZXNcIikuXG4gICAgaWYgKGNoYXIgPj0gMHhkODAwICYmIGNoYXIgPD0gMHhkYmZmIC8qIGhpZ2ggc3Vycm9nYXRlICovKSB7XG4gICAgICBuZXh0Q2hhciA9IHN0cmluZy5jaGFyQ29kZUF0KGkgKyAxKTtcbiAgICAgIGlmIChuZXh0Q2hhciA+PSAweGRjMDAgJiYgbmV4dENoYXIgPD0gMHhkZmZmIC8qIGxvdyBzdXJyb2dhdGUgKi8pIHtcbiAgICAgICAgLy8gQ29tYmluZSB0aGUgc3Vycm9nYXRlIHBhaXIgYW5kIHN0b3JlIGl0IGVzY2FwZWQuXG4gICAgICAgIHJlc3VsdCArPSBlbmNvZGVIZXgoXG4gICAgICAgICAgKGNoYXIgLSAweGQ4MDApICogMHg0MDAgKyBuZXh0Q2hhciAtIDB4ZGMwMCArIDB4MTAwMDAsXG4gICAgICAgICk7XG4gICAgICAgIC8vIEFkdmFuY2UgaW5kZXggb25lIGV4dHJhIHNpbmNlIHdlIGFscmVhZHkgdXNlZCB0aGF0IGNoYXIgaGVyZS5cbiAgICAgICAgaSsrO1xuICAgICAgICBjb250aW51ZTtcbiAgICAgIH1cbiAgICB9XG4gICAgZXNjYXBlU2VxID0gRVNDQVBFX1NFUVVFTkNFU1tjaGFyXTtcbiAgICByZXN1bHQgKz0gIWVzY2FwZVNlcSAmJiBpc1ByaW50YWJsZShjaGFyKVxuICAgICAgPyBzdHJpbmdbaV1cbiAgICAgIDogZXNjYXBlU2VxIHx8IGVuY29kZUhleChjaGFyKTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIFByZS1jb25kaXRpb25zOiBzdHJpbmcgaXMgdmFsaWQgZm9yIGEgYmxvY2sgc2NhbGFyLCAxIDw9IGluZGVudFBlckxldmVsIDw9IDkuXG5mdW5jdGlvbiBibG9ja0hlYWRlcihzdHJpbmc6IHN0cmluZywgaW5kZW50UGVyTGV2ZWw6IG51bWJlcik6IHN0cmluZyB7XG4gIGNvbnN0IGluZGVudEluZGljYXRvciA9IG5lZWRJbmRlbnRJbmRpY2F0b3Ioc3RyaW5nKVxuICAgID8gU3RyaW5nKGluZGVudFBlckxldmVsKVxuICAgIDogXCJcIjtcblxuICAvLyBub3RlIHRoZSBzcGVjaWFsIGNhc2U6IHRoZSBzdHJpbmcgJ1xcbicgY291bnRzIGFzIGEgXCJ0cmFpbGluZ1wiIGVtcHR5IGxpbmUuXG4gIGNvbnN0IGNsaXAgPSBzdHJpbmdbc3RyaW5nLmxlbmd0aCAtIDFdID09PSBcIlxcblwiO1xuICBjb25zdCBrZWVwID0gY2xpcCAmJiAoc3RyaW5nW3N0cmluZy5sZW5ndGggLSAyXSA9PT0gXCJcXG5cIiB8fCBzdHJpbmcgPT09IFwiXFxuXCIpO1xuICBjb25zdCBjaG9tcCA9IGtlZXAgPyBcIitcIiA6IGNsaXAgPyBcIlwiIDogXCItXCI7XG5cbiAgcmV0dXJuIGAke2luZGVudEluZGljYXRvcn0ke2Nob21wfVxcbmA7XG59XG5cbi8vIE5vdGU6IGxpbmUgYnJlYWtpbmcvZm9sZGluZyBpcyBpbXBsZW1lbnRlZCBmb3Igb25seSB0aGUgZm9sZGVkIHN0eWxlLlxuLy8gTkIuIFdlIGRyb3AgdGhlIGxhc3QgdHJhaWxpbmcgbmV3bGluZSAoaWYgYW55KSBvZiBhIHJldHVybmVkIGJsb2NrIHNjYWxhclxuLy8gIHNpbmNlIHRoZSBkdW1wZXIgYWRkcyBpdHMgb3duIG5ld2xpbmUuIFRoaXMgYWx3YXlzIHdvcmtzOlxuLy8gICAg4oCiIE5vIGVuZGluZyBuZXdsaW5lID0+IHVuYWZmZWN0ZWQ7IGFscmVhZHkgdXNpbmcgc3RyaXAgXCItXCIgY2hvbXBpbmcuXG4vLyAgICDigKIgRW5kaW5nIG5ld2xpbmUgICAgPT4gcmVtb3ZlZCB0aGVuIHJlc3RvcmVkLlxuLy8gIEltcG9ydGFudGx5LCB0aGlzIGtlZXBzIHRoZSBcIitcIiBjaG9tcCBpbmRpY2F0b3IgZnJvbSBnYWluaW5nIGFuIGV4dHJhIGxpbmUuXG5mdW5jdGlvbiB3cml0ZVNjYWxhcihcbiAgc3RhdGU6IER1bXBlclN0YXRlLFxuICBzdHJpbmc6IHN0cmluZyxcbiAgbGV2ZWw6IG51bWJlcixcbiAgaXNrZXk6IGJvb2xlYW4sXG4pOiB2b2lkIHtcbiAgc3RhdGUuZHVtcCA9ICgoKTogc3RyaW5nID0+IHtcbiAgICBpZiAoc3RyaW5nLmxlbmd0aCA9PT0gMCkge1xuICAgICAgcmV0dXJuIFwiJydcIjtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgIXN0YXRlLm5vQ29tcGF0TW9kZSAmJlxuICAgICAgREVQUkVDQVRFRF9CT09MRUFOU19TWU5UQVguaW5kZXhPZihzdHJpbmcpICE9PSAtMVxuICAgICkge1xuICAgICAgcmV0dXJuIGAnJHtzdHJpbmd9J2A7XG4gICAgfVxuXG4gICAgY29uc3QgaW5kZW50ID0gc3RhdGUuaW5kZW50ICogTWF0aC5tYXgoMSwgbGV2ZWwpOyAvLyBubyAwLWluZGVudCBzY2FsYXJzXG4gICAgLy8gQXMgaW5kZW50YXRpb24gZ2V0cyBkZWVwZXIsIGxldCB0aGUgd2lkdGggZGVjcmVhc2UgbW9ub3RvbmljYWxseVxuICAgIC8vIHRvIHRoZSBsb3dlciBib3VuZCBtaW4oc3RhdGUubGluZVdpZHRoLCA0MCkuXG4gICAgLy8gTm90ZSB0aGF0IHRoaXMgaW1wbGllc1xuICAgIC8vICBzdGF0ZS5saW5lV2lkdGgg4omkIDQwICsgc3RhdGUuaW5kZW50OiB3aWR0aCBpcyBmaXhlZCBhdCB0aGUgbG93ZXIgYm91bmQuXG4gICAgLy8gIHN0YXRlLmxpbmVXaWR0aCA+IDQwICsgc3RhdGUuaW5kZW50OiB3aWR0aCBkZWNyZWFzZXMgdW50aWwgdGhlIGxvd2VyXG4gICAgLy8gIGJvdW5kLlxuICAgIC8vIFRoaXMgYmVoYXZlcyBiZXR0ZXIgdGhhbiBhIGNvbnN0YW50IG1pbmltdW0gd2lkdGggd2hpY2ggZGlzYWxsb3dzXG4gICAgLy8gbmFycm93ZXIgb3B0aW9ucywgb3IgYW4gaW5kZW50IHRocmVzaG9sZCB3aGljaCBjYXVzZXMgdGhlIHdpZHRoXG4gICAgLy8gdG8gc3VkZGVubHkgaW5jcmVhc2UuXG4gICAgY29uc3QgbGluZVdpZHRoID0gc3RhdGUubGluZVdpZHRoID09PSAtMVxuICAgICAgPyAtMVxuICAgICAgOiBNYXRoLm1heChNYXRoLm1pbihzdGF0ZS5saW5lV2lkdGgsIDQwKSwgc3RhdGUubGluZVdpZHRoIC0gaW5kZW50KTtcblxuICAgIC8vIFdpdGhvdXQga25vd2luZyBpZiBrZXlzIGFyZSBpbXBsaWNpdC9leHBsaWNpdCxcbiAgICAvLyBhc3N1bWUgaW1wbGljaXQgZm9yIHNhZmV0eS5cbiAgICBjb25zdCBzaW5nbGVMaW5lT25seSA9IGlza2V5IHx8XG4gICAgICAvLyBObyBibG9jayBzdHlsZXMgaW4gZmxvdyBtb2RlLlxuICAgICAgKHN0YXRlLmZsb3dMZXZlbCA+IC0xICYmIGxldmVsID49IHN0YXRlLmZsb3dMZXZlbCk7XG4gICAgZnVuY3Rpb24gdGVzdEFtYmlndWl0eShzdHI6IHN0cmluZyk6IGJvb2xlYW4ge1xuICAgICAgcmV0dXJuIHRlc3RJbXBsaWNpdFJlc29sdmluZyhzdGF0ZSwgc3RyKTtcbiAgICB9XG5cbiAgICBzd2l0Y2ggKFxuICAgICAgY2hvb3NlU2NhbGFyU3R5bGUoXG4gICAgICAgIHN0cmluZyxcbiAgICAgICAgc2luZ2xlTGluZU9ubHksXG4gICAgICAgIHN0YXRlLmluZGVudCxcbiAgICAgICAgbGluZVdpZHRoLFxuICAgICAgICB0ZXN0QW1iaWd1aXR5LFxuICAgICAgKVxuICAgICkge1xuICAgICAgY2FzZSBTVFlMRV9QTEFJTjpcbiAgICAgICAgcmV0dXJuIHN0cmluZztcbiAgICAgIGNhc2UgU1RZTEVfU0lOR0xFOlxuICAgICAgICByZXR1cm4gYCcke3N0cmluZy5yZXBsYWNlKC8nL2csIFwiJydcIil9J2A7XG4gICAgICBjYXNlIFNUWUxFX0xJVEVSQUw6XG4gICAgICAgIHJldHVybiBgfCR7YmxvY2tIZWFkZXIoc3RyaW5nLCBzdGF0ZS5pbmRlbnQpfSR7XG4gICAgICAgICAgZHJvcEVuZGluZ05ld2xpbmUoXG4gICAgICAgICAgICBpbmRlbnRTdHJpbmcoc3RyaW5nLCBpbmRlbnQpLFxuICAgICAgICAgIClcbiAgICAgICAgfWA7XG4gICAgICBjYXNlIFNUWUxFX0ZPTERFRDpcbiAgICAgICAgcmV0dXJuIGA+JHtibG9ja0hlYWRlcihzdHJpbmcsIHN0YXRlLmluZGVudCl9JHtcbiAgICAgICAgICBkcm9wRW5kaW5nTmV3bGluZShcbiAgICAgICAgICAgIGluZGVudFN0cmluZyhmb2xkU3RyaW5nKHN0cmluZywgbGluZVdpZHRoKSwgaW5kZW50KSxcbiAgICAgICAgICApXG4gICAgICAgIH1gO1xuICAgICAgY2FzZSBTVFlMRV9ET1VCTEU6XG4gICAgICAgIHJldHVybiBgXCIke2VzY2FwZVN0cmluZyhzdHJpbmcpfVwiYDtcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIHRocm93IG5ldyBZQU1MRXJyb3IoXCJpbXBvc3NpYmxlIGVycm9yOiBpbnZhbGlkIHNjYWxhciBzdHlsZVwiKTtcbiAgICB9XG4gIH0pKCk7XG59XG5cbmZ1bmN0aW9uIHdyaXRlRmxvd1NlcXVlbmNlKFxuICBzdGF0ZTogRHVtcGVyU3RhdGUsXG4gIGxldmVsOiBudW1iZXIsXG4gIG9iamVjdDogQW55LFxuKTogdm9pZCB7XG4gIGxldCBfcmVzdWx0ID0gXCJcIjtcbiAgY29uc3QgX3RhZyA9IHN0YXRlLnRhZztcblxuICBmb3IgKGxldCBpbmRleCA9IDAsIGxlbmd0aCA9IG9iamVjdC5sZW5ndGg7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgLy8gV3JpdGUgb25seSB2YWxpZCBlbGVtZW50cy5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVzZS1iZWZvcmUtZGVmaW5lXG4gICAgaWYgKHdyaXRlTm9kZShzdGF0ZSwgbGV2ZWwsIG9iamVjdFtpbmRleF0sIGZhbHNlLCBmYWxzZSkpIHtcbiAgICAgIGlmIChpbmRleCAhPT0gMCkgX3Jlc3VsdCArPSBgLCR7IXN0YXRlLmNvbmRlbnNlRmxvdyA/IFwiIFwiIDogXCJcIn1gO1xuICAgICAgX3Jlc3VsdCArPSBzdGF0ZS5kdW1wO1xuICAgIH1cbiAgfVxuXG4gIHN0YXRlLnRhZyA9IF90YWc7XG4gIHN0YXRlLmR1bXAgPSBgWyR7X3Jlc3VsdH1dYDtcbn1cblxuZnVuY3Rpb24gd3JpdGVCbG9ja1NlcXVlbmNlKFxuICBzdGF0ZTogRHVtcGVyU3RhdGUsXG4gIGxldmVsOiBudW1iZXIsXG4gIG9iamVjdDogQW55LFxuICBjb21wYWN0ID0gZmFsc2UsXG4pOiB2b2lkIHtcbiAgbGV0IF9yZXN1bHQgPSBcIlwiO1xuICBjb25zdCBfdGFnID0gc3RhdGUudGFnO1xuXG4gIGZvciAobGV0IGluZGV4ID0gMCwgbGVuZ3RoID0gb2JqZWN0Lmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICAvLyBXcml0ZSBvbmx5IHZhbGlkIGVsZW1lbnRzLlxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdXNlLWJlZm9yZS1kZWZpbmVcbiAgICBpZiAod3JpdGVOb2RlKHN0YXRlLCBsZXZlbCArIDEsIG9iamVjdFtpbmRleF0sIHRydWUsIHRydWUpKSB7XG4gICAgICBpZiAoIWNvbXBhY3QgfHwgaW5kZXggIT09IDApIHtcbiAgICAgICAgX3Jlc3VsdCArPSBnZW5lcmF0ZU5leHRMaW5lKHN0YXRlLCBsZXZlbCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChzdGF0ZS5kdW1wICYmIENIQVJfTElORV9GRUVEID09PSBzdGF0ZS5kdW1wLmNoYXJDb2RlQXQoMCkpIHtcbiAgICAgICAgX3Jlc3VsdCArPSBcIi1cIjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIF9yZXN1bHQgKz0gXCItIFwiO1xuICAgICAgfVxuXG4gICAgICBfcmVzdWx0ICs9IHN0YXRlLmR1bXA7XG4gICAgfVxuICB9XG5cbiAgc3RhdGUudGFnID0gX3RhZztcbiAgc3RhdGUuZHVtcCA9IF9yZXN1bHQgfHwgXCJbXVwiOyAvLyBFbXB0eSBzZXF1ZW5jZSBpZiBubyB2YWxpZCB2YWx1ZXMuXG59XG5cbmZ1bmN0aW9uIHdyaXRlRmxvd01hcHBpbmcoXG4gIHN0YXRlOiBEdW1wZXJTdGF0ZSxcbiAgbGV2ZWw6IG51bWJlcixcbiAgb2JqZWN0OiBBbnksXG4pOiB2b2lkIHtcbiAgbGV0IF9yZXN1bHQgPSBcIlwiO1xuICBjb25zdCBfdGFnID0gc3RhdGUudGFnLFxuICAgIG9iamVjdEtleUxpc3QgPSBPYmplY3Qua2V5cyhvYmplY3QpO1xuXG4gIGxldCBwYWlyQnVmZmVyOiBzdHJpbmcsIG9iamVjdEtleTogc3RyaW5nLCBvYmplY3RWYWx1ZTogQW55O1xuICBmb3IgKFxuICAgIGxldCBpbmRleCA9IDAsIGxlbmd0aCA9IG9iamVjdEtleUxpc3QubGVuZ3RoO1xuICAgIGluZGV4IDwgbGVuZ3RoO1xuICAgIGluZGV4ICs9IDFcbiAgKSB7XG4gICAgcGFpckJ1ZmZlciA9IHN0YXRlLmNvbmRlbnNlRmxvdyA/ICdcIicgOiBcIlwiO1xuXG4gICAgaWYgKGluZGV4ICE9PSAwKSBwYWlyQnVmZmVyICs9IFwiLCBcIjtcblxuICAgIG9iamVjdEtleSA9IG9iamVjdEtleUxpc3RbaW5kZXhdO1xuICAgIG9iamVjdFZhbHVlID0gb2JqZWN0W29iamVjdEtleV07XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVzZS1iZWZvcmUtZGVmaW5lXG4gICAgaWYgKCF3cml0ZU5vZGUoc3RhdGUsIGxldmVsLCBvYmplY3RLZXksIGZhbHNlLCBmYWxzZSkpIHtcbiAgICAgIGNvbnRpbnVlOyAvLyBTa2lwIHRoaXMgcGFpciBiZWNhdXNlIG9mIGludmFsaWQga2V5O1xuICAgIH1cblxuICAgIGlmIChzdGF0ZS5kdW1wLmxlbmd0aCA+IDEwMjQpIHBhaXJCdWZmZXIgKz0gXCI/IFwiO1xuXG4gICAgcGFpckJ1ZmZlciArPSBgJHtzdGF0ZS5kdW1wfSR7c3RhdGUuY29uZGVuc2VGbG93ID8gJ1wiJyA6IFwiXCJ9OiR7XG4gICAgICBzdGF0ZS5jb25kZW5zZUZsb3cgPyBcIlwiIDogXCIgXCJcbiAgICB9YDtcblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdXNlLWJlZm9yZS1kZWZpbmVcbiAgICBpZiAoIXdyaXRlTm9kZShzdGF0ZSwgbGV2ZWwsIG9iamVjdFZhbHVlLCBmYWxzZSwgZmFsc2UpKSB7XG4gICAgICBjb250aW51ZTsgLy8gU2tpcCB0aGlzIHBhaXIgYmVjYXVzZSBvZiBpbnZhbGlkIHZhbHVlLlxuICAgIH1cblxuICAgIHBhaXJCdWZmZXIgKz0gc3RhdGUuZHVtcDtcblxuICAgIC8vIEJvdGgga2V5IGFuZCB2YWx1ZSBhcmUgdmFsaWQuXG4gICAgX3Jlc3VsdCArPSBwYWlyQnVmZmVyO1xuICB9XG5cbiAgc3RhdGUudGFnID0gX3RhZztcbiAgc3RhdGUuZHVtcCA9IGB7JHtfcmVzdWx0fX1gO1xufVxuXG5mdW5jdGlvbiB3cml0ZUJsb2NrTWFwcGluZyhcbiAgc3RhdGU6IER1bXBlclN0YXRlLFxuICBsZXZlbDogbnVtYmVyLFxuICBvYmplY3Q6IEFueSxcbiAgY29tcGFjdCA9IGZhbHNlLFxuKTogdm9pZCB7XG4gIGNvbnN0IF90YWcgPSBzdGF0ZS50YWcsXG4gICAgb2JqZWN0S2V5TGlzdCA9IE9iamVjdC5rZXlzKG9iamVjdCk7XG4gIGxldCBfcmVzdWx0ID0gXCJcIjtcblxuICAvLyBBbGxvdyBzb3J0aW5nIGtleXMgc28gdGhhdCB0aGUgb3V0cHV0IGZpbGUgaXMgZGV0ZXJtaW5pc3RpY1xuICBpZiAoc3RhdGUuc29ydEtleXMgPT09IHRydWUpIHtcbiAgICAvLyBEZWZhdWx0IHNvcnRpbmdcbiAgICBvYmplY3RLZXlMaXN0LnNvcnQoKTtcbiAgfSBlbHNlIGlmICh0eXBlb2Ygc3RhdGUuc29ydEtleXMgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIC8vIEN1c3RvbSBzb3J0IGZ1bmN0aW9uXG4gICAgb2JqZWN0S2V5TGlzdC5zb3J0KHN0YXRlLnNvcnRLZXlzKTtcbiAgfSBlbHNlIGlmIChzdGF0ZS5zb3J0S2V5cykge1xuICAgIC8vIFNvbWV0aGluZyBpcyB3cm9uZ1xuICAgIHRocm93IG5ldyBZQU1MRXJyb3IoXCJzb3J0S2V5cyBtdXN0IGJlIGEgYm9vbGVhbiBvciBhIGZ1bmN0aW9uXCIpO1xuICB9XG5cbiAgbGV0IHBhaXJCdWZmZXIgPSBcIlwiLFxuICAgIG9iamVjdEtleTogc3RyaW5nLFxuICAgIG9iamVjdFZhbHVlOiBBbnksXG4gICAgZXhwbGljaXRQYWlyOiBib29sZWFuO1xuICBmb3IgKFxuICAgIGxldCBpbmRleCA9IDAsIGxlbmd0aCA9IG9iamVjdEtleUxpc3QubGVuZ3RoO1xuICAgIGluZGV4IDwgbGVuZ3RoO1xuICAgIGluZGV4ICs9IDFcbiAgKSB7XG4gICAgcGFpckJ1ZmZlciA9IFwiXCI7XG5cbiAgICBpZiAoIWNvbXBhY3QgfHwgaW5kZXggIT09IDApIHtcbiAgICAgIHBhaXJCdWZmZXIgKz0gZ2VuZXJhdGVOZXh0TGluZShzdGF0ZSwgbGV2ZWwpO1xuICAgIH1cblxuICAgIG9iamVjdEtleSA9IG9iamVjdEtleUxpc3RbaW5kZXhdO1xuICAgIG9iamVjdFZhbHVlID0gb2JqZWN0W29iamVjdEtleV07XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVzZS1iZWZvcmUtZGVmaW5lXG4gICAgaWYgKCF3cml0ZU5vZGUoc3RhdGUsIGxldmVsICsgMSwgb2JqZWN0S2V5LCB0cnVlLCB0cnVlLCB0cnVlKSkge1xuICAgICAgY29udGludWU7IC8vIFNraXAgdGhpcyBwYWlyIGJlY2F1c2Ugb2YgaW52YWxpZCBrZXkuXG4gICAgfVxuXG4gICAgZXhwbGljaXRQYWlyID0gKHN0YXRlLnRhZyAhPT0gbnVsbCAmJiBzdGF0ZS50YWcgIT09IFwiP1wiKSB8fFxuICAgICAgKHN0YXRlLmR1bXAgJiYgc3RhdGUuZHVtcC5sZW5ndGggPiAxMDI0KTtcblxuICAgIGlmIChleHBsaWNpdFBhaXIpIHtcbiAgICAgIGlmIChzdGF0ZS5kdW1wICYmIENIQVJfTElORV9GRUVEID09PSBzdGF0ZS5kdW1wLmNoYXJDb2RlQXQoMCkpIHtcbiAgICAgICAgcGFpckJ1ZmZlciArPSBcIj9cIjtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHBhaXJCdWZmZXIgKz0gXCI/IFwiO1xuICAgICAgfVxuICAgIH1cblxuICAgIHBhaXJCdWZmZXIgKz0gc3RhdGUuZHVtcDtcblxuICAgIGlmIChleHBsaWNpdFBhaXIpIHtcbiAgICAgIHBhaXJCdWZmZXIgKz0gZ2VuZXJhdGVOZXh0TGluZShzdGF0ZSwgbGV2ZWwpO1xuICAgIH1cblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdXNlLWJlZm9yZS1kZWZpbmVcbiAgICBpZiAoIXdyaXRlTm9kZShzdGF0ZSwgbGV2ZWwgKyAxLCBvYmplY3RWYWx1ZSwgdHJ1ZSwgZXhwbGljaXRQYWlyKSkge1xuICAgICAgY29udGludWU7IC8vIFNraXAgdGhpcyBwYWlyIGJlY2F1c2Ugb2YgaW52YWxpZCB2YWx1ZS5cbiAgICB9XG5cbiAgICBpZiAoc3RhdGUuZHVtcCAmJiBDSEFSX0xJTkVfRkVFRCA9PT0gc3RhdGUuZHVtcC5jaGFyQ29kZUF0KDApKSB7XG4gICAgICBwYWlyQnVmZmVyICs9IFwiOlwiO1xuICAgIH0gZWxzZSB7XG4gICAgICBwYWlyQnVmZmVyICs9IFwiOiBcIjtcbiAgICB9XG5cbiAgICBwYWlyQnVmZmVyICs9IHN0YXRlLmR1bXA7XG5cbiAgICAvLyBCb3RoIGtleSBhbmQgdmFsdWUgYXJlIHZhbGlkLlxuICAgIF9yZXN1bHQgKz0gcGFpckJ1ZmZlcjtcbiAgfVxuXG4gIHN0YXRlLnRhZyA9IF90YWc7XG4gIHN0YXRlLmR1bXAgPSBfcmVzdWx0IHx8IFwie31cIjsgLy8gRW1wdHkgbWFwcGluZyBpZiBubyB2YWxpZCBwYWlycy5cbn1cblxuZnVuY3Rpb24gZGV0ZWN0VHlwZShcbiAgc3RhdGU6IER1bXBlclN0YXRlLFxuICBvYmplY3Q6IEFueSxcbiAgZXhwbGljaXQgPSBmYWxzZSxcbik6IGJvb2xlYW4ge1xuICBjb25zdCB0eXBlTGlzdCA9IGV4cGxpY2l0ID8gc3RhdGUuZXhwbGljaXRUeXBlcyA6IHN0YXRlLmltcGxpY2l0VHlwZXM7XG5cbiAgbGV0IHR5cGU6IFR5cGU7XG4gIGxldCBzdHlsZTogU3R5bGVWYXJpYW50O1xuICBsZXQgX3Jlc3VsdDogc3RyaW5nO1xuICBmb3IgKGxldCBpbmRleCA9IDAsIGxlbmd0aCA9IHR5cGVMaXN0Lmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICB0eXBlID0gdHlwZUxpc3RbaW5kZXhdO1xuXG4gICAgaWYgKFxuICAgICAgKHR5cGUuaW5zdGFuY2VPZiB8fCB0eXBlLnByZWRpY2F0ZSkgJiZcbiAgICAgICghdHlwZS5pbnN0YW5jZU9mIHx8XG4gICAgICAgICh0eXBlb2Ygb2JqZWN0ID09PSBcIm9iamVjdFwiICYmIG9iamVjdCBpbnN0YW5jZW9mIHR5cGUuaW5zdGFuY2VPZikpICYmXG4gICAgICAoIXR5cGUucHJlZGljYXRlIHx8IHR5cGUucHJlZGljYXRlKG9iamVjdCkpXG4gICAgKSB7XG4gICAgICBzdGF0ZS50YWcgPSBleHBsaWNpdCA/IHR5cGUudGFnIDogXCI/XCI7XG5cbiAgICAgIGlmICh0eXBlLnJlcHJlc2VudCkge1xuICAgICAgICBzdHlsZSA9IHN0YXRlLnN0eWxlTWFwW3R5cGUudGFnXSB8fCB0eXBlLmRlZmF1bHRTdHlsZTtcblxuICAgICAgICBpZiAoX3RvU3RyaW5nLmNhbGwodHlwZS5yZXByZXNlbnQpID09PSBcIltvYmplY3QgRnVuY3Rpb25dXCIpIHtcbiAgICAgICAgICBfcmVzdWx0ID0gKHR5cGUucmVwcmVzZW50IGFzIFJlcHJlc2VudEZuKShvYmplY3QsIHN0eWxlKTtcbiAgICAgICAgfSBlbHNlIGlmIChfaGFzT3duUHJvcGVydHkuY2FsbCh0eXBlLnJlcHJlc2VudCwgc3R5bGUpKSB7XG4gICAgICAgICAgX3Jlc3VsdCA9ICh0eXBlLnJlcHJlc2VudCBhcyBBcnJheU9iamVjdDxSZXByZXNlbnRGbj4pW3N0eWxlXShcbiAgICAgICAgICAgIG9iamVjdCxcbiAgICAgICAgICAgIHN0eWxlLFxuICAgICAgICAgICk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgdGhyb3cgbmV3IFlBTUxFcnJvcihcbiAgICAgICAgICAgIGAhPCR7dHlwZS50YWd9PiB0YWcgcmVzb2x2ZXIgYWNjZXB0cyBub3QgXCIke3N0eWxlfVwiIHN0eWxlYCxcbiAgICAgICAgICApO1xuICAgICAgICB9XG5cbiAgICAgICAgc3RhdGUuZHVtcCA9IF9yZXN1bHQ7XG4gICAgICB9XG5cbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuLy8gU2VyaWFsaXplcyBgb2JqZWN0YCBhbmQgd3JpdGVzIGl0IHRvIGdsb2JhbCBgcmVzdWx0YC5cbi8vIFJldHVybnMgdHJ1ZSBvbiBzdWNjZXNzLCBvciBmYWxzZSBvbiBpbnZhbGlkIG9iamVjdC5cbi8vXG5mdW5jdGlvbiB3cml0ZU5vZGUoXG4gIHN0YXRlOiBEdW1wZXJTdGF0ZSxcbiAgbGV2ZWw6IG51bWJlcixcbiAgb2JqZWN0OiBBbnksXG4gIGJsb2NrOiBib29sZWFuLFxuICBjb21wYWN0OiBib29sZWFuLFxuICBpc2tleSA9IGZhbHNlLFxuKTogYm9vbGVhbiB7XG4gIHN0YXRlLnRhZyA9IG51bGw7XG4gIHN0YXRlLmR1bXAgPSBvYmplY3Q7XG5cbiAgaWYgKCFkZXRlY3RUeXBlKHN0YXRlLCBvYmplY3QsIGZhbHNlKSkge1xuICAgIGRldGVjdFR5cGUoc3RhdGUsIG9iamVjdCwgdHJ1ZSk7XG4gIH1cblxuICBjb25zdCB0eXBlID0gX3RvU3RyaW5nLmNhbGwoc3RhdGUuZHVtcCk7XG5cbiAgaWYgKGJsb2NrKSB7XG4gICAgYmxvY2sgPSBzdGF0ZS5mbG93TGV2ZWwgPCAwIHx8IHN0YXRlLmZsb3dMZXZlbCA+IGxldmVsO1xuICB9XG5cbiAgY29uc3Qgb2JqZWN0T3JBcnJheSA9IHR5cGUgPT09IFwiW29iamVjdCBPYmplY3RdXCIgfHwgdHlwZSA9PT0gXCJbb2JqZWN0IEFycmF5XVwiO1xuXG4gIGxldCBkdXBsaWNhdGVJbmRleCA9IC0xO1xuICBsZXQgZHVwbGljYXRlID0gZmFsc2U7XG4gIGlmIChvYmplY3RPckFycmF5KSB7XG4gICAgZHVwbGljYXRlSW5kZXggPSBzdGF0ZS5kdXBsaWNhdGVzLmluZGV4T2Yob2JqZWN0KTtcbiAgICBkdXBsaWNhdGUgPSBkdXBsaWNhdGVJbmRleCAhPT0gLTE7XG4gIH1cblxuICBpZiAoXG4gICAgKHN0YXRlLnRhZyAhPT0gbnVsbCAmJiBzdGF0ZS50YWcgIT09IFwiP1wiKSB8fFxuICAgIGR1cGxpY2F0ZSB8fFxuICAgIChzdGF0ZS5pbmRlbnQgIT09IDIgJiYgbGV2ZWwgPiAwKVxuICApIHtcbiAgICBjb21wYWN0ID0gZmFsc2U7XG4gIH1cblxuICBpZiAoZHVwbGljYXRlICYmIHN0YXRlLnVzZWREdXBsaWNhdGVzW2R1cGxpY2F0ZUluZGV4XSkge1xuICAgIHN0YXRlLmR1bXAgPSBgKnJlZl8ke2R1cGxpY2F0ZUluZGV4fWA7XG4gIH0gZWxzZSB7XG4gICAgaWYgKG9iamVjdE9yQXJyYXkgJiYgZHVwbGljYXRlICYmICFzdGF0ZS51c2VkRHVwbGljYXRlc1tkdXBsaWNhdGVJbmRleF0pIHtcbiAgICAgIHN0YXRlLnVzZWREdXBsaWNhdGVzW2R1cGxpY2F0ZUluZGV4XSA9IHRydWU7XG4gICAgfVxuICAgIGlmICh0eXBlID09PSBcIltvYmplY3QgT2JqZWN0XVwiKSB7XG4gICAgICBpZiAoYmxvY2sgJiYgT2JqZWN0LmtleXMoc3RhdGUuZHVtcCkubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgIHdyaXRlQmxvY2tNYXBwaW5nKHN0YXRlLCBsZXZlbCwgc3RhdGUuZHVtcCwgY29tcGFjdCk7XG4gICAgICAgIGlmIChkdXBsaWNhdGUpIHtcbiAgICAgICAgICBzdGF0ZS5kdW1wID0gYCZyZWZfJHtkdXBsaWNhdGVJbmRleH0ke3N0YXRlLmR1bXB9YDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd3JpdGVGbG93TWFwcGluZyhzdGF0ZSwgbGV2ZWwsIHN0YXRlLmR1bXApO1xuICAgICAgICBpZiAoZHVwbGljYXRlKSB7XG4gICAgICAgICAgc3RhdGUuZHVtcCA9IGAmcmVmXyR7ZHVwbGljYXRlSW5kZXh9ICR7c3RhdGUuZHVtcH1gO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlID09PSBcIltvYmplY3QgQXJyYXldXCIpIHtcbiAgICAgIGNvbnN0IGFycmF5TGV2ZWwgPSBzdGF0ZS5ub0FycmF5SW5kZW50ICYmIGxldmVsID4gMCA/IGxldmVsIC0gMSA6IGxldmVsO1xuICAgICAgaWYgKGJsb2NrICYmIHN0YXRlLmR1bXAubGVuZ3RoICE9PSAwKSB7XG4gICAgICAgIHdyaXRlQmxvY2tTZXF1ZW5jZShzdGF0ZSwgYXJyYXlMZXZlbCwgc3RhdGUuZHVtcCwgY29tcGFjdCk7XG4gICAgICAgIGlmIChkdXBsaWNhdGUpIHtcbiAgICAgICAgICBzdGF0ZS5kdW1wID0gYCZyZWZfJHtkdXBsaWNhdGVJbmRleH0ke3N0YXRlLmR1bXB9YDtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgd3JpdGVGbG93U2VxdWVuY2Uoc3RhdGUsIGFycmF5TGV2ZWwsIHN0YXRlLmR1bXApO1xuICAgICAgICBpZiAoZHVwbGljYXRlKSB7XG4gICAgICAgICAgc3RhdGUuZHVtcCA9IGAmcmVmXyR7ZHVwbGljYXRlSW5kZXh9ICR7c3RhdGUuZHVtcH1gO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICh0eXBlID09PSBcIltvYmplY3QgU3RyaW5nXVwiKSB7XG4gICAgICBpZiAoc3RhdGUudGFnICE9PSBcIj9cIikge1xuICAgICAgICB3cml0ZVNjYWxhcihzdGF0ZSwgc3RhdGUuZHVtcCwgbGV2ZWwsIGlza2V5KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHN0YXRlLnNraXBJbnZhbGlkKSByZXR1cm4gZmFsc2U7XG4gICAgICB0aHJvdyBuZXcgWUFNTEVycm9yKGB1bmFjY2VwdGFibGUga2luZCBvZiBhbiBvYmplY3QgdG8gZHVtcCAke3R5cGV9YCk7XG4gICAgfVxuXG4gICAgaWYgKHN0YXRlLnRhZyAhPT0gbnVsbCAmJiBzdGF0ZS50YWcgIT09IFwiP1wiKSB7XG4gICAgICBzdGF0ZS5kdW1wID0gYCE8JHtzdGF0ZS50YWd9PiAke3N0YXRlLmR1bXB9YDtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gaW5zcGVjdE5vZGUoXG4gIG9iamVjdDogQW55LFxuICBvYmplY3RzOiBBbnlbXSxcbiAgZHVwbGljYXRlc0luZGV4ZXM6IG51bWJlcltdLFxuKTogdm9pZCB7XG4gIGlmIChvYmplY3QgIT09IG51bGwgJiYgdHlwZW9mIG9iamVjdCA9PT0gXCJvYmplY3RcIikge1xuICAgIGNvbnN0IGluZGV4ID0gb2JqZWN0cy5pbmRleE9mKG9iamVjdCk7XG4gICAgaWYgKGluZGV4ICE9PSAtMSkge1xuICAgICAgaWYgKGR1cGxpY2F0ZXNJbmRleGVzLmluZGV4T2YoaW5kZXgpID09PSAtMSkge1xuICAgICAgICBkdXBsaWNhdGVzSW5kZXhlcy5wdXNoKGluZGV4KTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgb2JqZWN0cy5wdXNoKG9iamVjdCk7XG5cbiAgICAgIGlmIChBcnJheS5pc0FycmF5KG9iamVjdCkpIHtcbiAgICAgICAgZm9yIChsZXQgaWR4ID0gMCwgbGVuZ3RoID0gb2JqZWN0Lmxlbmd0aDsgaWR4IDwgbGVuZ3RoOyBpZHggKz0gMSkge1xuICAgICAgICAgIGluc3BlY3ROb2RlKG9iamVjdFtpZHhdLCBvYmplY3RzLCBkdXBsaWNhdGVzSW5kZXhlcyk7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNvbnN0IG9iamVjdEtleUxpc3QgPSBPYmplY3Qua2V5cyhvYmplY3QpO1xuXG4gICAgICAgIGZvciAoXG4gICAgICAgICAgbGV0IGlkeCA9IDAsIGxlbmd0aCA9IG9iamVjdEtleUxpc3QubGVuZ3RoO1xuICAgICAgICAgIGlkeCA8IGxlbmd0aDtcbiAgICAgICAgICBpZHggKz0gMVxuICAgICAgICApIHtcbiAgICAgICAgICBpbnNwZWN0Tm9kZShvYmplY3Rbb2JqZWN0S2V5TGlzdFtpZHhdXSwgb2JqZWN0cywgZHVwbGljYXRlc0luZGV4ZXMpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGdldER1cGxpY2F0ZVJlZmVyZW5jZXMoXG4gIG9iamVjdDogUmVjb3JkPHN0cmluZywgdW5rbm93bj4sXG4gIHN0YXRlOiBEdW1wZXJTdGF0ZSxcbik6IHZvaWQge1xuICBjb25zdCBvYmplY3RzOiBBbnlbXSA9IFtdLFxuICAgIGR1cGxpY2F0ZXNJbmRleGVzOiBudW1iZXJbXSA9IFtdO1xuXG4gIGluc3BlY3ROb2RlKG9iamVjdCwgb2JqZWN0cywgZHVwbGljYXRlc0luZGV4ZXMpO1xuXG4gIGNvbnN0IGxlbmd0aCA9IGR1cGxpY2F0ZXNJbmRleGVzLmxlbmd0aDtcbiAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIHN0YXRlLmR1cGxpY2F0ZXMucHVzaChvYmplY3RzW2R1cGxpY2F0ZXNJbmRleGVzW2luZGV4XV0pO1xuICB9XG4gIHN0YXRlLnVzZWREdXBsaWNhdGVzID0gbmV3IEFycmF5KGxlbmd0aCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBkdW1wKGlucHV0OiBBbnksIG9wdGlvbnM/OiBEdW1wZXJTdGF0ZU9wdGlvbnMpOiBzdHJpbmcge1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICBjb25zdCBzdGF0ZSA9IG5ldyBEdW1wZXJTdGF0ZShvcHRpb25zKTtcblxuICBpZiAoIXN0YXRlLm5vUmVmcykgZ2V0RHVwbGljYXRlUmVmZXJlbmNlcyhpbnB1dCwgc3RhdGUpO1xuXG4gIGlmICh3cml0ZU5vZGUoc3RhdGUsIDAsIGlucHV0LCB0cnVlLCB0cnVlKSkgcmV0dXJuIGAke3N0YXRlLmR1bXB9XFxuYDtcblxuICByZXR1cm4gXCJcIjtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUErQixBQUEvQiw2QkFBK0I7QUFDL0IsRUFBb0YsQUFBcEYsa0ZBQW9GO0FBQ3BGLEVBQTBFLEFBQTFFLHdFQUEwRTtBQUMxRSxFQUEwRSxBQUExRSx3RUFBMEU7QUFFMUUsTUFBTSxHQUFHLFNBQVMsUUFBUSxDQUFhO0FBRXZDLE1BQU0sTUFBTSxNQUFNLE1BQU0sQ0FBYTtBQUNyQyxNQUFNLEdBQUcsV0FBVyxRQUE0QixDQUFtQjtBQUtuRSxLQUFLLENBQUMsU0FBUyxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsUUFBUTtBQUMzQyxLQUFLLENBQUMsZUFBZSxHQUFHLE1BQU0sQ0FBQyxTQUFTLENBQUMsY0FBYztBQUV2RCxLQUFLLENBQUMsUUFBUSxHQUFHLENBQUksQ0FBRSxDQUFTLEFBQVQsRUFBUyxBQUFULEtBQVMsQUFBVCxFQUFTO0FBQ2hDLEtBQUssQ0FBQyxjQUFjLEdBQUcsRUFBSSxDQUFFLENBQVEsQUFBUixFQUFRLEFBQVIsSUFBUSxBQUFSLEVBQVE7QUFDckMsS0FBSyxDQUFDLFVBQVUsR0FBRyxFQUFJLENBQUUsQ0FBVyxBQUFYLEVBQVcsQUFBWCxPQUFXLEFBQVgsRUFBVztBQUNwQyxLQUFLLENBQUMsZ0JBQWdCLEdBQUcsRUFBSSxDQUFFLENBQU8sQUFBUCxFQUFPLEFBQVAsR0FBTyxBQUFQLEVBQU87QUFDdEMsS0FBSyxDQUFDLGlCQUFpQixHQUFHLEVBQUksQ0FBRSxDQUFPLEFBQVAsRUFBTyxBQUFQLEdBQU8sQUFBUCxFQUFPO0FBQ3ZDLEtBQUssQ0FBQyxVQUFVLEdBQUcsRUFBSSxDQUFFLENBQU8sQUFBUCxFQUFPLEFBQVAsR0FBTyxBQUFQLEVBQU87QUFDaEMsS0FBSyxDQUFDLFlBQVksR0FBRyxFQUFJLENBQUUsQ0FBTyxBQUFQLEVBQU8sQUFBUCxHQUFPLEFBQVAsRUFBTztBQUNsQyxLQUFLLENBQUMsY0FBYyxHQUFHLEVBQUksQ0FBRSxDQUFPLEFBQVAsRUFBTyxBQUFQLEdBQU8sQUFBUCxFQUFPO0FBQ3BDLEtBQUssQ0FBQyxpQkFBaUIsR0FBRyxFQUFJLENBQUUsQ0FBTyxBQUFQLEVBQU8sQUFBUCxHQUFPLEFBQVAsRUFBTztBQUN2QyxLQUFLLENBQUMsYUFBYSxHQUFHLEVBQUksQ0FBRSxDQUFPLEFBQVAsRUFBTyxBQUFQLEdBQU8sQUFBUCxFQUFPO0FBQ25DLEtBQUssQ0FBQyxVQUFVLEdBQUcsRUFBSSxDQUFFLENBQU8sQUFBUCxFQUFPLEFBQVAsR0FBTyxBQUFQLEVBQU87QUFDaEMsS0FBSyxDQUFDLFVBQVUsR0FBRyxFQUFJLENBQUUsQ0FBTyxBQUFQLEVBQU8sQUFBUCxHQUFPLEFBQVAsRUFBTztBQUNoQyxLQUFLLENBQUMsVUFBVSxHQUFHLEVBQUksQ0FBRSxDQUFPLEFBQVAsRUFBTyxBQUFQLEdBQU8sQUFBUCxFQUFPO0FBQ2hDLEtBQUssQ0FBQyxpQkFBaUIsR0FBRyxFQUFJLENBQUUsQ0FBTyxBQUFQLEVBQU8sQUFBUCxHQUFPLEFBQVAsRUFBTztBQUN2QyxLQUFLLENBQUMsYUFBYSxHQUFHLEVBQUksQ0FBRSxDQUFPLEFBQVAsRUFBTyxBQUFQLEdBQU8sQUFBUCxFQUFPO0FBQ25DLEtBQUssQ0FBQyxrQkFBa0IsR0FBRyxFQUFJLENBQUUsQ0FBTyxBQUFQLEVBQU8sQUFBUCxHQUFPLEFBQVAsRUFBTztBQUN4QyxLQUFLLENBQUMsd0JBQXdCLEdBQUcsRUFBSSxDQUFFLENBQU8sQUFBUCxFQUFPLEFBQVAsR0FBTyxBQUFQLEVBQU87QUFDOUMsS0FBSyxDQUFDLHlCQUF5QixHQUFHLEVBQUksQ0FBRSxDQUFPLEFBQVAsRUFBTyxBQUFQLEdBQU8sQUFBUCxFQUFPO0FBQy9DLEtBQUssQ0FBQyxpQkFBaUIsR0FBRyxFQUFJLENBQUUsQ0FBTyxBQUFQLEVBQU8sQUFBUCxHQUFPLEFBQVAsRUFBTztBQUN2QyxLQUFLLENBQUMsdUJBQXVCLEdBQUcsR0FBSSxDQUFFLENBQU8sQUFBUCxFQUFPLEFBQVAsR0FBTyxBQUFQLEVBQU87QUFDN0MsS0FBSyxDQUFDLGtCQUFrQixHQUFHLEdBQUksQ0FBRSxDQUFPLEFBQVAsRUFBTyxBQUFQLEdBQU8sQUFBUCxFQUFPO0FBQ3hDLEtBQUssQ0FBQyx3QkFBd0IsR0FBRyxHQUFJLENBQUUsQ0FBTyxBQUFQLEVBQU8sQUFBUCxHQUFPLEFBQVAsRUFBTztBQUU5QyxLQUFLLENBQUMsZ0JBQWdCLEdBQStCLENBQUM7QUFBQSxDQUFDO0FBRXZELGdCQUFnQixDQUFDLENBQUksSUFBSSxDQUFLO0FBQzlCLGdCQUFnQixDQUFDLENBQUksSUFBSSxDQUFLO0FBQzlCLGdCQUFnQixDQUFDLENBQUksSUFBSSxDQUFLO0FBQzlCLGdCQUFnQixDQUFDLENBQUksSUFBSSxDQUFLO0FBQzlCLGdCQUFnQixDQUFDLEVBQUksSUFBSSxDQUFLO0FBQzlCLGdCQUFnQixDQUFDLEVBQUksSUFBSSxDQUFLO0FBQzlCLGdCQUFnQixDQUFDLEVBQUksSUFBSSxDQUFLO0FBQzlCLGdCQUFnQixDQUFDLEVBQUksSUFBSSxDQUFLO0FBQzlCLGdCQUFnQixDQUFDLEVBQUksSUFBSSxDQUFLO0FBQzlCLGdCQUFnQixDQUFDLEVBQUksSUFBSSxDQUFLO0FBQzlCLGdCQUFnQixDQUFDLEVBQUksSUFBSSxDQUFNO0FBQy9CLGdCQUFnQixDQUFDLEdBQUksSUFBSSxDQUFLO0FBQzlCLGdCQUFnQixDQUFDLEdBQUksSUFBSSxDQUFLO0FBQzlCLGdCQUFnQixDQUFDLElBQU0sSUFBSSxDQUFLO0FBQ2hDLGdCQUFnQixDQUFDLElBQU0sSUFBSSxDQUFLO0FBRWhDLEtBQUssQ0FBQywwQkFBMEIsR0FBRyxDQUFDO0lBQ2xDLENBQUc7SUFDSCxDQUFHO0lBQ0gsQ0FBSztJQUNMLENBQUs7SUFDTCxDQUFLO0lBQ0wsQ0FBSTtJQUNKLENBQUk7SUFDSixDQUFJO0lBQ0osQ0FBRztJQUNILENBQUc7SUFDSCxDQUFJO0lBQ0osQ0FBSTtJQUNKLENBQUk7SUFDSixDQUFLO0lBQ0wsQ0FBSztJQUNMLENBQUs7QUFDUCxDQUFDO1NBRVEsU0FBUyxDQUFDLFNBQWlCLEVBQVUsQ0FBQztJQUM3QyxLQUFLLENBQUMsTUFBTSxHQUFHLFNBQVMsQ0FBQyxRQUFRLENBQUMsRUFBRSxFQUFFLFdBQVc7SUFFakQsR0FBRyxDQUFDLE1BQU07SUFDVixHQUFHLENBQUMsTUFBTTtJQUNWLEVBQUUsRUFBRSxTQUFTLElBQUksR0FBSSxFQUFFLENBQUM7UUFDdEIsTUFBTSxHQUFHLENBQUc7UUFDWixNQUFNLEdBQUcsQ0FBQztJQUNaLENBQUMsTUFBTSxFQUFFLEVBQUUsU0FBUyxJQUFJLEtBQU0sRUFBRSxDQUFDO1FBQy9CLE1BQU0sR0FBRyxDQUFHO1FBQ1osTUFBTSxHQUFHLENBQUM7SUFDWixDQUFDLE1BQU0sRUFBRSxFQUFFLFNBQVMsSUFBSSxVQUFVLEVBQUUsQ0FBQztRQUNuQyxNQUFNLEdBQUcsQ0FBRztRQUNaLE1BQU0sR0FBRyxDQUFDO0lBQ1osQ0FBQyxNQUFNLENBQUM7UUFDTixLQUFLLENBQUMsR0FBRyxDQUFDLFNBQVMsQ0FDakIsQ0FBK0Q7SUFFbkUsQ0FBQztJQUVELE1BQU0sRUFBRSxFQUFFLEVBQUUsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBRyxJQUFFLE1BQU0sR0FBRyxNQUFNLENBQUMsTUFBTSxJQUFJLE1BQU07QUFDMUUsQ0FBQztBQUVELEVBQTBFLEFBQTFFLHdFQUEwRTtTQUNqRSxZQUFZLENBQUMsTUFBYyxFQUFFLE1BQWMsRUFBVSxDQUFDO0lBQzdELEtBQUssQ0FBQyxHQUFHLEdBQUcsTUFBTSxDQUFDLE1BQU0sQ0FBQyxDQUFHLElBQUUsTUFBTSxHQUNuQyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU07SUFDeEIsR0FBRyxDQUFDLFFBQVEsR0FBRyxDQUFDLEVBQ2QsSUFBSSxJQUFJLENBQUMsRUFDVCxNQUFNLEdBQUcsQ0FBRSxHQUNYLElBQUk7VUFFQyxRQUFRLEdBQUcsTUFBTSxDQUFFLENBQUM7UUFDekIsSUFBSSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBSSxLQUFFLFFBQVE7UUFDcEMsRUFBRSxFQUFFLElBQUksTUFBTSxDQUFDLEVBQUUsQ0FBQztZQUNoQixJQUFJLEdBQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRO1lBQzVCLFFBQVEsR0FBRyxNQUFNO1FBQ25CLENBQUMsTUFBTSxDQUFDO1lBQ04sSUFBSSxHQUFHLE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxFQUFFLElBQUksR0FBRyxDQUFDO1lBQ3RDLFFBQVEsR0FBRyxJQUFJLEdBQUcsQ0FBQztRQUNyQixDQUFDO1FBRUQsRUFBRSxFQUFFLElBQUksQ0FBQyxNQUFNLElBQUksSUFBSSxLQUFLLENBQUksS0FBRSxNQUFNLElBQUksR0FBRztRQUUvQyxNQUFNLElBQUksSUFBSTtJQUNoQixDQUFDO0lBRUQsTUFBTSxDQUFDLE1BQU07QUFDZixDQUFDO1NBRVEsZ0JBQWdCLENBQUMsS0FBa0IsRUFBRSxLQUFhLEVBQVUsQ0FBQztJQUNwRSxNQUFNLEVBQUUsRUFBRSxFQUFFLE1BQU0sQ0FBQyxNQUFNLENBQUMsQ0FBRyxJQUFFLEtBQUssQ0FBQyxNQUFNLEdBQUcsS0FBSztBQUNyRCxDQUFDO1NBRVEscUJBQXFCLENBQUMsS0FBa0IsRUFBRSxHQUFXLEVBQVcsQ0FBQztJQUN4RSxHQUFHLENBQUMsSUFBSTtJQUNSLEdBQUcsQ0FDRCxHQUFHLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQUcsS0FBSyxDQUFDLGFBQWEsQ0FBQyxNQUFNLEVBQ2xELEtBQUssR0FBRyxNQUFNLEVBQ2QsS0FBSyxJQUFJLENBQUMsQ0FDVixDQUFDO1FBQ0QsSUFBSSxHQUFHLEtBQUssQ0FBQyxhQUFhLENBQUMsS0FBSztRQUVoQyxFQUFFLEVBQUUsSUFBSSxDQUFDLE9BQU8sQ0FBQyxHQUFHLEdBQUcsQ0FBQztZQUN0QixNQUFNLENBQUMsSUFBSTtRQUNiLENBQUM7SUFDSCxDQUFDO0lBRUQsTUFBTSxDQUFDLEtBQUs7QUFDZCxDQUFDO0FBRUQsRUFBbUMsQUFBbkMsaUNBQW1DO1NBQzFCLFlBQVksQ0FBQyxDQUFTLEVBQVcsQ0FBQztJQUN6QyxNQUFNLENBQUMsQ0FBQyxLQUFLLFVBQVUsSUFBSSxDQUFDLEtBQUssUUFBUTtBQUMzQyxDQUFDO0FBRUQsRUFBaUUsQUFBakUsK0RBQWlFO0FBQ2pFLEVBQW1FLEFBQW5FLGlFQUFtRTtBQUNuRSxFQUEyRCxBQUEzRCwyREFBNkQ7QUFDM0QsRUFBMkQsQUFBN0QsMkRBQTZEO1NBQ3BELFdBQVcsQ0FBQyxDQUFTLEVBQVcsQ0FBQztJQUN4QyxNQUFNLENBQ0gsRUFBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksR0FBUSxJQUM3QixHQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFRLElBQUksQ0FBQyxLQUFLLElBQU0sSUFBSSxDQUFDLEtBQUssSUFBTSxJQUM3RCxLQUFPLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxLQUFRLElBQUksQ0FBQyxLQUFLLEtBQU0sSUFDN0MsS0FBTyxJQUFJLENBQUMsSUFBSSxDQUFDLElBQUksT0FBUTtBQUVsQyxDQUFDO0FBRUQsRUFBK0UsQUFBL0UsNkVBQStFO1NBQ3RFLFdBQVcsQ0FBQyxDQUFTLEVBQVcsQ0FBQztJQUN4QyxFQUEwRCxBQUExRCx3REFBMEQ7SUFDMUQsRUFBOEQsQUFBOUQsNERBQThEO0lBQzlELE1BQU0sQ0FDSixXQUFXLENBQUMsQ0FBQyxLQUNiLENBQUMsS0FBSyxLQUFNLElBQ1osRUFBcUIsQUFBckIsbUJBQXFCO0lBQ3JCLENBQUMsS0FBSyxVQUFVLElBQ2hCLENBQUMsS0FBSyx3QkFBd0IsSUFDOUIsQ0FBQyxLQUFLLHlCQUF5QixJQUMvQixDQUFDLEtBQUssdUJBQXVCLElBQzdCLENBQUMsS0FBSyx3QkFBd0IsSUFDOUIsRUFBYyxBQUFkLFlBQWM7SUFDZCxDQUFDLEtBQUssVUFBVSxJQUNoQixDQUFDLEtBQUssVUFBVTtBQUVwQixDQUFDO0FBRUQsRUFBNEUsQUFBNUUsMEVBQTRFO1NBQ25FLGdCQUFnQixDQUFDLENBQVMsRUFBVyxDQUFDO0lBQzdDLEVBQXlDLEFBQXpDLHVDQUF5QztJQUN6QyxFQUFxQyxBQUFyQyxtQ0FBcUM7SUFDckMsTUFBTSxDQUNKLFdBQVcsQ0FBQyxDQUFDLEtBQ2IsQ0FBQyxLQUFLLEtBQU0sS0FDWCxZQUFZLENBQUMsQ0FBQyxLQUNmLEVBQXFCLEFBQXJCLG1CQUFxQjtJQUNyQixFQUFnRCxBQUFoRCw4RUFBZ0Y7SUFDaEQsQ0FBL0IsS0FBSyxVQUFVLElBQ2hCLENBQUMsS0FBSyxhQUFhLElBQ25CLENBQUMsS0FBSyxVQUFVLElBQ2hCLENBQUMsS0FBSyxVQUFVLElBQ2hCLENBQUMsS0FBSyx3QkFBd0IsSUFDOUIsQ0FBQyxLQUFLLHlCQUF5QixJQUMvQixDQUFDLEtBQUssdUJBQXVCLElBQzdCLENBQUMsS0FBSyx3QkFBd0IsSUFDOUIsRUFBa0QsQUFBbEQsZ0ZBQWtGO0lBQ2xELENBQS9CLEtBQUssVUFBVSxJQUNoQixDQUFDLEtBQUssY0FBYyxJQUNwQixDQUFDLEtBQUssYUFBYSxJQUNuQixDQUFDLEtBQUssZ0JBQWdCLElBQ3RCLENBQUMsS0FBSyxrQkFBa0IsSUFDeEIsQ0FBQyxLQUFLLGlCQUFpQixJQUN2QixDQUFDLEtBQUssaUJBQWlCLElBQ3ZCLENBQUMsS0FBSyxpQkFBaUIsSUFDdkIsRUFBcUIsQUFBckIsK0JBQWlDO0lBQ3JCLENBQVgsS0FBSyxZQUFZLElBQ2xCLENBQUMsS0FBSyxrQkFBa0IsSUFDeEIsQ0FBQyxLQUFLLGlCQUFpQjtBQUUzQixDQUFDO0FBRUQsRUFBOEQsQUFBOUQsNERBQThEO1NBQ3JELG1CQUFtQixDQUFDLE1BQWMsRUFBVyxDQUFDO0lBQ3JELEtBQUssQ0FBQyxjQUFjO0lBQ3BCLE1BQU0sQ0FBQyxjQUFjLENBQUMsSUFBSSxDQUFDLE1BQU07QUFDbkMsQ0FBQztBQUVELEtBQUssQ0FBQyxXQUFXLEdBQUcsQ0FBQyxFQUNuQixZQUFZLEdBQUcsQ0FBQyxFQUNoQixhQUFhLEdBQUcsQ0FBQyxFQUNqQixZQUFZLEdBQUcsQ0FBQyxFQUNoQixZQUFZLEdBQUcsQ0FBQztBQUVsQixFQUErRSxBQUEvRSw2RUFBK0U7QUFDL0UsRUFBOEIsQUFBOUIsNEJBQThCO0FBQzlCLEVBQWtDLEFBQWxDLGdDQUFrQztBQUNsQyxFQUFtQixBQUFuQixpQkFBbUI7QUFDbkIsRUFBMkQsQUFBM0QseURBQTJEO0FBQzNELEVBQTRFLEFBQTVFLDBFQUE0RTtBQUM1RSxFQUErRSxBQUEvRSw2RUFBK0U7U0FDdEUsaUJBQWlCLENBQ3hCLE1BQWMsRUFDZCxjQUF1QixFQUN2QixjQUFzQixFQUN0QixTQUFpQixFQUNqQixpQkFBMEMsRUFDbEMsQ0FBQztJQUNULEtBQUssQ0FBQyxnQkFBZ0IsR0FBRyxTQUFTLE1BQU0sQ0FBQztJQUN6QyxHQUFHLENBQUMsWUFBWSxHQUFHLEtBQUssRUFDdEIsZUFBZSxHQUFHLEtBQUssRUFDdkIsaUJBQWlCLElBQUksQ0FBQyxFQUN0QixLQUFLLEdBQUcsZ0JBQWdCLENBQUMsTUFBTSxDQUFDLFVBQVUsQ0FBQyxDQUFDLE9BQ3pDLFlBQVksQ0FBQyxNQUFNLENBQUMsVUFBVSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQztJQUVyRCxHQUFHLENBQUMsSUFBSSxFQUFVLENBQUM7SUFDbkIsRUFBRSxFQUFFLGNBQWMsRUFBRSxDQUFDO1FBQ25CLEVBQXlCLEFBQXpCLHVCQUF5QjtRQUN6QixFQUFnRSxBQUFoRSw4REFBZ0U7UUFDaEUsR0FBRyxDQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFJLENBQUM7WUFDbkMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMxQixFQUFFLEdBQUcsV0FBVyxDQUFDLElBQUksR0FBRyxDQUFDO2dCQUN2QixNQUFNLENBQUMsWUFBWTtZQUNyQixDQUFDO1lBQ0QsS0FBSyxHQUFHLEtBQUssSUFBSSxXQUFXLENBQUMsSUFBSTtRQUNuQyxDQUFDO0lBQ0gsQ0FBQyxNQUFNLENBQUM7UUFDTixFQUFnQyxBQUFoQyw4QkFBZ0M7UUFDaEMsR0FBRyxDQUFFLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFJLENBQUM7WUFDbkMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztZQUMxQixFQUFFLEVBQUUsSUFBSSxLQUFLLGNBQWMsRUFBRSxDQUFDO2dCQUM1QixZQUFZLEdBQUcsSUFBSTtnQkFDbkIsRUFBbUMsQUFBbkMsaUNBQW1DO2dCQUNuQyxFQUFFLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQztvQkFDckIsZUFBZSxHQUFHLGVBQWUsSUFDL0IsRUFBbUQsQUFBbkQsaURBQW1EO3FCQUNsRCxDQUFDLEdBQUcsaUJBQWlCLEdBQUcsQ0FBQyxHQUFHLFNBQVMsSUFDcEMsTUFBTSxDQUFDLGlCQUFpQixHQUFHLENBQUMsTUFBTSxDQUFHO29CQUN6QyxpQkFBaUIsR0FBRyxDQUFDO2dCQUN2QixDQUFDO1lBQ0gsQ0FBQyxNQUFNLEVBQUUsR0FBRyxXQUFXLENBQUMsSUFBSSxHQUFHLENBQUM7Z0JBQzlCLE1BQU0sQ0FBQyxZQUFZO1lBQ3JCLENBQUM7WUFDRCxLQUFLLEdBQUcsS0FBSyxJQUFJLFdBQVcsQ0FBQyxJQUFJO1FBQ25DLENBQUM7UUFDRCxFQUFrQyxBQUFsQyxnQ0FBa0M7UUFDbEMsZUFBZSxHQUFHLGVBQWUsSUFDOUIsZ0JBQWdCLElBQ2YsQ0FBQyxHQUFHLGlCQUFpQixHQUFHLENBQUMsR0FBRyxTQUFTLElBQ3JDLE1BQU0sQ0FBQyxpQkFBaUIsR0FBRyxDQUFDLE1BQU0sQ0FBRztJQUMzQyxDQUFDO0lBQ0QsRUFBOEUsQUFBOUUsNEVBQThFO0lBQzlFLEVBQTZFLEFBQTdFLDJFQUE2RTtJQUM3RSxFQUF5QyxBQUF6Qyx1Q0FBeUM7SUFDekMsRUFBRSxHQUFHLFlBQVksS0FBSyxlQUFlLEVBQUUsQ0FBQztRQUN0QyxFQUEyRCxBQUEzRCx5REFBMkQ7UUFDM0QsRUFBK0MsQUFBL0MsNkNBQStDO1FBQy9DLE1BQU0sQ0FBQyxLQUFLLEtBQUssaUJBQWlCLENBQUMsTUFBTSxJQUFJLFdBQVcsR0FBRyxZQUFZO0lBQ3pFLENBQUM7SUFDRCxFQUFrRSxBQUFsRSxnRUFBa0U7SUFDbEUsRUFBRSxFQUFFLGNBQWMsR0FBRyxDQUFDLElBQUksbUJBQW1CLENBQUMsTUFBTSxHQUFHLENBQUM7UUFDdEQsTUFBTSxDQUFDLFlBQVk7SUFDckIsQ0FBQztJQUNELEVBQWdELEFBQWhELDhDQUFnRDtJQUNoRCxFQUErQyxBQUEvQyw2Q0FBK0M7SUFDL0MsTUFBTSxDQUFDLGVBQWUsR0FBRyxZQUFZLEdBQUcsYUFBYTtBQUN2RCxDQUFDO0FBRUQsRUFBd0IsQUFBeEIsc0JBQXdCO0FBQ3hCLEVBQW9ELEFBQXBELGtEQUFvRDtBQUNwRCxFQUEwRCxBQUExRCx3REFBMEQ7QUFDMUQsRUFBNkUsQUFBN0UsMkVBQTZFO1NBQ3BFLFFBQVEsQ0FBQyxJQUFZLEVBQUUsS0FBYSxFQUFVLENBQUM7SUFDdEQsRUFBRSxFQUFFLElBQUksS0FBSyxDQUFFLEtBQUksSUFBSSxDQUFDLENBQUMsTUFBTSxDQUFHLElBQUUsTUFBTSxDQUFDLElBQUk7SUFFL0MsRUFBNkUsQUFBN0UsMkVBQTZFO0lBQzdFLEtBQUssQ0FBQyxPQUFPLFlBQWEsQ0FBb0QsQUFBcEQsRUFBb0QsQUFBcEQsa0RBQW9EO0lBQzlFLEdBQUcsQ0FBQyxLQUFLO0lBQ1QsRUFBa0UsQUFBbEUsZ0VBQWtFO0lBQ2xFLEdBQUcsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxFQUNYLEdBQUcsRUFDSCxJQUFJLEdBQUcsQ0FBQyxFQUNSLElBQUksR0FBRyxDQUFDO0lBQ1YsR0FBRyxDQUFDLE1BQU0sR0FBRyxDQUFFO0lBRWYsRUFBc0MsQUFBdEMsb0NBQXNDO0lBQ3RDLEVBQWtFLEFBQWxFLGdFQUFrRTtJQUNsRSxFQUFtQixBQUFuQixpQkFBbUI7SUFDbkIsRUFBbUUsQUFBbkUsaUVBQW1FO0lBQ25FLEVBQXFELEFBQXJELG1EQUFxRDtVQUM3QyxLQUFLLEdBQUcsT0FBTyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUksQ0FBQztRQUNwQyxJQUFJLEdBQUcsS0FBSyxDQUFDLEtBQUs7UUFDbEIsRUFBNEMsQUFBNUMsMENBQTRDO1FBQzVDLEVBQUUsRUFBRSxJQUFJLEdBQUcsS0FBSyxHQUFHLEtBQUssRUFBRSxDQUFDO1lBQ3pCLEdBQUcsR0FBRyxJQUFJLEdBQUcsS0FBSyxHQUFHLElBQUksR0FBRyxJQUFJLENBQUUsQ0FBeUIsQUFBekIsRUFBeUIsQUFBekIsdUJBQXlCO1lBQzNELE1BQU0sS0FBSyxFQUFFLEVBQUUsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsR0FBRztZQUNwQyxFQUF1QyxBQUF2QyxxQ0FBdUM7WUFDdkMsS0FBSyxHQUFHLEdBQUcsR0FBRyxDQUFDLENBQUUsQ0FBMkIsQUFBM0IsRUFBMkIsQUFBM0IseUJBQTJCO1FBQzlDLENBQUM7UUFDRCxJQUFJLEdBQUcsSUFBSTtJQUNiLENBQUM7SUFFRCxFQUF5RSxBQUF6RSx1RUFBeUU7SUFDekUsRUFBd0UsQUFBeEUsc0VBQXdFO0lBQ3hFLE1BQU0sSUFBSSxDQUFJO0lBQ2QsRUFBOEUsQUFBOUUsNEVBQThFO0lBQzlFLEVBQUUsRUFBRSxJQUFJLENBQUMsTUFBTSxHQUFHLEtBQUssR0FBRyxLQUFLLElBQUksSUFBSSxHQUFHLEtBQUssRUFBRSxDQUFDO1FBQ2hELE1BQU0sT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLEtBQUssRUFBRSxJQUFJLEVBQUUsRUFBRSxFQUFFLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxHQUFHLENBQUM7SUFDOUQsQ0FBQyxNQUFNLENBQUM7UUFDTixNQUFNLElBQUksSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLO0lBQzVCLENBQUM7SUFFRCxNQUFNLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEVBQUcsQ0FBdUIsQUFBdkIsRUFBdUIsQUFBdkIscUJBQXVCO0FBQ2pELENBQUM7QUFFRCxFQUFrQyxBQUFsQyxnQ0FBa0M7U0FDekIsaUJBQWlCLENBQUMsTUFBYyxFQUFVLENBQUM7SUFDbEQsTUFBTSxDQUFDLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsTUFBTSxDQUFJLE1BQUcsTUFBTSxDQUFDLEtBQUssQ0FBQyxDQUFDLEdBQUcsQ0FBQyxJQUFJLE1BQU07QUFDMUUsQ0FBQztBQUVELEVBQWdGLEFBQWhGLDhFQUFnRjtBQUNoRixFQUE0RSxBQUE1RSwwRUFBNEU7U0FDbkUsVUFBVSxDQUFDLE1BQWMsRUFBRSxLQUFhLEVBQVUsQ0FBQztJQUMxRCxFQUFzRSxBQUF0RSxzRUFBd0U7SUFDdEUsRUFBb0UsQUFBdEUsb0VBQXNFO0lBQ3RFLEVBQW1ELEFBQW5ELGlEQUFtRDtJQUNuRCxFQUF3RSxBQUF4RSxzRUFBd0U7SUFDeEUsS0FBSyxDQUFDLE1BQU07SUFFWixFQUFzQyxBQUF0QyxvQ0FBc0M7SUFDdEMsR0FBRyxDQUFDLE1BQU0sUUFBa0IsQ0FBQztRQUMzQixHQUFHLENBQUMsTUFBTSxHQUFHLE1BQU0sQ0FBQyxPQUFPLENBQUMsQ0FBSTtRQUNoQyxNQUFNLEdBQUcsTUFBTSxNQUFNLENBQUMsR0FBRyxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU07UUFDL0MsTUFBTSxDQUFDLFNBQVMsR0FBRyxNQUFNO1FBQ3pCLEVBQW1FLEFBQW5FLGlFQUFtRTtRQUNuRSxNQUFNLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsQ0FBQyxFQUFFLE1BQU0sR0FBRyxLQUFLO0lBQ2hELENBQUM7SUFDRCxFQUEyRSxBQUEzRSx5RUFBMkU7SUFDM0UsR0FBRyxDQUFDLGdCQUFnQixHQUFHLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBSSxPQUFJLE1BQU0sQ0FBQyxDQUFDLE1BQU0sQ0FBRztJQUM5RCxHQUFHLENBQUMsWUFBWTtJQUVoQixFQUFvQixBQUFwQixrQkFBb0I7SUFDcEIsR0FBRyxDQUFDLEtBQUs7SUFDVCxFQUFxRCxBQUFyRCxtREFBcUQ7VUFDN0MsS0FBSyxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTSxFQUFJLENBQUM7UUFDckMsS0FBSyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsQ0FBQyxHQUNwQixJQUFJLEdBQUcsS0FBSyxDQUFDLENBQUM7UUFDaEIsWUFBWSxHQUFHLElBQUksQ0FBQyxDQUFDLE1BQU0sQ0FBRztRQUM5QixNQUFNLElBQUksTUFBTSxLQUNaLGdCQUFnQixLQUFLLFlBQVksSUFBSSxJQUFJLEtBQUssQ0FBRSxJQUFHLENBQUksTUFBRyxDQUFFLEtBQzlELEVBQW1FLEFBQW5FLGlFQUFtRTtRQUNuRSxRQUFRLENBQUMsSUFBSSxFQUFFLEtBQUs7UUFDdEIsZ0JBQWdCLEdBQUcsWUFBWTtJQUNqQyxDQUFDO0lBRUQsTUFBTSxDQUFDLE1BQU07QUFDZixDQUFDO0FBRUQsRUFBa0MsQUFBbEMsZ0NBQWtDO1NBQ3pCLFlBQVksQ0FBQyxNQUFjLEVBQVUsQ0FBQztJQUM3QyxHQUFHLENBQUMsTUFBTSxHQUFHLENBQUU7SUFDZixHQUFHLENBQUMsSUFBSSxFQUFFLFFBQVE7SUFDbEIsR0FBRyxDQUFDLFNBQVM7SUFFYixHQUFHLENBQUUsR0FBRyxDQUFDLENBQUMsR0FBRyxDQUFDLEVBQUUsQ0FBQyxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFJLENBQUM7UUFDdkMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxVQUFVLENBQUMsQ0FBQztRQUMxQixFQUE4RSxBQUE5RSw0RUFBOEU7UUFDOUUsRUFBRSxFQUFFLElBQUksSUFBSSxLQUFNLElBQUksSUFBSSxJQUFJLEtBQU0sQUFBQyxDQUFvQixBQUFwQixFQUFvQixBQUFwQixnQkFBb0IsQUFBcEIsRUFBb0IsR0FBRSxDQUFDO1lBQzFELFFBQVEsR0FBRyxNQUFNLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDO1lBQ2xDLEVBQUUsRUFBRSxRQUFRLElBQUksS0FBTSxJQUFJLFFBQVEsSUFBSSxLQUFNLEFBQUMsQ0FBbUIsQUFBbkIsRUFBbUIsQUFBbkIsZUFBbUIsQUFBbkIsRUFBbUIsR0FBRSxDQUFDO2dCQUNqRSxFQUFtRCxBQUFuRCxpREFBbUQ7Z0JBQ25ELE1BQU0sSUFBSSxTQUFTLEVBQ2hCLElBQUksR0FBRyxLQUFNLElBQUksSUFBSyxHQUFHLFFBQVEsR0FBRyxLQUFNLEdBQUcsS0FBTztnQkFFdkQsRUFBZ0UsQUFBaEUsOERBQWdFO2dCQUNoRSxDQUFDO2dCQUNELFFBQVE7WUFDVixDQUFDO1FBQ0gsQ0FBQztRQUNELFNBQVMsR0FBRyxnQkFBZ0IsQ0FBQyxJQUFJO1FBQ2pDLE1BQU0sS0FBSyxTQUFTLElBQUksV0FBVyxDQUFDLElBQUksSUFDcEMsTUFBTSxDQUFDLENBQUMsSUFDUixTQUFTLElBQUksU0FBUyxDQUFDLElBQUk7SUFDakMsQ0FBQztJQUVELE1BQU0sQ0FBQyxNQUFNO0FBQ2YsQ0FBQztBQUVELEVBQWdGLEFBQWhGLDhFQUFnRjtTQUN2RSxXQUFXLENBQUMsTUFBYyxFQUFFLGNBQXNCLEVBQVUsQ0FBQztJQUNwRSxLQUFLLENBQUMsZUFBZSxHQUFHLG1CQUFtQixDQUFDLE1BQU0sSUFDOUMsTUFBTSxDQUFDLGNBQWMsSUFDckIsQ0FBRTtJQUVOLEVBQTRFLEFBQTVFLDBFQUE0RTtJQUM1RSxLQUFLLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsTUFBTSxDQUFJO0lBQy9DLEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxLQUFLLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsTUFBTSxDQUFJLE9BQUksTUFBTSxLQUFLLENBQUk7SUFDM0UsS0FBSyxDQUFDLEtBQUssR0FBRyxJQUFJLEdBQUcsQ0FBRyxLQUFHLElBQUksR0FBRyxDQUFFLElBQUcsQ0FBRztJQUUxQyxNQUFNLElBQUksZUFBZSxHQUFHLEtBQUssQ0FBQyxFQUFFO0FBQ3RDLENBQUM7QUFFRCxFQUF3RSxBQUF4RSxzRUFBd0U7QUFDeEUsRUFBNEUsQUFBNUUsMEVBQTRFO0FBQzVFLEVBQTZELEFBQTdELDJEQUE2RDtBQUM3RCxFQUEwRSxBQUExRSwwRUFBNEU7QUFDMUUsRUFBaUQsQUFBbkQsbURBQXFEO0FBQ25ELEVBQTZFLEFBQS9FLDZFQUErRTtTQUN0RSxXQUFXLENBQ2xCLEtBQWtCLEVBQ2xCLE1BQWMsRUFDZCxLQUFhLEVBQ2IsS0FBYyxFQUNSLENBQUM7SUFDUCxLQUFLLENBQUMsSUFBSSxRQUFrQixDQUFDO1FBQzNCLEVBQUUsRUFBRSxNQUFNLENBQUMsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO1lBQ3hCLE1BQU0sQ0FBQyxDQUFJO1FBQ2IsQ0FBQztRQUNELEVBQUUsR0FDQyxLQUFLLENBQUMsWUFBWSxJQUNuQiwwQkFBMEIsQ0FBQyxPQUFPLENBQUMsTUFBTSxPQUFPLENBQUMsRUFDakQsQ0FBQztZQUNELE1BQU0sRUFBRSxDQUFDLEVBQUUsTUFBTSxDQUFDLENBQUM7UUFDckIsQ0FBQztRQUVELEtBQUssQ0FBQyxNQUFNLEdBQUcsS0FBSyxDQUFDLE1BQU0sR0FBRyxJQUFJLENBQUMsR0FBRyxDQUFDLENBQUMsRUFBRSxLQUFLLEVBQUcsQ0FBc0IsQUFBdEIsRUFBc0IsQUFBdEIsb0JBQXNCO1FBQ3hFLEVBQW1FLEFBQW5FLGlFQUFtRTtRQUNuRSxFQUErQyxBQUEvQyw2Q0FBK0M7UUFDL0MsRUFBeUIsQUFBekIsdUJBQXlCO1FBQ3pCLEVBQTJFLEFBQTNFLDJFQUEyRTtRQUMzRSxFQUF3RSxBQUF4RSxzRUFBd0U7UUFDeEUsRUFBVSxBQUFWLFFBQVU7UUFDVixFQUFvRSxBQUFwRSxrRUFBb0U7UUFDcEUsRUFBa0UsQUFBbEUsZ0VBQWtFO1FBQ2xFLEVBQXdCLEFBQXhCLHNCQUF3QjtRQUN4QixLQUFLLENBQUMsU0FBUyxHQUFHLEtBQUssQ0FBQyxTQUFTLE1BQU0sQ0FBQyxJQUNuQyxDQUFDLEdBQ0YsSUFBSSxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsR0FBRyxDQUFDLEtBQUssQ0FBQyxTQUFTLEVBQUUsRUFBRSxHQUFHLEtBQUssQ0FBQyxTQUFTLEdBQUcsTUFBTTtRQUVwRSxFQUFpRCxBQUFqRCwrQ0FBaUQ7UUFDakQsRUFBOEIsQUFBOUIsNEJBQThCO1FBQzlCLEtBQUssQ0FBQyxjQUFjLEdBQUcsS0FBSyxJQUMxQixFQUFnQyxBQUFoQyw4QkFBZ0M7U0FDL0IsS0FBSyxDQUFDLFNBQVMsSUFBSSxDQUFDLElBQUksS0FBSyxJQUFJLEtBQUssQ0FBQyxTQUFTO2lCQUMxQyxhQUFhLENBQUMsR0FBVyxFQUFXLENBQUM7WUFDNUMsTUFBTSxDQUFDLHFCQUFxQixDQUFDLEtBQUssRUFBRSxHQUFHO1FBQ3pDLENBQUM7UUFFRCxNQUFNLENBQ0osaUJBQWlCLENBQ2YsTUFBTSxFQUNOLGNBQWMsRUFDZCxLQUFLLENBQUMsTUFBTSxFQUNaLFNBQVMsRUFDVCxhQUFhO1lBR2YsSUFBSSxDQUFDLFdBQVc7Z0JBQ2QsTUFBTSxDQUFDLE1BQU07WUFDZixJQUFJLENBQUMsWUFBWTtnQkFDZixNQUFNLEVBQUUsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxPQUFPLE9BQU8sQ0FBSSxLQUFFLENBQUM7WUFDekMsSUFBSSxDQUFDLGFBQWE7Z0JBQ2hCLE1BQU0sRUFBRSxDQUFDLEVBQUUsV0FBVyxDQUFDLE1BQU0sRUFBRSxLQUFLLENBQUMsTUFBTSxJQUN6QyxpQkFBaUIsQ0FDZixZQUFZLENBQUMsTUFBTSxFQUFFLE1BQU07WUFHakMsSUFBSSxDQUFDLFlBQVk7Z0JBQ2YsTUFBTSxFQUFFLENBQUMsRUFBRSxXQUFXLENBQUMsTUFBTSxFQUFFLEtBQUssQ0FBQyxNQUFNLElBQ3pDLGlCQUFpQixDQUNmLFlBQVksQ0FBQyxVQUFVLENBQUMsTUFBTSxFQUFFLFNBQVMsR0FBRyxNQUFNO1lBR3hELElBQUksQ0FBQyxZQUFZO2dCQUNmLE1BQU0sRUFBRSxDQUFDLEVBQUUsWUFBWSxDQUFDLE1BQU0sRUFBRSxDQUFDOztnQkFFakMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxTQUFTLENBQUMsQ0FBd0M7O0lBRWxFLENBQUM7QUFDSCxDQUFDO1NBRVEsaUJBQWlCLENBQ3hCLEtBQWtCLEVBQ2xCLEtBQWEsRUFDYixNQUFXLEVBQ0wsQ0FBQztJQUNQLEdBQUcsQ0FBQyxPQUFPLEdBQUcsQ0FBRTtJQUNoQixLQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxHQUFHO0lBRXRCLEdBQUcsQ0FBRSxHQUFHLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxLQUFLLEdBQUcsTUFBTSxFQUFFLEtBQUssSUFBSSxDQUFDLENBQUUsQ0FBQztRQUN2RSxFQUE2QixBQUE3QiwyQkFBNkI7UUFDN0IsRUFBbUUsQUFBbkUsaUVBQW1FO1FBQ25FLEVBQUUsRUFBRSxTQUFTLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxNQUFNLENBQUMsS0FBSyxHQUFHLEtBQUssRUFBRSxLQUFLLEdBQUcsQ0FBQztZQUN6RCxFQUFFLEVBQUUsS0FBSyxLQUFLLENBQUMsRUFBRSxPQUFPLEtBQUssQ0FBQyxHQUFHLEtBQUssQ0FBQyxZQUFZLEdBQUcsQ0FBRyxLQUFHLENBQUU7WUFDOUQsT0FBTyxJQUFJLEtBQUssQ0FBQyxJQUFJO1FBQ3ZCLENBQUM7SUFDSCxDQUFDO0lBRUQsS0FBSyxDQUFDLEdBQUcsR0FBRyxJQUFJO0lBQ2hCLEtBQUssQ0FBQyxJQUFJLElBQUksQ0FBQyxFQUFFLE9BQU8sQ0FBQyxDQUFDO0FBQzVCLENBQUM7U0FFUSxrQkFBa0IsQ0FDekIsS0FBa0IsRUFDbEIsS0FBYSxFQUNiLE1BQVcsRUFDWCxPQUFPLEdBQUcsS0FBSyxFQUNULENBQUM7SUFDUCxHQUFHLENBQUMsT0FBTyxHQUFHLENBQUU7SUFDaEIsS0FBSyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsR0FBRztJQUV0QixHQUFHLENBQUUsR0FBRyxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUUsTUFBTSxHQUFHLE1BQU0sQ0FBQyxNQUFNLEVBQUUsS0FBSyxHQUFHLE1BQU0sRUFBRSxLQUFLLElBQUksQ0FBQyxDQUFFLENBQUM7UUFDdkUsRUFBNkIsQUFBN0IsMkJBQTZCO1FBQzdCLEVBQW1FLEFBQW5FLGlFQUFtRTtRQUNuRSxFQUFFLEVBQUUsU0FBUyxDQUFDLEtBQUssRUFBRSxLQUFLLEdBQUcsQ0FBQyxFQUFFLE1BQU0sQ0FBQyxLQUFLLEdBQUcsSUFBSSxFQUFFLElBQUksR0FBRyxDQUFDO1lBQzNELEVBQUUsR0FBRyxPQUFPLElBQUksS0FBSyxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUM1QixPQUFPLElBQUksZ0JBQWdCLENBQUMsS0FBSyxFQUFFLEtBQUs7WUFDMUMsQ0FBQztZQUVELEVBQUUsRUFBRSxLQUFLLENBQUMsSUFBSSxJQUFJLGNBQWMsS0FBSyxLQUFLLENBQUMsSUFBSSxDQUFDLFVBQVUsQ0FBQyxDQUFDLEdBQUcsQ0FBQztnQkFDOUQsT0FBTyxJQUFJLENBQUc7WUFDaEIsQ0FBQyxNQUFNLENBQUM7Z0JBQ04sT0FBTyxJQUFJLENBQUk7WUFDakIsQ0FBQztZQUVELE9BQU8sSUFBSSxLQUFLLENBQUMsSUFBSTtRQUN2QixDQUFDO0lBQ0gsQ0FBQztJQUVELEtBQUssQ0FBQyxHQUFHLEdBQUcsSUFBSTtJQUNoQixLQUFLLENBQUMsSUFBSSxHQUFHLE9BQU8sSUFBSSxDQUFJLElBQUUsQ0FBcUMsQUFBckMsRUFBcUMsQUFBckMsbUNBQXFDO0FBQ3JFLENBQUM7U0FFUSxnQkFBZ0IsQ0FDdkIsS0FBa0IsRUFDbEIsS0FBYSxFQUNiLE1BQVcsRUFDTCxDQUFDO0lBQ1AsR0FBRyxDQUFDLE9BQU8sR0FBRyxDQUFFO0lBQ2hCLEtBQUssQ0FBQyxJQUFJLEdBQUcsS0FBSyxDQUFDLEdBQUcsRUFDcEIsYUFBYSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsTUFBTTtJQUVwQyxHQUFHLENBQUMsVUFBVSxFQUFVLFNBQVMsRUFBVSxXQUFXO0lBQ3RELEdBQUcsQ0FDRCxHQUFHLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQUcsYUFBYSxDQUFDLE1BQU0sRUFDNUMsS0FBSyxHQUFHLE1BQU0sRUFDZCxLQUFLLElBQUksQ0FBQyxDQUNWLENBQUM7UUFDRCxVQUFVLEdBQUcsS0FBSyxDQUFDLFlBQVksR0FBRyxDQUFHLEtBQUcsQ0FBRTtRQUUxQyxFQUFFLEVBQUUsS0FBSyxLQUFLLENBQUMsRUFBRSxVQUFVLElBQUksQ0FBSTtRQUVuQyxTQUFTLEdBQUcsYUFBYSxDQUFDLEtBQUs7UUFDL0IsV0FBVyxHQUFHLE1BQU0sQ0FBQyxTQUFTO1FBRTlCLEVBQW1FLEFBQW5FLGlFQUFtRTtRQUNuRSxFQUFFLEdBQUcsU0FBUyxDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsU0FBUyxFQUFFLEtBQUssRUFBRSxLQUFLLEdBQUcsQ0FBQztZQUN0RCxRQUFRLENBQUUsQ0FBeUMsQUFBekMsRUFBeUMsQUFBekMsdUNBQXlDO1FBQ3JELENBQUM7UUFFRCxFQUFFLEVBQUUsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEdBQUcsSUFBSSxFQUFFLFVBQVUsSUFBSSxDQUFJO1FBRWhELFVBQVUsT0FBTyxLQUFLLENBQUMsSUFBSSxHQUFHLEtBQUssQ0FBQyxZQUFZLEdBQUcsQ0FBRyxLQUFHLENBQUUsRUFBQyxDQUFDLEVBQzNELEtBQUssQ0FBQyxZQUFZLEdBQUcsQ0FBRSxJQUFHLENBQUc7UUFHL0IsRUFBbUUsQUFBbkUsaUVBQW1FO1FBQ25FLEVBQUUsR0FBRyxTQUFTLENBQUMsS0FBSyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsS0FBSyxFQUFFLEtBQUssR0FBRyxDQUFDO1lBQ3hELFFBQVEsQ0FBRSxDQUEyQyxBQUEzQyxFQUEyQyxBQUEzQyx5Q0FBMkM7UUFDdkQsQ0FBQztRQUVELFVBQVUsSUFBSSxLQUFLLENBQUMsSUFBSTtRQUV4QixFQUFnQyxBQUFoQyw4QkFBZ0M7UUFDaEMsT0FBTyxJQUFJLFVBQVU7SUFDdkIsQ0FBQztJQUVELEtBQUssQ0FBQyxHQUFHLEdBQUcsSUFBSTtJQUNoQixLQUFLLENBQUMsSUFBSSxJQUFJLENBQUMsRUFBRSxPQUFPLENBQUMsQ0FBQztBQUM1QixDQUFDO1NBRVEsaUJBQWlCLENBQ3hCLEtBQWtCLEVBQ2xCLEtBQWEsRUFDYixNQUFXLEVBQ1gsT0FBTyxHQUFHLEtBQUssRUFDVCxDQUFDO0lBQ1AsS0FBSyxDQUFDLElBQUksR0FBRyxLQUFLLENBQUMsR0FBRyxFQUNwQixhQUFhLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNO0lBQ3BDLEdBQUcsQ0FBQyxPQUFPLEdBQUcsQ0FBRTtJQUVoQixFQUE4RCxBQUE5RCw0REFBOEQ7SUFDOUQsRUFBRSxFQUFFLEtBQUssQ0FBQyxRQUFRLEtBQUssSUFBSSxFQUFFLENBQUM7UUFDNUIsRUFBa0IsQUFBbEIsZ0JBQWtCO1FBQ2xCLGFBQWEsQ0FBQyxJQUFJO0lBQ3BCLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLEtBQUssQ0FBVSxXQUFFLENBQUM7UUFDaEQsRUFBdUIsQUFBdkIscUJBQXVCO1FBQ3ZCLGFBQWEsQ0FBQyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVE7SUFDbkMsQ0FBQyxNQUFNLEVBQUUsRUFBRSxLQUFLLENBQUMsUUFBUSxFQUFFLENBQUM7UUFDMUIsRUFBcUIsQUFBckIsbUJBQXFCO1FBQ3JCLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxDQUFDLENBQTBDO0lBQ2hFLENBQUM7SUFFRCxHQUFHLENBQUMsVUFBVSxHQUFHLENBQUUsR0FDakIsU0FBUyxFQUNULFdBQVcsRUFDWCxZQUFZO0lBQ2QsR0FBRyxDQUNELEdBQUcsQ0FBQyxLQUFLLEdBQUcsQ0FBQyxFQUFFLE1BQU0sR0FBRyxhQUFhLENBQUMsTUFBTSxFQUM1QyxLQUFLLEdBQUcsTUFBTSxFQUNkLEtBQUssSUFBSSxDQUFDLENBQ1YsQ0FBQztRQUNELFVBQVUsR0FBRyxDQUFFO1FBRWYsRUFBRSxHQUFHLE9BQU8sSUFBSSxLQUFLLEtBQUssQ0FBQyxFQUFFLENBQUM7WUFDNUIsVUFBVSxJQUFJLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLO1FBQzdDLENBQUM7UUFFRCxTQUFTLEdBQUcsYUFBYSxDQUFDLEtBQUs7UUFDL0IsV0FBVyxHQUFHLE1BQU0sQ0FBQyxTQUFTO1FBRTlCLEVBQW1FLEFBQW5FLGlFQUFtRTtRQUNuRSxFQUFFLEdBQUcsU0FBUyxDQUFDLEtBQUssRUFBRSxLQUFLLEdBQUcsQ0FBQyxFQUFFLFNBQVMsRUFBRSxJQUFJLEVBQUUsSUFBSSxFQUFFLElBQUksR0FBRyxDQUFDO1lBQzlELFFBQVEsQ0FBRSxDQUF5QyxBQUF6QyxFQUF5QyxBQUF6Qyx1Q0FBeUM7UUFDckQsQ0FBQztRQUVELFlBQVksR0FBSSxLQUFLLENBQUMsR0FBRyxLQUFLLElBQUksSUFBSSxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUcsTUFDcEQsS0FBSyxDQUFDLElBQUksSUFBSSxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU0sR0FBRyxJQUFJO1FBRXpDLEVBQUUsRUFBRSxZQUFZLEVBQUUsQ0FBQztZQUNqQixFQUFFLEVBQUUsS0FBSyxDQUFDLElBQUksSUFBSSxjQUFjLEtBQUssS0FBSyxDQUFDLElBQUksQ0FBQyxVQUFVLENBQUMsQ0FBQyxHQUFHLENBQUM7Z0JBQzlELFVBQVUsSUFBSSxDQUFHO1lBQ25CLENBQUMsTUFBTSxDQUFDO2dCQUNOLFVBQVUsSUFBSSxDQUFJO1lBQ3BCLENBQUM7UUFDSCxDQUFDO1FBRUQsVUFBVSxJQUFJLEtBQUssQ0FBQyxJQUFJO1FBRXhCLEVBQUUsRUFBRSxZQUFZLEVBQUUsQ0FBQztZQUNqQixVQUFVLElBQUksZ0JBQWdCLENBQUMsS0FBSyxFQUFFLEtBQUs7UUFDN0MsQ0FBQztRQUVELEVBQW1FLEFBQW5FLGlFQUFtRTtRQUNuRSxFQUFFLEdBQUcsU0FBUyxDQUFDLEtBQUssRUFBRSxLQUFLLEdBQUcsQ0FBQyxFQUFFLFdBQVcsRUFBRSxJQUFJLEVBQUUsWUFBWSxHQUFHLENBQUM7WUFDbEUsUUFBUSxDQUFFLENBQTJDLEFBQTNDLEVBQTJDLEFBQTNDLHlDQUEyQztRQUN2RCxDQUFDO1FBRUQsRUFBRSxFQUFFLEtBQUssQ0FBQyxJQUFJLElBQUksY0FBYyxLQUFLLEtBQUssQ0FBQyxJQUFJLENBQUMsVUFBVSxDQUFDLENBQUMsR0FBRyxDQUFDO1lBQzlELFVBQVUsSUFBSSxDQUFHO1FBQ25CLENBQUMsTUFBTSxDQUFDO1lBQ04sVUFBVSxJQUFJLENBQUk7UUFDcEIsQ0FBQztRQUVELFVBQVUsSUFBSSxLQUFLLENBQUMsSUFBSTtRQUV4QixFQUFnQyxBQUFoQyw4QkFBZ0M7UUFDaEMsT0FBTyxJQUFJLFVBQVU7SUFDdkIsQ0FBQztJQUVELEtBQUssQ0FBQyxHQUFHLEdBQUcsSUFBSTtJQUNoQixLQUFLLENBQUMsSUFBSSxHQUFHLE9BQU8sSUFBSSxDQUFJLElBQUUsQ0FBbUMsQUFBbkMsRUFBbUMsQUFBbkMsaUNBQW1DO0FBQ25FLENBQUM7U0FFUSxVQUFVLENBQ2pCLEtBQWtCLEVBQ2xCLE1BQVcsRUFDWCxRQUFRLEdBQUcsS0FBSyxFQUNQLENBQUM7SUFDVixLQUFLLENBQUMsUUFBUSxHQUFHLFFBQVEsR0FBRyxLQUFLLENBQUMsYUFBYSxHQUFHLEtBQUssQ0FBQyxhQUFhO0lBRXJFLEdBQUcsQ0FBQyxJQUFJO0lBQ1IsR0FBRyxDQUFDLEtBQUs7SUFDVCxHQUFHLENBQUMsT0FBTztJQUNYLEdBQUcsQ0FBRSxHQUFHLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQUcsUUFBUSxDQUFDLE1BQU0sRUFBRSxLQUFLLEdBQUcsTUFBTSxFQUFFLEtBQUssSUFBSSxDQUFDLENBQUUsQ0FBQztRQUN6RSxJQUFJLEdBQUcsUUFBUSxDQUFDLEtBQUs7UUFFckIsRUFBRSxHQUNDLElBQUksQ0FBQyxVQUFVLElBQUksSUFBSSxDQUFDLFNBQVMsT0FDaEMsSUFBSSxDQUFDLFVBQVUsSUFDZCxNQUFNLENBQUMsTUFBTSxLQUFLLENBQVEsV0FBSSxNQUFNLFlBQVksSUFBSSxDQUFDLFVBQVUsT0FDaEUsSUFBSSxDQUFDLFNBQVMsSUFBSSxJQUFJLENBQUMsU0FBUyxDQUFDLE1BQU0sSUFDekMsQ0FBQztZQUNELEtBQUssQ0FBQyxHQUFHLEdBQUcsUUFBUSxHQUFHLElBQUksQ0FBQyxHQUFHLEdBQUcsQ0FBRztZQUVyQyxFQUFFLEVBQUUsSUFBSSxDQUFDLFNBQVMsRUFBRSxDQUFDO2dCQUNuQixLQUFLLEdBQUcsS0FBSyxDQUFDLFFBQVEsQ0FBQyxJQUFJLENBQUMsR0FBRyxLQUFLLElBQUksQ0FBQyxZQUFZO2dCQUVyRCxFQUFFLEVBQUUsU0FBUyxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsU0FBUyxNQUFNLENBQW1CLG9CQUFFLENBQUM7b0JBQzNELE9BQU8sR0FBSSxJQUFJLENBQUMsU0FBUyxDQUFpQixNQUFNLEVBQUUsS0FBSztnQkFDekQsQ0FBQyxNQUFNLEVBQUUsRUFBRSxlQUFlLENBQUMsSUFBSSxDQUFDLElBQUksQ0FBQyxTQUFTLEVBQUUsS0FBSyxHQUFHLENBQUM7b0JBQ3ZELE9BQU8sR0FBSSxJQUFJLENBQUMsU0FBUyxDQUE4QixLQUFLLEVBQzFELE1BQU0sRUFDTixLQUFLO2dCQUVULENBQUMsTUFBTSxDQUFDO29CQUNOLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUNoQixFQUFFLEVBQUUsSUFBSSxDQUFDLEdBQUcsQ0FBQyw0QkFBNEIsRUFBRSxLQUFLLENBQUMsT0FBTztnQkFFN0QsQ0FBQztnQkFFRCxLQUFLLENBQUMsSUFBSSxHQUFHLE9BQU87WUFDdEIsQ0FBQztZQUVELE1BQU0sQ0FBQyxJQUFJO1FBQ2IsQ0FBQztJQUNILENBQUM7SUFFRCxNQUFNLENBQUMsS0FBSztBQUNkLENBQUM7QUFFRCxFQUF3RCxBQUF4RCxzREFBd0Q7QUFDeEQsRUFBdUQsQUFBdkQscURBQXVEO0FBQ3ZELEVBQUU7U0FDTyxTQUFTLENBQ2hCLEtBQWtCLEVBQ2xCLEtBQWEsRUFDYixNQUFXLEVBQ1gsS0FBYyxFQUNkLE9BQWdCLEVBQ2hCLEtBQUssR0FBRyxLQUFLLEVBQ0osQ0FBQztJQUNWLEtBQUssQ0FBQyxHQUFHLEdBQUcsSUFBSTtJQUNoQixLQUFLLENBQUMsSUFBSSxHQUFHLE1BQU07SUFFbkIsRUFBRSxHQUFHLFVBQVUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLEtBQUssR0FBRyxDQUFDO1FBQ3RDLFVBQVUsQ0FBQyxLQUFLLEVBQUUsTUFBTSxFQUFFLElBQUk7SUFDaEMsQ0FBQztJQUVELEtBQUssQ0FBQyxJQUFJLEdBQUcsU0FBUyxDQUFDLElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSTtJQUV0QyxFQUFFLEVBQUUsS0FBSyxFQUFFLENBQUM7UUFDVixLQUFLLEdBQUcsS0FBSyxDQUFDLFNBQVMsR0FBRyxDQUFDLElBQUksS0FBSyxDQUFDLFNBQVMsR0FBRyxLQUFLO0lBQ3hELENBQUM7SUFFRCxLQUFLLENBQUMsYUFBYSxHQUFHLElBQUksS0FBSyxDQUFpQixvQkFBSSxJQUFJLEtBQUssQ0FBZ0I7SUFFN0UsR0FBRyxDQUFDLGNBQWMsSUFBSSxDQUFDO0lBQ3ZCLEdBQUcsQ0FBQyxTQUFTLEdBQUcsS0FBSztJQUNyQixFQUFFLEVBQUUsYUFBYSxFQUFFLENBQUM7UUFDbEIsY0FBYyxHQUFHLEtBQUssQ0FBQyxVQUFVLENBQUMsT0FBTyxDQUFDLE1BQU07UUFDaEQsU0FBUyxHQUFHLGNBQWMsTUFBTSxDQUFDO0lBQ25DLENBQUM7SUFFRCxFQUFFLEVBQ0MsS0FBSyxDQUFDLEdBQUcsS0FBSyxJQUFJLElBQUksS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFHLE1BQ3hDLFNBQVMsSUFDUixLQUFLLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxLQUFLLEdBQUcsQ0FBQyxFQUNoQyxDQUFDO1FBQ0QsT0FBTyxHQUFHLEtBQUs7SUFDakIsQ0FBQztJQUVELEVBQUUsRUFBRSxTQUFTLElBQUksS0FBSyxDQUFDLGNBQWMsQ0FBQyxjQUFjLEdBQUcsQ0FBQztRQUN0RCxLQUFLLENBQUMsSUFBSSxJQUFJLEtBQUssRUFBRSxjQUFjO0lBQ3JDLENBQUMsTUFBTSxDQUFDO1FBQ04sRUFBRSxFQUFFLGFBQWEsSUFBSSxTQUFTLEtBQUssS0FBSyxDQUFDLGNBQWMsQ0FBQyxjQUFjLEdBQUcsQ0FBQztZQUN4RSxLQUFLLENBQUMsY0FBYyxDQUFDLGNBQWMsSUFBSSxJQUFJO1FBQzdDLENBQUM7UUFDRCxFQUFFLEVBQUUsSUFBSSxLQUFLLENBQWlCLGtCQUFFLENBQUM7WUFDL0IsRUFBRSxFQUFFLEtBQUssSUFBSSxNQUFNLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxJQUFJLEVBQUUsTUFBTSxLQUFLLENBQUMsRUFBRSxDQUFDO2dCQUNsRCxpQkFBaUIsQ0FBQyxLQUFLLEVBQUUsS0FBSyxFQUFFLEtBQUssQ0FBQyxJQUFJLEVBQUUsT0FBTztnQkFDbkQsRUFBRSxFQUFFLFNBQVMsRUFBRSxDQUFDO29CQUNkLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSyxFQUFFLGNBQWMsR0FBRyxLQUFLLENBQUMsSUFBSTtnQkFDbEQsQ0FBQztZQUNILENBQUMsTUFBTSxDQUFDO2dCQUNOLGdCQUFnQixDQUFDLEtBQUssRUFBRSxLQUFLLEVBQUUsS0FBSyxDQUFDLElBQUk7Z0JBQ3pDLEVBQUUsRUFBRSxTQUFTLEVBQUUsQ0FBQztvQkFDZCxLQUFLLENBQUMsSUFBSSxJQUFJLEtBQUssRUFBRSxjQUFjLENBQUMsQ0FBQyxFQUFFLEtBQUssQ0FBQyxJQUFJO2dCQUNuRCxDQUFDO1lBQ0gsQ0FBQztRQUNILENBQUMsTUFBTSxFQUFFLEVBQUUsSUFBSSxLQUFLLENBQWdCLGlCQUFFLENBQUM7WUFDckMsS0FBSyxDQUFDLFVBQVUsR0FBRyxLQUFLLENBQUMsYUFBYSxJQUFJLEtBQUssR0FBRyxDQUFDLEdBQUcsS0FBSyxHQUFHLENBQUMsR0FBRyxLQUFLO1lBQ3ZFLEVBQUUsRUFBRSxLQUFLLElBQUksS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNLEtBQUssQ0FBQyxFQUFFLENBQUM7Z0JBQ3JDLGtCQUFrQixDQUFDLEtBQUssRUFBRSxVQUFVLEVBQUUsS0FBSyxDQUFDLElBQUksRUFBRSxPQUFPO2dCQUN6RCxFQUFFLEVBQUUsU0FBUyxFQUFFLENBQUM7b0JBQ2QsS0FBSyxDQUFDLElBQUksSUFBSSxLQUFLLEVBQUUsY0FBYyxHQUFHLEtBQUssQ0FBQyxJQUFJO2dCQUNsRCxDQUFDO1lBQ0gsQ0FBQyxNQUFNLENBQUM7Z0JBQ04saUJBQWlCLENBQUMsS0FBSyxFQUFFLFVBQVUsRUFBRSxLQUFLLENBQUMsSUFBSTtnQkFDL0MsRUFBRSxFQUFFLFNBQVMsRUFBRSxDQUFDO29CQUNkLEtBQUssQ0FBQyxJQUFJLElBQUksS0FBSyxFQUFFLGNBQWMsQ0FBQyxDQUFDLEVBQUUsS0FBSyxDQUFDLElBQUk7Z0JBQ25ELENBQUM7WUFDSCxDQUFDO1FBQ0gsQ0FBQyxNQUFNLEVBQUUsRUFBRSxJQUFJLEtBQUssQ0FBaUIsa0JBQUUsQ0FBQztZQUN0QyxFQUFFLEVBQUUsS0FBSyxDQUFDLEdBQUcsS0FBSyxDQUFHLElBQUUsQ0FBQztnQkFDdEIsV0FBVyxDQUFDLEtBQUssRUFBRSxLQUFLLENBQUMsSUFBSSxFQUFFLEtBQUssRUFBRSxLQUFLO1lBQzdDLENBQUM7UUFDSCxDQUFDLE1BQU0sQ0FBQztZQUNOLEVBQUUsRUFBRSxLQUFLLENBQUMsV0FBVyxFQUFFLE1BQU0sQ0FBQyxLQUFLO1lBQ25DLEtBQUssQ0FBQyxHQUFHLENBQUMsU0FBUyxFQUFFLHVDQUF1QyxFQUFFLElBQUk7UUFDcEUsQ0FBQztRQUVELEVBQUUsRUFBRSxLQUFLLENBQUMsR0FBRyxLQUFLLElBQUksSUFBSSxLQUFLLENBQUMsR0FBRyxLQUFLLENBQUcsSUFBRSxDQUFDO1lBQzVDLEtBQUssQ0FBQyxJQUFJLElBQUksRUFBRSxFQUFFLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxFQUFFLEtBQUssQ0FBQyxJQUFJO1FBQzVDLENBQUM7SUFDSCxDQUFDO0lBRUQsTUFBTSxDQUFDLElBQUk7QUFDYixDQUFDO1NBRVEsV0FBVyxDQUNsQixNQUFXLEVBQ1gsT0FBYyxFQUNkLGlCQUEyQixFQUNyQixDQUFDO0lBQ1AsRUFBRSxFQUFFLE1BQU0sS0FBSyxJQUFJLElBQUksTUFBTSxDQUFDLE1BQU0sS0FBSyxDQUFRLFNBQUUsQ0FBQztRQUNsRCxLQUFLLENBQUMsS0FBSyxHQUFHLE9BQU8sQ0FBQyxPQUFPLENBQUMsTUFBTTtRQUNwQyxFQUFFLEVBQUUsS0FBSyxNQUFNLENBQUMsRUFBRSxDQUFDO1lBQ2pCLEVBQUUsRUFBRSxpQkFBaUIsQ0FBQyxPQUFPLENBQUMsS0FBSyxPQUFPLENBQUMsRUFBRSxDQUFDO2dCQUM1QyxpQkFBaUIsQ0FBQyxJQUFJLENBQUMsS0FBSztZQUM5QixDQUFDO1FBQ0gsQ0FBQyxNQUFNLENBQUM7WUFDTixPQUFPLENBQUMsSUFBSSxDQUFDLE1BQU07WUFFbkIsRUFBRSxFQUFFLEtBQUssQ0FBQyxPQUFPLENBQUMsTUFBTSxHQUFHLENBQUM7Z0JBQzFCLEdBQUcsQ0FBRSxHQUFHLENBQUMsR0FBRyxHQUFHLENBQUMsRUFBRSxNQUFNLEdBQUcsTUFBTSxDQUFDLE1BQU0sRUFBRSxHQUFHLEdBQUcsTUFBTSxFQUFFLEdBQUcsSUFBSSxDQUFDLENBQUUsQ0FBQztvQkFDakUsV0FBVyxDQUFDLE1BQU0sQ0FBQyxHQUFHLEdBQUcsT0FBTyxFQUFFLGlCQUFpQjtnQkFDckQsQ0FBQztZQUNILENBQUMsTUFBTSxDQUFDO2dCQUNOLEtBQUssQ0FBQyxhQUFhLEdBQUcsTUFBTSxDQUFDLElBQUksQ0FBQyxNQUFNO2dCQUV4QyxHQUFHLENBQ0QsR0FBRyxDQUFDLEdBQUcsR0FBRyxDQUFDLEVBQUUsTUFBTSxHQUFHLGFBQWEsQ0FBQyxNQUFNLEVBQzFDLEdBQUcsR0FBRyxNQUFNLEVBQ1osR0FBRyxJQUFJLENBQUMsQ0FDUixDQUFDO29CQUNELFdBQVcsQ0FBQyxNQUFNLENBQUMsYUFBYSxDQUFDLEdBQUcsSUFBSSxPQUFPLEVBQUUsaUJBQWlCO2dCQUNwRSxDQUFDO1lBQ0gsQ0FBQztRQUNILENBQUM7SUFDSCxDQUFDO0FBQ0gsQ0FBQztTQUVRLHNCQUFzQixDQUM3QixNQUErQixFQUMvQixLQUFrQixFQUNaLENBQUM7SUFDUCxLQUFLLENBQUMsT0FBTyxHQUFVLENBQUMsQ0FBQyxFQUN2QixpQkFBaUIsR0FBYSxDQUFDLENBQUM7SUFFbEMsV0FBVyxDQUFDLE1BQU0sRUFBRSxPQUFPLEVBQUUsaUJBQWlCO0lBRTlDLEtBQUssQ0FBQyxNQUFNLEdBQUcsaUJBQWlCLENBQUMsTUFBTTtJQUN2QyxHQUFHLENBQUUsR0FBRyxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUUsS0FBSyxHQUFHLE1BQU0sRUFBRSxLQUFLLElBQUksQ0FBQyxDQUFFLENBQUM7UUFDL0MsS0FBSyxDQUFDLFVBQVUsQ0FBQyxJQUFJLENBQUMsT0FBTyxDQUFDLGlCQUFpQixDQUFDLEtBQUs7SUFDdkQsQ0FBQztJQUNELEtBQUssQ0FBQyxjQUFjLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxNQUFNO0FBQ3pDLENBQUM7QUFFRCxNQUFNLFVBQVUsSUFBSSxDQUFDLEtBQVUsRUFBRSxPQUE0QixFQUFVLENBQUM7SUFDdEUsT0FBTyxHQUFHLE9BQU8sSUFBSSxDQUFDO0lBQUEsQ0FBQztJQUV2QixLQUFLLENBQUMsS0FBSyxHQUFHLEdBQUcsQ0FBQyxXQUFXLENBQUMsT0FBTztJQUVyQyxFQUFFLEdBQUcsS0FBSyxDQUFDLE1BQU0sRUFBRSxzQkFBc0IsQ0FBQyxLQUFLLEVBQUUsS0FBSztJQUV0RCxFQUFFLEVBQUUsU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLEdBQUcsTUFBTSxJQUFJLEtBQUssQ0FBQyxJQUFJLENBQUMsRUFBRTtJQUVuRSxNQUFNLENBQUMsQ0FBRTtBQUNYLENBQUMifQ==