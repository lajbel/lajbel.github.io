import { YAMLError } from "../error.ts";
import * as common from "../utils.ts";
import { DumperState } from "./dumper_state.ts";
const _toString = Object.prototype.toString;
const _hasOwnProperty = Object.prototype.hasOwnProperty;
const CHAR_TAB = 0x09;
const CHAR_LINE_FEED = 0x0a;
const CHAR_SPACE = 0x20;
const CHAR_EXCLAMATION = 0x21;
const CHAR_DOUBLE_QUOTE = 0x22;
const CHAR_SHARP = 0x23;
const CHAR_PERCENT = 0x25;
const CHAR_AMPERSAND = 0x26;
const CHAR_SINGLE_QUOTE = 0x27;
const CHAR_ASTERISK = 0x2a;
const CHAR_COMMA = 0x2c;
const CHAR_MINUS = 0x2d;
const CHAR_COLON = 0x3a;
const CHAR_GREATER_THAN = 0x3e;
const CHAR_QUESTION = 0x3f;
const CHAR_COMMERCIAL_AT = 0x40;
const CHAR_LEFT_SQUARE_BRACKET = 0x5b;
const CHAR_RIGHT_SQUARE_BRACKET = 0x5d;
const CHAR_GRAVE_ACCENT = 0x60;
const CHAR_LEFT_CURLY_BRACKET = 0x7b;
const CHAR_VERTICAL_LINE = 0x7c;
const CHAR_RIGHT_CURLY_BRACKET = 0x7d;
const ESCAPE_SEQUENCES = {};
ESCAPE_SEQUENCES[0x00] = "\\0";
ESCAPE_SEQUENCES[0x07] = "\\a";
ESCAPE_SEQUENCES[0x08] = "\\b";
ESCAPE_SEQUENCES[0x09] = "\\t";
ESCAPE_SEQUENCES[0x0a] = "\\n";
ESCAPE_SEQUENCES[0x0b] = "\\v";
ESCAPE_SEQUENCES[0x0c] = "\\f";
ESCAPE_SEQUENCES[0x0d] = "\\r";
ESCAPE_SEQUENCES[0x1b] = "\\e";
ESCAPE_SEQUENCES[0x22] = '\\"';
ESCAPE_SEQUENCES[0x5c] = "\\\\";
ESCAPE_SEQUENCES[0x85] = "\\N";
ESCAPE_SEQUENCES[0xa0] = "\\_";
ESCAPE_SEQUENCES[0x2028] = "\\L";
ESCAPE_SEQUENCES[0x2029] = "\\P";
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
    if (character <= 0xff) {
        handle = "x";
        length = 2;
    }
    else if (character <= 0xffff) {
        handle = "u";
        length = 4;
    }
    else if (character <= 0xffffffff) {
        handle = "U";
        length = 8;
    }
    else {
        throw new YAMLError("code point within a string may not be greater than 0xFFFFFFFF");
    }
    return `\\${handle}${common.repeat("0", length - string.length)}${string}`;
}
function indentString(string, spaces) {
    const ind = common.repeat(" ", spaces), length = string.length;
    let position = 0, next = -1, result = "", line;
    while (position < length) {
        next = string.indexOf("\n", position);
        if (next === -1) {
            line = string.slice(position);
            position = length;
        }
        else {
            line = string.slice(position, next + 1);
            position = next + 1;
        }
        if (line.length && line !== "\n")
            result += ind;
        result += line;
    }
    return result;
}
function generateNextLine(state, level) {
    return `\n${common.repeat(" ", state.indent * level)}`;
}
function testImplicitResolving(state, str) {
    let type;
    for (let index = 0, length = state.implicitTypes.length; index < length; index += 1) {
        type = state.implicitTypes[index];
        if (type.resolve(str)) {
            return true;
        }
    }
    return false;
}
function isWhitespace(c) {
    return c === CHAR_SPACE || c === CHAR_TAB;
}
function isPrintable(c) {
    return ((0x00020 <= c && c <= 0x00007e) ||
        (0x000a1 <= c && c <= 0x00d7ff && c !== 0x2028 && c !== 0x2029) ||
        (0x0e000 <= c && c <= 0x00fffd && c !== 0xfeff) ||
        (0x10000 <= c && c <= 0x10ffff));
}
function isPlainSafe(c) {
    return (isPrintable(c) &&
        c !== 0xfeff &&
        c !== CHAR_COMMA &&
        c !== CHAR_LEFT_SQUARE_BRACKET &&
        c !== CHAR_RIGHT_SQUARE_BRACKET &&
        c !== CHAR_LEFT_CURLY_BRACKET &&
        c !== CHAR_RIGHT_CURLY_BRACKET &&
        c !== CHAR_COLON &&
        c !== CHAR_SHARP);
}
function isPlainSafeFirst(c) {
    return (isPrintable(c) &&
        c !== 0xfeff &&
        !isWhitespace(c) &&
        c !== CHAR_MINUS &&
        c !== CHAR_QUESTION &&
        c !== CHAR_COLON &&
        c !== CHAR_COMMA &&
        c !== CHAR_LEFT_SQUARE_BRACKET &&
        c !== CHAR_RIGHT_SQUARE_BRACKET &&
        c !== CHAR_LEFT_CURLY_BRACKET &&
        c !== CHAR_RIGHT_CURLY_BRACKET &&
        c !== CHAR_SHARP &&
        c !== CHAR_AMPERSAND &&
        c !== CHAR_ASTERISK &&
        c !== CHAR_EXCLAMATION &&
        c !== CHAR_VERTICAL_LINE &&
        c !== CHAR_GREATER_THAN &&
        c !== CHAR_SINGLE_QUOTE &&
        c !== CHAR_DOUBLE_QUOTE &&
        c !== CHAR_PERCENT &&
        c !== CHAR_COMMERCIAL_AT &&
        c !== CHAR_GRAVE_ACCENT);
}
function needIndentIndicator(string) {
    const leadingSpaceRe = /^\n* /;
    return leadingSpaceRe.test(string);
}
const STYLE_PLAIN = 1, STYLE_SINGLE = 2, STYLE_LITERAL = 3, STYLE_FOLDED = 4, STYLE_DOUBLE = 5;
function chooseScalarStyle(string, singleLineOnly, indentPerLevel, lineWidth, testAmbiguousType) {
    const shouldTrackWidth = lineWidth !== -1;
    let hasLineBreak = false, hasFoldableLine = false, previousLineBreak = -1, plain = isPlainSafeFirst(string.charCodeAt(0)) &&
        !isWhitespace(string.charCodeAt(string.length - 1));
    let char, i;
    if (singleLineOnly) {
        for (i = 0; i < string.length; i++) {
            char = string.charCodeAt(i);
            if (!isPrintable(char)) {
                return STYLE_DOUBLE;
            }
            plain = plain && isPlainSafe(char);
        }
    }
    else {
        for (i = 0; i < string.length; i++) {
            char = string.charCodeAt(i);
            if (char === CHAR_LINE_FEED) {
                hasLineBreak = true;
                if (shouldTrackWidth) {
                    hasFoldableLine = hasFoldableLine ||
                        (i - previousLineBreak - 1 > lineWidth &&
                            string[previousLineBreak + 1] !== " ");
                    previousLineBreak = i;
                }
            }
            else if (!isPrintable(char)) {
                return STYLE_DOUBLE;
            }
            plain = plain && isPlainSafe(char);
        }
        hasFoldableLine = hasFoldableLine ||
            (shouldTrackWidth &&
                i - previousLineBreak - 1 > lineWidth &&
                string[previousLineBreak + 1] !== " ");
    }
    if (!hasLineBreak && !hasFoldableLine) {
        return plain && !testAmbiguousType(string) ? STYLE_PLAIN : STYLE_SINGLE;
    }
    if (indentPerLevel > 9 && needIndentIndicator(string)) {
        return STYLE_DOUBLE;
    }
    return hasFoldableLine ? STYLE_FOLDED : STYLE_LITERAL;
}
function foldLine(line, width) {
    if (line === "" || line[0] === " ")
        return line;
    const breakRe = / [^ ]/g;
    let match;
    let start = 0, end, curr = 0, next = 0;
    let result = "";
    while ((match = breakRe.exec(line))) {
        next = match.index;
        if (next - start > width) {
            end = curr > start ? curr : next;
            result += `\n${line.slice(start, end)}`;
            start = end + 1;
        }
        curr = next;
    }
    result += "\n";
    if (line.length - start > width && curr > start) {
        result += `${line.slice(start, curr)}\n${line.slice(curr + 1)}`;
    }
    else {
        result += line.slice(start);
    }
    return result.slice(1);
}
function dropEndingNewline(string) {
    return string[string.length - 1] === "\n" ? string.slice(0, -1) : string;
}
function foldString(string, width) {
    const lineRe = /(\n+)([^\n]*)/g;
    let result = (() => {
        let nextLF = string.indexOf("\n");
        nextLF = nextLF !== -1 ? nextLF : string.length;
        lineRe.lastIndex = nextLF;
        return foldLine(string.slice(0, nextLF), width);
    })();
    let prevMoreIndented = string[0] === "\n" || string[0] === " ";
    let moreIndented;
    let match;
    while ((match = lineRe.exec(string))) {
        const prefix = match[1], line = match[2];
        moreIndented = line[0] === " ";
        result += prefix +
            (!prevMoreIndented && !moreIndented && line !== "" ? "\n" : "") +
            foldLine(line, width);
        prevMoreIndented = moreIndented;
    }
    return result;
}
function escapeString(string) {
    let result = "";
    let char, nextChar;
    let escapeSeq;
    for (let i = 0; i < string.length; i++) {
        char = string.charCodeAt(i);
        if (char >= 0xd800 && char <= 0xdbff) {
            nextChar = string.charCodeAt(i + 1);
            if (nextChar >= 0xdc00 && nextChar <= 0xdfff) {
                result += encodeHex((char - 0xd800) * 0x400 + nextChar - 0xdc00 + 0x10000);
                i++;
                continue;
            }
        }
        escapeSeq = ESCAPE_SEQUENCES[char];
        result += !escapeSeq && isPrintable(char)
            ? string[i]
            : escapeSeq || encodeHex(char);
    }
    return result;
}
function blockHeader(string, indentPerLevel) {
    const indentIndicator = needIndentIndicator(string)
        ? String(indentPerLevel)
        : "";
    const clip = string[string.length - 1] === "\n";
    const keep = clip && (string[string.length - 2] === "\n" || string === "\n");
    const chomp = keep ? "+" : clip ? "" : "-";
    return `${indentIndicator}${chomp}\n`;
}
function writeScalar(state, string, level, iskey) {
    state.dump = (() => {
        if (string.length === 0) {
            return "''";
        }
        if (!state.noCompatMode &&
            DEPRECATED_BOOLEANS_SYNTAX.indexOf(string) !== -1) {
            return `'${string}'`;
        }
        const indent = state.indent * Math.max(1, level);
        const lineWidth = state.lineWidth === -1
            ? -1
            : Math.max(Math.min(state.lineWidth, 40), state.lineWidth - indent);
        const singleLineOnly = iskey ||
            (state.flowLevel > -1 && level >= state.flowLevel);
        function testAmbiguity(str) {
            return testImplicitResolving(state, str);
        }
        switch (chooseScalarStyle(string, singleLineOnly, state.indent, lineWidth, testAmbiguity)) {
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
    for (let index = 0, length = object.length; index < length; index += 1) {
        if (writeNode(state, level, object[index], false, false)) {
            if (index !== 0)
                _result += `,${!state.condenseFlow ? " " : ""}`;
            _result += state.dump;
        }
    }
    state.tag = _tag;
    state.dump = `[${_result}]`;
}
function writeBlockSequence(state, level, object, compact = false) {
    let _result = "";
    const _tag = state.tag;
    for (let index = 0, length = object.length; index < length; index += 1) {
        if (writeNode(state, level + 1, object[index], true, true)) {
            if (!compact || index !== 0) {
                _result += generateNextLine(state, level);
            }
            if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
                _result += "-";
            }
            else {
                _result += "- ";
            }
            _result += state.dump;
        }
    }
    state.tag = _tag;
    state.dump = _result || "[]";
}
function writeFlowMapping(state, level, object) {
    let _result = "";
    const _tag = state.tag, objectKeyList = Object.keys(object);
    let pairBuffer, objectKey, objectValue;
    for (let index = 0, length = objectKeyList.length; index < length; index += 1) {
        pairBuffer = state.condenseFlow ? '"' : "";
        if (index !== 0)
            pairBuffer += ", ";
        objectKey = objectKeyList[index];
        objectValue = object[objectKey];
        if (!writeNode(state, level, objectKey, false, false)) {
            continue;
        }
        if (state.dump.length > 1024)
            pairBuffer += "? ";
        pairBuffer += `${state.dump}${state.condenseFlow ? '"' : ""}:${state.condenseFlow ? "" : " "}`;
        if (!writeNode(state, level, objectValue, false, false)) {
            continue;
        }
        pairBuffer += state.dump;
        _result += pairBuffer;
    }
    state.tag = _tag;
    state.dump = `{${_result}}`;
}
function writeBlockMapping(state, level, object, compact = false) {
    const _tag = state.tag, objectKeyList = Object.keys(object);
    let _result = "";
    if (state.sortKeys === true) {
        objectKeyList.sort();
    }
    else if (typeof state.sortKeys === "function") {
        objectKeyList.sort(state.sortKeys);
    }
    else if (state.sortKeys) {
        throw new YAMLError("sortKeys must be a boolean or a function");
    }
    let pairBuffer = "", objectKey, objectValue, explicitPair;
    for (let index = 0, length = objectKeyList.length; index < length; index += 1) {
        pairBuffer = "";
        if (!compact || index !== 0) {
            pairBuffer += generateNextLine(state, level);
        }
        objectKey = objectKeyList[index];
        objectValue = object[objectKey];
        if (!writeNode(state, level + 1, objectKey, true, true, true)) {
            continue;
        }
        explicitPair = (state.tag !== null && state.tag !== "?") ||
            (state.dump && state.dump.length > 1024);
        if (explicitPair) {
            if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
                pairBuffer += "?";
            }
            else {
                pairBuffer += "? ";
            }
        }
        pairBuffer += state.dump;
        if (explicitPair) {
            pairBuffer += generateNextLine(state, level);
        }
        if (!writeNode(state, level + 1, objectValue, true, explicitPair)) {
            continue;
        }
        if (state.dump && CHAR_LINE_FEED === state.dump.charCodeAt(0)) {
            pairBuffer += ":";
        }
        else {
            pairBuffer += ": ";
        }
        pairBuffer += state.dump;
        _result += pairBuffer;
    }
    state.tag = _tag;
    state.dump = _result || "{}";
}
function detectType(state, object, explicit = false) {
    const typeList = explicit ? state.explicitTypes : state.implicitTypes;
    let type;
    let style;
    let _result;
    for (let index = 0, length = typeList.length; index < length; index += 1) {
        type = typeList[index];
        if ((type.instanceOf || type.predicate) &&
            (!type.instanceOf ||
                (typeof object === "object" && object instanceof type.instanceOf)) &&
            (!type.predicate || type.predicate(object))) {
            state.tag = explicit ? type.tag : "?";
            if (type.represent) {
                style = state.styleMap[type.tag] || type.defaultStyle;
                if (_toString.call(type.represent) === "[object Function]") {
                    _result = type.represent(object, style);
                }
                else if (_hasOwnProperty.call(type.represent, style)) {
                    _result = type.represent[style](object, style);
                }
                else {
                    throw new YAMLError(`!<${type.tag}> tag resolver accepts not "${style}" style`);
                }
                state.dump = _result;
            }
            return true;
        }
    }
    return false;
}
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
    if ((state.tag !== null && state.tag !== "?") ||
        duplicate ||
        (state.indent !== 2 && level > 0)) {
        compact = false;
    }
    if (duplicate && state.usedDuplicates[duplicateIndex]) {
        state.dump = `*ref_${duplicateIndex}`;
    }
    else {
        if (objectOrArray && duplicate && !state.usedDuplicates[duplicateIndex]) {
            state.usedDuplicates[duplicateIndex] = true;
        }
        if (type === "[object Object]") {
            if (block && Object.keys(state.dump).length !== 0) {
                writeBlockMapping(state, level, state.dump, compact);
                if (duplicate) {
                    state.dump = `&ref_${duplicateIndex}${state.dump}`;
                }
            }
            else {
                writeFlowMapping(state, level, state.dump);
                if (duplicate) {
                    state.dump = `&ref_${duplicateIndex} ${state.dump}`;
                }
            }
        }
        else if (type === "[object Array]") {
            const arrayLevel = state.noArrayIndent && level > 0 ? level - 1 : level;
            if (block && state.dump.length !== 0) {
                writeBlockSequence(state, arrayLevel, state.dump, compact);
                if (duplicate) {
                    state.dump = `&ref_${duplicateIndex}${state.dump}`;
                }
            }
            else {
                writeFlowSequence(state, arrayLevel, state.dump);
                if (duplicate) {
                    state.dump = `&ref_${duplicateIndex} ${state.dump}`;
                }
            }
        }
        else if (type === "[object String]") {
            if (state.tag !== "?") {
                writeScalar(state, state.dump, level, iskey);
            }
        }
        else {
            if (state.skipInvalid)
                return false;
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
        }
        else {
            objects.push(object);
            if (Array.isArray(object)) {
                for (let idx = 0, length = object.length; idx < length; idx += 1) {
                    inspectNode(object[idx], objects, duplicatesIndexes);
                }
            }
            else {
                const objectKeyList = Object.keys(object);
                for (let idx = 0, length = objectKeyList.length; idx < length; idx += 1) {
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
    for (let index = 0; index < length; index += 1) {
        state.duplicates.push(objects[duplicatesIndexes[index]]);
    }
    state.usedDuplicates = new Array(length);
}
export function dump(input, options) {
    options = options || {};
    const state = new DumperState(options);
    if (!state.noRefs)
        getDuplicateReferences(input, state);
    if (writeNode(state, 0, input, true, true))
        return `${state.dump}\n`;
    return "";
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZHVtcGVyLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZHVtcGVyLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUtBLE9BQU8sRUFBRSxTQUFTLEVBQUUsTUFBTSxhQUFhLENBQUM7QUFFeEMsT0FBTyxLQUFLLE1BQU0sTUFBTSxhQUFhLENBQUM7QUFDdEMsT0FBTyxFQUFFLFdBQVcsRUFBc0IsTUFBTSxtQkFBbUIsQ0FBQztBQUtwRSxNQUFNLFNBQVMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVEsQ0FBQztBQUM1QyxNQUFNLGVBQWUsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLGNBQWMsQ0FBQztBQUV4RCxNQUFNLFFBQVEsR0FBRyxJQUFJLENBQUM7QUFDdEIsTUFBTSxjQUFjLEdBQUcsSUFBSSxDQUFDO0FBQzVCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQztBQUN4QixNQUFNLGdCQUFnQixHQUFHLElBQUksQ0FBQztBQUM5QixNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQztBQUMvQixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUM7QUFDeEIsTUFBTSxZQUFZLEdBQUcsSUFBSSxDQUFDO0FBQzFCLE1BQU0sY0FBYyxHQUFHLElBQUksQ0FBQztBQUM1QixNQUFNLGlCQUFpQixHQUFHLElBQUksQ0FBQztBQUMvQixNQUFNLGFBQWEsR0FBRyxJQUFJLENBQUM7QUFDM0IsTUFBTSxVQUFVLEdBQUcsSUFBSSxDQUFDO0FBQ3hCLE1BQU0sVUFBVSxHQUFHLElBQUksQ0FBQztBQUN4QixNQUFNLFVBQVUsR0FBRyxJQUFJLENBQUM7QUFDeEIsTUFBTSxpQkFBaUIsR0FBRyxJQUFJLENBQUM7QUFDL0IsTUFBTSxhQUFhLEdBQUcsSUFBSSxDQUFDO0FBQzNCLE1BQU0sa0JBQWtCLEdBQUcsSUFBSSxDQUFDO0FBQ2hDLE1BQU0sd0JBQXdCLEdBQUcsSUFBSSxDQUFDO0FBQ3RDLE1BQU0seUJBQXlCLEdBQUcsSUFBSSxDQUFDO0FBQ3ZDLE1BQU0s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QUUsS0FBSyxJQUFJLENBQUMsRUFBRTtRQUM5QyxLQUFLLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsaUJBQWlCLENBQUMsS0FBSyxDQUFDLENBQUMsQ0FBQyxDQUFDO0tBQzFEO0lBQ0QsS0FBSyxDQUFDLGNBQWMsR0FBRyxJQUFJLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztBQUMzQyxDQUFDO0FBRUQsTUFBTSxVQUFVLElBQUksQ0FBQyxLQUFVLEVBQUUsT0FBNEI7SUFDM0QsT0FBTyxHQUFHLE9BQU8sSUFBSSxFQUFFLENBQUM7SUFFeEIsTUFBTSxLQUFLLEdBQUcsSUFBSSxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7SUFFdkMsSUFBSSxDQUFDLEtBQUssQ0FBQyxNQUFNO1FBQUUsc0JBQXNCLENBQUMsS0FBSyxFQUFFLEtBQUssQ0FBQyxDQUFDO0lBRXhELElBQUksU0FBUyxDQUFDLEtBQUssRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxJQUFJLENBQUM7UUFBRSxPQUFPLEdBQUcsS0FBSyxDQUFDLElBQUksSUFBSSxDQUFDO0lBRXJFLE9BQU8sRUFBRSxDQUFDO0FBQ1osQ0FBQyIsInNvdXJjZXNDb250ZW50IjpbIi8vIFBvcnRlZCBmcm9tIGpzLXlhbWwgdjMuMTMuMTpcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ub2RlY2EvanMteWFtbC9jb21taXQvNjY1YWFkZGE0MjM0OWRjYWU4NjlmMTIwNDBkOWIxMGVmMThkMTJkYVxuLy8gQ29weXJpZ2h0IDIwMTEtMjAxNSBieSBWaXRhbHkgUHV6cmluLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIENvcHlyaWdodCAyMDE4LTIwMjEgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbmltcG9ydCB7IFlBTUxFcnJvciB9IGZyb20gXCIuLi9lcnJvci50c1wiO1xuaW1wb3J0IHR5cGUgeyBSZXByZXNlbnRGbiwgU3R5bGVWYXJpYW50LCBUeXBlIH0gZnJvbSBcIi4uL3R5cGUudHNcIjtcbmltcG9ydCAqIGFzIGNvbW1vbiBmcm9tIFwiLi4vdXRpbHMudHNcIjtcbmltcG9ydCB7IER1bXBlclN0YXRlLCBEdW1wZXJTdGF0ZU9wdGlvbnMgfSBmcm9tIFwiLi9kdW1wZXJfc3RhdGUudHNcIjtcblxudHlwZSBBbnkgPSBjb21tb24uQW55O1xudHlwZSBBcnJheU9iamVjdDxUID0gQW55PiA9IGNvbW1vbi5BcnJheU9iamVjdDxUPjtcblxuY29uc3QgX3RvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZztcbmNvbnN0IF9oYXNPd25Qcm9wZXJ0eSA9IE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHk7XG5cbmNvbnN0IENIQVJfVEFCID0gMHgwOTsgLyogVGFiICovXG5jb25zdCBDSEFSX0xJTkVfRkVFRCA9IDB4MGE7IC8qIExGICovXG5jb25zdCBDSEFSX1NQQUNFID0gMHgyMDsgLyogU3BhY2UgKi9cbmNvbnN0IENIQVJfRVhDTEFNQVRJT04gPSAweDIxOyAvKiAhICovXG5jb25zdCBDSEFSX0RPVUJMRV9RVU9URSA9IDB4MjI7IC8qIFwiICovXG5jb25zdCBDSEFSX1NIQVJQID0gMHgyMzsgLyogIyAqL1xuY29uc3QgQ0hBUl9QRVJDRU5UID0gMHgyNTsgLyogJSAqL1xuY29uc3QgQ0hBUl9BTVBFUlNBTkQgPSAweDI2OyAvKiAmICovXG5jb25zdCBDSEFSX1NJTkdMRV9RVU9URSA9IDB4Mjc7IC8qICcgKi9cbmNvbnN0IENIQVJfQVNURVJJU0sgPSAweDJhOyAvKiAqICovXG5jb25zdCBDSEFSX0NPTU1BID0gMHgyYzsgLyogLCAqL1xuY29uc3QgQ0hBUl9NSU5VUyA9IDB4MmQ7IC8qIC0gKi9cbmNvbnN0IENIQVJfQ09MT04gPSAweDNhOyAvKiA6ICovXG5jb25zdCBDSEFSX0dSRUFURVJfVEhBTiA9IDB4M2U7IC8qID4gKi9cbmNvbnN0IENIQVJfUVVFU1RJT04gPSAweDNmOyAvKiA/ICovXG5jb25zdCBDSEFSX0NPTU1FUkNJQUxfQVQgPSAweDQwOyAvKiBAICovXG5jb25zdCBDSEFSX0xFRlRfU1FVQVJFX0JSQUNLRVQgPSAweDViOyAvKiBbICovXG5jb25zdCBDSEFSX1JJR0hUX1NRVUFSRV9CUkFDS0VUID0gMHg1ZDsgLyogXSAqL1xuY29uc3QgQ0hBUl9HUkFWRV9BQ0NFTlQgPSAweDYwOyAvKiBgICovXG5jb25zdCBDSEFSX0xFRlRfQ1VSTFlfQlJBQ0tFVCA9IDB4N2I7IC8qIHsgKi9cbmNvbnN0IENIQVJfVkVSVElDQUxfTElORSA9IDB4N2M7IC8qIHwgKi9cbmNvbnN0IENIQVJfUklHSFRfQ1VSTFlfQlJBQ0tFVCA9IDB4N2Q7IC8qIH0gKi9cblxuY29uc3QgRVNDQVBFX1NFUVVFTkNFUzogeyBbY2hhcjogbnVtYmVyXTogc3RyaW5nIH0gPSB7fTtcblxuRVNDQVBFX1NFUVVFTkNFU1sweDAwXSA9IFwiXFxcXDBcIjtcbkVTQ0FQRV9TRVFVRU5DRVNbMHgwN10gPSBcIlxcXFxhXCI7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4MDhdID0gXCJcXFxcYlwiO1xuRVNDQVBFX1NFUVVFTkNFU1sweDA5XSA9IFwiXFxcXHRcIjtcbkVTQ0FQRV9TRVFVRU5DRVNbMHgwYV0gPSBcIlxcXFxuXCI7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4MGJdID0gXCJcXFxcdlwiO1xuRVNDQVBFX1NFUVVFTkNFU1sweDBjXSA9IFwiXFxcXGZcIjtcbkVTQ0FQRV9TRVFVRU5DRVNbMHgwZF0gPSBcIlxcXFxyXCI7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4MWJdID0gXCJcXFxcZVwiO1xuRVNDQVBFX1NFUVVFTkNFU1sweDIyXSA9ICdcXFxcXCInO1xuRVNDQVBFX1NFUVVFTkNFU1sweDVjXSA9IFwiXFxcXFxcXFxcIjtcbkVTQ0FQRV9TRVFVRU5DRVNbMHg4NV0gPSBcIlxcXFxOXCI7XG5FU0NBUEVfU0VRVUVOQ0VTWzB4YTBdID0gXCJcXFxcX1wiO1xuRVNDQVBFX1NFUVVFTkNFU1sweDIwMjhdID0gXCJcXFxcTFwiO1xuRVNDQVBFX1NFUVVFTkNFU1sweDIwMjldID0gXCJcXFxcUFwiO1xuXG5jb25zdCBERVBSRUNBVEVEX0JPT0xFQU5TX1NZTlRBWCA9IFtcbiAgXCJ5XCIsXG4gIFwiWVwiLFxuICBcInllc1wiLFxuICBcIlllc1wiLFxuICBcIllFU1wiLFxuICBcIm9uXCIsXG4gIFwiT25cIixcbiAgXCJPTlwiLFxuICBcIm5cIixcbiAgXCJOXCIsXG4gIFwibm9cIixcbiAgXCJOb1wiLFxuICBcIk5PXCIsXG4gIFwib2ZmXCIsXG4gIFwiT2ZmXCIsXG4gIFwiT0ZGXCIsXG5dO1xuXG5mdW5jdGlvbiBlbmNvZGVIZXgoY2hhcmFjdGVyOiBudW1iZXIpOiBzdHJpbmcge1xuICBjb25zdCBzdHJpbmcgPSBjaGFyYWN0ZXIudG9TdHJpbmcoMTYpLnRvVXBwZXJDYXNlKCk7XG5cbiAgbGV0IGhhbmRsZTogc3RyaW5nO1xuICBsZXQgbGVuZ3RoOiBudW1iZXI7XG4gIGlmIChjaGFyYWN0ZXIgPD0gMHhmZikge1xuICAgIGhhbmRsZSA9IFwieFwiO1xuICAgIGxlbmd0aCA9IDI7XG4gIH0gZWxzZSBpZiAoY2hhcmFjdGVyIDw9IDB4ZmZmZikge1xuICAgIGhhbmRsZSA9IFwidVwiO1xuICAgIGxlbmd0aCA9IDQ7XG4gIH0gZWxzZSBpZiAoY2hhcmFjdGVyIDw9IDB4ZmZmZmZmZmYpIHtcbiAgICBoYW5kbGUgPSBcIlVcIjtcbiAgICBsZW5ndGggPSA4O1xuICB9IGVsc2Uge1xuICAgIHRocm93IG5ldyBZQU1MRXJyb3IoXG4gICAgICBcImNvZGUgcG9pbnQgd2l0aGluIGEgc3RyaW5nIG1heSBub3QgYmUgZ3JlYXRlciB0aGFuIDB4RkZGRkZGRkZcIixcbiAgICApO1xuICB9XG5cbiAgcmV0dXJuIGBcXFxcJHtoYW5kbGV9JHtjb21tb24ucmVwZWF0KFwiMFwiLCBsZW5ndGggLSBzdHJpbmcubGVuZ3RoKX0ke3N0cmluZ31gO1xufVxuXG4vLyBJbmRlbnRzIGV2ZXJ5IGxpbmUgaW4gYSBzdHJpbmcuIEVtcHR5IGxpbmVzIChcXG4gb25seSkgYXJlIG5vdCBpbmRlbnRlZC5cbmZ1bmN0aW9uIGluZGVudFN0cmluZyhzdHJpbmc6IHN0cmluZywgc3BhY2VzOiBudW1iZXIpOiBzdHJpbmcge1xuICBjb25zdCBpbmQgPSBjb21tb24ucmVwZWF0KFwiIFwiLCBzcGFjZXMpLFxuICAgIGxlbmd0aCA9IHN0cmluZy5sZW5ndGg7XG4gIGxldCBwb3NpdGlvbiA9IDAsXG4gICAgbmV4dCA9IC0xLFxuICAgIHJlc3VsdCA9IFwiXCIsXG4gICAgbGluZTogc3RyaW5nO1xuXG4gIHdoaWxlIChwb3NpdGlvbiA8IGxlbmd0aCkge1xuICAgIG5leHQgPSBzdHJpbmcuaW5kZXhPZihcIlxcblwiLCBwb3NpdGlvbik7XG4gICAgaWYgKG5leHQgPT09IC0xKSB7XG4gICAgICBsaW5lID0gc3RyaW5nLnNsaWNlKHBvc2l0aW9uKTtcbiAgICAgIHBvc2l0aW9uID0gbGVuZ3RoO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaW5lID0gc3RyaW5nLnNsaWNlKHBvc2l0aW9uLCBuZXh0ICsgMSk7XG4gICAgICBwb3NpdGlvbiA9IG5leHQgKyAxO1xuICAgIH1cblxuICAgIGlmIChsaW5lLmxlbmd0aCAmJiBsaW5lICE9PSBcIlxcblwiKSByZXN1bHQgKz0gaW5kO1xuXG4gICAgcmVzdWx0ICs9IGxpbmU7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5mdW5jdGlvbiBnZW5lcmF0ZU5leHRMaW5lKHN0YXRlOiBEdW1wZXJTdGF0ZSwgbGV2ZWw6IG51bWJlcik6IHN0cmluZyB7XG4gIHJldHVybiBgXFxuJHtjb21tb24ucmVwZWF0KFwiIFwiLCBzdGF0ZS5pbmRlbnQgKiBsZXZlbCl9YDtcbn1cblxuZnVuY3Rpb24gdGVzdEltcGxpY2l0UmVzb2x2aW5nKHN0YXRlOiBEdW1wZXJTdGF0ZSwgc3RyOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgbGV0IHR5cGU6IFR5cGU7XG4gIGZvciAoXG4gICAgbGV0IGluZGV4ID0gMCwgbGVuZ3RoID0gc3RhdGUuaW1wbGljaXRUeXBlcy5sZW5ndGg7XG4gICAgaW5kZXggPCBsZW5ndGg7XG4gICAgaW5kZXggKz0gMVxuICApIHtcbiAgICB0eXBlID0gc3RhdGUuaW1wbGljaXRUeXBlc1tpbmRleF07XG5cbiAgICBpZiAodHlwZS5yZXNvbHZlKHN0cikpIHtcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBmYWxzZTtcbn1cblxuLy8gWzMzXSBzLXdoaXRlIDo6PSBzLXNwYWNlIHwgcy10YWJcbmZ1bmN0aW9uIGlzV2hpdGVzcGFjZShjOiBudW1iZXIpOiBib29sZWFuIHtcbiAgcmV0dXJuIGMgPT09IENIQVJfU1BBQ0UgfHwgYyA9PT0gQ0hBUl9UQUI7XG59XG5cbi8vIFJldHVybnMgdHJ1ZSBpZiB0aGUgY2hhcmFjdGVyIGNhbiBiZSBwcmludGVkIHdpdGhvdXQgZXNjYXBpbmcuXG4vLyBGcm9tIFlBTUwgMS4yOiBcImFueSBhbGxvd2VkIGNoYXJhY3RlcnMga25vd24gdG8gYmUgbm9uLXByaW50YWJsZVxuLy8gc2hvdWxkIGFsc28gYmUgZXNjYXBlZC4gW0hvd2V2ZXIsXSBUaGlzIGlzbuKAmXQgbWFuZGF0b3J5XCJcbi8vIERlcml2ZWQgZnJvbSBuYi1jaGFyIC0gXFx0IC0gI3g4NSAtICN4QTAgLSAjeDIwMjggLSAjeDIwMjkuXG5mdW5jdGlvbiBpc1ByaW50YWJsZShjOiBudW1iZXIpOiBib29sZWFuIHtcbiAgcmV0dXJuIChcbiAgICAoMHgwMDAyMCA8PSBjICYmIGMgPD0gMHgwMDAwN2UpIHx8XG4gICAgKDB4MDAwYTEgPD0gYyAmJiBjIDw9IDB4MDBkN2ZmICYmIGMgIT09IDB4MjAyOCAmJiBjICE9PSAweDIwMjkpIHx8XG4gICAgKDB4MGUwMDAgPD0gYyAmJiBjIDw9IDB4MDBmZmZkICYmIGMgIT09IDB4ZmVmZikgLyogQk9NICovIHx8XG4gICAgKDB4MTAwMDAgPD0gYyAmJiBjIDw9IDB4MTBmZmZmKVxuICApO1xufVxuXG4vLyBTaW1wbGlmaWVkIHRlc3QgZm9yIHZhbHVlcyBhbGxvd2VkIGFmdGVyIHRoZSBmaXJzdCBjaGFyYWN0ZXIgaW4gcGxhaW4gc3R5bGUuXG5mdW5jdGlvbiBpc1BsYWluU2FmZShjOiBudW1iZXIpOiBib29sZWFuIHtcbiAgLy8gVXNlcyBhIHN1YnNldCBvZiBuYi1jaGFyIC0gYy1mbG93LWluZGljYXRvciAtIFwiOlwiIC0gXCIjXCJcbiAgLy8gd2hlcmUgbmItY2hhciA6Oj0gYy1wcmludGFibGUgLSBiLWNoYXIgLSBjLWJ5dGUtb3JkZXItbWFyay5cbiAgcmV0dXJuIChcbiAgICBpc1ByaW50YWJsZShjKSAmJlxuICAgIGMgIT09IDB4ZmVmZiAmJlxuICAgIC8vIC0gYy1mbG93LWluZGljYXRvclxuICAgIGMgIT09IENIQVJfQ09NTUEgJiZcbiAgICBjICE9PSBDSEFSX0xFRlRfU1FVQVJFX0JSQUNLRVQgJiZcbiAgICBjICE9PSBDSEFSX1JJR0hUX1NRVUFSRV9CUkFDS0VUICYmXG4gICAgYyAhPT0gQ0hBUl9MRUZUX0NVUkxZX0JSQUNLRVQgJiZcbiAgICBjICE9PSBDSEFSX1JJR0hUX0NVUkxZX0JSQUNLRVQgJiZcbiAgICAvLyAtIFwiOlwiIC0gXCIjXCJcbiAgICBjICE9PSBDSEFSX0NPTE9OICYmXG4gICAgYyAhPT0gQ0hBUl9TSEFSUFxuICApO1xufVxuXG4vLyBTaW1wbGlmaWVkIHRlc3QgZm9yIHZhbHVlcyBhbGxvd2VkIGFzIHRoZSBmaXJzdCBjaGFyYWN0ZXIgaW4gcGxhaW4gc3R5bGUuXG5mdW5jdGlvbiBpc1BsYWluU2FmZUZpcnN0KGM6IG51bWJlcik6IGJvb2xlYW4ge1xuICAvLyBVc2VzIGEgc3Vic2V0IG9mIG5zLWNoYXIgLSBjLWluZGljYXRvclxuICAvLyB3aGVyZSBucy1jaGFyID0gbmItY2hhciAtIHMtd2hpdGUuXG4gIHJldHVybiAoXG4gICAgaXNQcmludGFibGUoYykgJiZcbiAgICBjICE9PSAweGZlZmYgJiZcbiAgICAhaXNXaGl0ZXNwYWNlKGMpICYmIC8vIC0gcy13aGl0ZVxuICAgIC8vIC0gKGMtaW5kaWNhdG9yIDo6PVxuICAgIC8vIOKAnC3igJ0gfCDigJw/4oCdIHwg4oCcOuKAnSB8IOKAnCzigJ0gfCDigJxb4oCdIHwg4oCcXeKAnSB8IOKAnHvigJ0gfCDigJx94oCdXG4gICAgYyAhPT0gQ0hBUl9NSU5VUyAmJlxuICAgIGMgIT09IENIQVJfUVVFU1RJT04gJiZcbiAgICBjICE9PSBDSEFSX0NPTE9OICYmXG4gICAgYyAhPT0gQ0hBUl9DT01NQSAmJlxuICAgIGMgIT09IENIQVJfTEVGVF9TUVVBUkVfQlJBQ0tFVCAmJlxuICAgIGMgIT09IENIQVJfUklHSFRfU1FVQVJFX0JSQUNLRVQgJiZcbiAgICBjICE9PSBDSEFSX0xFRlRfQ1VSTFlfQlJBQ0tFVCAmJlxuICAgIGMgIT09IENIQVJfUklHSFRfQ1VSTFlfQlJBQ0tFVCAmJlxuICAgIC8vIHwg4oCcI+KAnSB8IOKAnCbigJ0gfCDigJwq4oCdIHwg4oCcIeKAnSB8IOKAnHzigJ0gfCDigJw+4oCdIHwg4oCcJ+KAnSB8IOKAnFwi4oCdXG4gICAgYyAhPT0gQ0hBUl9TSEFSUCAmJlxuICAgIGMgIT09IENIQVJfQU1QRVJTQU5EICYmXG4gICAgYyAhPT0gQ0hBUl9BU1RFUklTSyAmJlxuICAgIGMgIT09IENIQVJfRVhDTEFNQVRJT04gJiZcbiAgICBjICE9PSBDSEFSX1ZFUlRJQ0FMX0xJTkUgJiZcbiAgICBjICE9PSBDSEFSX0dSRUFURVJfVEhBTiAmJlxuICAgIGMgIT09IENIQVJfU0lOR0xFX1FVT1RFICYmXG4gICAgYyAhPT0gQ0hBUl9ET1VCTEVfUVVPVEUgJiZcbiAgICAvLyB8IOKAnCXigJ0gfCDigJxA4oCdIHwg4oCcYOKAnSlcbiAgICBjICE9PSBDSEFSX1BFUkNFTlQgJiZcbiAgICBjICE9PSBDSEFSX0NPTU1FUkNJQUxfQVQgJiZcbiAgICBjICE9PSBDSEFSX0dSQVZFX0FDQ0VOVFxuICApO1xufVxuXG4vLyBEZXRlcm1pbmVzIHdoZXRoZXIgYmxvY2sgaW5kZW50YXRpb24gaW5kaWNhdG9yIGlzIHJlcXVpcmVkLlxuZnVuY3Rpb24gbmVlZEluZGVudEluZGljYXRvcihzdHJpbmc6IHN0cmluZyk6IGJvb2xlYW4ge1xuICBjb25zdCBsZWFkaW5nU3BhY2VSZSA9IC9eXFxuKiAvO1xuICByZXR1cm4gbGVhZGluZ1NwYWNlUmUudGVzdChzdHJpbmcpO1xufVxuXG5jb25zdCBTVFlMRV9QTEFJTiA9IDEsXG4gIFNUWUxFX1NJTkdMRSA9IDIsXG4gIFNUWUxFX0xJVEVSQUwgPSAzLFxuICBTVFlMRV9GT0xERUQgPSA0LFxuICBTVFlMRV9ET1VCTEUgPSA1O1xuXG4vLyBEZXRlcm1pbmVzIHdoaWNoIHNjYWxhciBzdHlsZXMgYXJlIHBvc3NpYmxlIGFuZCByZXR1cm5zIHRoZSBwcmVmZXJyZWQgc3R5bGUuXG4vLyBsaW5lV2lkdGggPSAtMSA9PiBubyBsaW1pdC5cbi8vIFByZS1jb25kaXRpb25zOiBzdHIubGVuZ3RoID4gMC5cbi8vIFBvc3QtY29uZGl0aW9uczpcbi8vICBTVFlMRV9QTEFJTiBvciBTVFlMRV9TSU5HTEUgPT4gbm8gXFxuIGFyZSBpbiB0aGUgc3RyaW5nLlxuLy8gIFNUWUxFX0xJVEVSQUwgPT4gbm8gbGluZXMgYXJlIHN1aXRhYmxlIGZvciBmb2xkaW5nIChvciBsaW5lV2lkdGggaXMgLTEpLlxuLy8gIFNUWUxFX0ZPTERFRCA9PiBhIGxpbmUgPiBsaW5lV2lkdGggYW5kIGNhbiBiZSBmb2xkZWQgKGFuZCBsaW5lV2lkdGggIT0gLTEpLlxuZnVuY3Rpb24gY2hvb3NlU2NhbGFyU3R5bGUoXG4gIHN0cmluZzogc3RyaW5nLFxuICBzaW5nbGVMaW5lT25seTogYm9vbGVhbixcbiAgaW5kZW50UGVyTGV2ZWw6IG51bWJlcixcbiAgbGluZVdpZHRoOiBudW1iZXIsXG4gIHRlc3RBbWJpZ3VvdXNUeXBlOiAoLi4uYXJnczogQW55W10pID0+IEFueSxcbik6IG51bWJlciB7XG4gIGNvbnN0IHNob3VsZFRyYWNrV2lkdGggPSBsaW5lV2lkdGggIT09IC0xO1xuICBsZXQgaGFzTGluZUJyZWFrID0gZmFsc2UsXG4gICAgaGFzRm9sZGFibGVMaW5lID0gZmFsc2UsIC8vIG9ubHkgY2hlY2tlZCBpZiBzaG91bGRUcmFja1dpZHRoXG4gICAgcHJldmlvdXNMaW5lQnJlYWsgPSAtMSwgLy8gY291bnQgdGhlIGZpcnN0IGxpbmUgY29ycmVjdGx5XG4gICAgcGxhaW4gPSBpc1BsYWluU2FmZUZpcnN0KHN0cmluZy5jaGFyQ29kZUF0KDApKSAmJlxuICAgICAgIWlzV2hpdGVzcGFjZShzdHJpbmcuY2hhckNvZGVBdChzdHJpbmcubGVuZ3RoIC0gMSkpO1xuXG4gIGxldCBjaGFyOiBudW1iZXIsIGk6IG51bWJlcjtcbiAgaWYgKHNpbmdsZUxpbmVPbmx5KSB7XG4gICAgLy8gQ2FzZTogbm8gYmxvY2sgc3R5bGVzLlxuICAgIC8vIENoZWNrIGZvciBkaXNhbGxvd2VkIGNoYXJhY3RlcnMgdG8gcnVsZSBvdXQgcGxhaW4gYW5kIHNpbmdsZS5cbiAgICBmb3IgKGkgPSAwOyBpIDwgc3RyaW5nLmxlbmd0aDsgaSsrKSB7XG4gICAgICBjaGFyID0gc3RyaW5nLmNoYXJDb2RlQXQoaSk7XG4gICAgICBpZiAoIWlzUHJpbnRhYmxlKGNoYXIpKSB7XG4gICAgICAgIHJldHVybiBTVFlMRV9ET1VCTEU7XG4gICAgICB9XG4gICAgICBwbGFpbiA9IHBsYWluICYmIGlzUGxhaW5TYWZlKGNoYXIpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICAvLyBDYXNlOiBibG9jayBzdHlsZXMgcGVybWl0dGVkLlxuICAgIGZvciAoaSA9IDA7IGkgPCBzdHJpbmcubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNoYXIgPSBzdHJpbmcuY2hhckNvZGVBdChpKTtcbiAgICAgIGlmIChjaGFyID09PSBDSEFSX0xJTkVfRkVFRCkge1xuICAgICAgICBoYXNMaW5lQnJlYWsgPSB0cnVlO1xuICAgICAgICAvLyBDaGVjayBpZiBhbnkgbGluZSBjYW4gYmUgZm9sZGVkLlxuICAgICAgICBpZiAoc2hvdWxkVHJhY2tXaWR0aCkge1xuICAgICAgICAgIGhhc0ZvbGRhYmxlTGluZSA9IGhhc0ZvbGRhYmxlTGluZSB8fFxuICAgICAgICAgICAgLy8gRm9sZGFibGUgbGluZSA9IHRvbyBsb25nLCBhbmQgbm90IG1vcmUtaW5kZW50ZWQuXG4gICAgICAgICAgICAoaSAtIHByZXZpb3VzTGluZUJyZWFrIC0gMSA+IGxpbmVXaWR0aCAmJlxuICAgICAgICAgICAgICBzdHJpbmdbcHJldmlvdXNMaW5lQnJlYWsgKyAxXSAhPT0gXCIgXCIpO1xuICAgICAgICAgIHByZXZpb3VzTGluZUJyZWFrID0gaTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmICghaXNQcmludGFibGUoY2hhcikpIHtcbiAgICAgICAgcmV0dXJuIFNUWUxFX0RPVUJMRTtcbiAgICAgIH1cbiAgICAgIHBsYWluID0gcGxhaW4gJiYgaXNQbGFpblNhZmUoY2hhcik7XG4gICAgfVxuICAgIC8vIGluIGNhc2UgdGhlIGVuZCBpcyBtaXNzaW5nIGEgXFxuXG4gICAgaGFzRm9sZGFibGVMaW5lID0gaGFzRm9sZGFibGVMaW5lIHx8XG4gICAgICAoc2hvdWxkVHJhY2tXaWR0aCAmJlxuICAgICAgICBpIC0gcHJldmlvdXNMaW5lQnJlYWsgLSAxID4gbGluZVdpZHRoICYmXG4gICAgICAgIHN0cmluZ1twcmV2aW91c0xpbmVCcmVhayArIDFdICE9PSBcIiBcIik7XG4gIH1cbiAgLy8gQWx0aG91Z2ggZXZlcnkgc3R5bGUgY2FuIHJlcHJlc2VudCBcXG4gd2l0aG91dCBlc2NhcGluZywgcHJlZmVyIGJsb2NrIHN0eWxlc1xuICAvLyBmb3IgbXVsdGlsaW5lLCBzaW5jZSB0aGV5J3JlIG1vcmUgcmVhZGFibGUgYW5kIHRoZXkgZG9uJ3QgYWRkIGVtcHR5IGxpbmVzLlxuICAvLyBBbHNvIHByZWZlciBmb2xkaW5nIGEgc3VwZXItbG9uZyBsaW5lLlxuICBpZiAoIWhhc0xpbmVCcmVhayAmJiAhaGFzRm9sZGFibGVMaW5lKSB7XG4gICAgLy8gU3RyaW5ncyBpbnRlcnByZXRhYmxlIGFzIGFub3RoZXIgdHlwZSBoYXZlIHRvIGJlIHF1b3RlZDtcbiAgICAvLyBlLmcuIHRoZSBzdHJpbmcgJ3RydWUnIHZzLiB0aGUgYm9vbGVhbiB0cnVlLlxuICAgIHJldHVybiBwbGFpbiAmJiAhdGVzdEFtYmlndW91c1R5cGUoc3RyaW5nKSA/IFNUWUxFX1BMQUlOIDogU1RZTEVfU0lOR0xFO1xuICB9XG4gIC8vIEVkZ2UgY2FzZTogYmxvY2sgaW5kZW50YXRpb24gaW5kaWNhdG9yIGNhbiBvbmx5IGhhdmUgb25lIGRpZ2l0LlxuICBpZiAoaW5kZW50UGVyTGV2ZWwgPiA5ICYmIG5lZWRJbmRlbnRJbmRpY2F0b3Ioc3RyaW5nKSkge1xuICAgIHJldHVybiBTVFlMRV9ET1VCTEU7XG4gIH1cbiAgLy8gQXQgdGhpcyBwb2ludCB3ZSBrbm93IGJsb2NrIHN0eWxlcyBhcmUgdmFsaWQuXG4gIC8vIFByZWZlciBsaXRlcmFsIHN0eWxlIHVubGVzcyB3ZSB3YW50IHRvIGZvbGQuXG4gIHJldHVybiBoYXNGb2xkYWJsZUxpbmUgPyBTVFlMRV9GT0xERUQgOiBTVFlMRV9MSVRFUkFMO1xufVxuXG4vLyBHcmVlZHkgbGluZSBicmVha2luZy5cbi8vIFBpY2tzIHRoZSBsb25nZXN0IGxpbmUgdW5kZXIgdGhlIGxpbWl0IGVhY2ggdGltZSxcbi8vIG90aGVyd2lzZSBzZXR0bGVzIGZvciB0aGUgc2hvcnRlc3QgbGluZSBvdmVyIHRoZSBsaW1pdC5cbi8vIE5CLiBNb3JlLWluZGVudGVkIGxpbmVzICpjYW5ub3QqIGJlIGZvbGRlZCwgYXMgdGhhdCB3b3VsZCBhZGQgYW4gZXh0cmEgXFxuLlxuZnVuY3Rpb24gZm9sZExpbmUobGluZTogc3RyaW5nLCB3aWR0aDogbnVtYmVyKTogc3RyaW5nIHtcbiAgaWYgKGxpbmUgPT09IFwiXCIgfHwgbGluZVswXSA9PT0gXCIgXCIpIHJldHVybiBsaW5lO1xuXG4gIC8vIFNpbmNlIGEgbW9yZS1pbmRlbnRlZCBsaW5lIGFkZHMgYSBcXG4sIGJyZWFrcyBjYW4ndCBiZSBmb2xsb3dlZCBieSBhIHNwYWNlLlxuICBjb25zdCBicmVha1JlID0gLyBbXiBdL2c7IC8vIG5vdGU6IHRoZSBtYXRjaCBpbmRleCB3aWxsIGFsd2F5cyBiZSA8PSBsZW5ndGgtMi5cbiAgbGV0IG1hdGNoO1xuICAvLyBzdGFydCBpcyBhbiBpbmNsdXNpdmUgaW5kZXguIGVuZCwgY3VyciwgYW5kIG5leHQgYXJlIGV4Y2x1c2l2ZS5cbiAgbGV0IHN0YXJ0ID0gMCxcbiAgICBlbmQsXG4gICAgY3VyciA9IDAsXG4gICAgbmV4dCA9IDA7XG4gIGxldCByZXN1bHQgPSBcIlwiO1xuXG4gIC8vIEludmFyaWFudHM6IDAgPD0gc3RhcnQgPD0gbGVuZ3RoLTEuXG4gIC8vICAgMCA8PSBjdXJyIDw9IG5leHQgPD0gbWF4KDAsIGxlbmd0aC0yKS4gY3VyciAtIHN0YXJ0IDw9IHdpZHRoLlxuICAvLyBJbnNpZGUgdGhlIGxvb3A6XG4gIC8vICAgQSBtYXRjaCBpbXBsaWVzIGxlbmd0aCA+PSAyLCBzbyBjdXJyIGFuZCBuZXh0IGFyZSA8PSBsZW5ndGgtMi5cbiAgLy8gdHNsaW50OmRpc2FibGUtbmV4dC1saW5lOm5vLWNvbmRpdGlvbmFsLWFzc2lnbm1lbnRcbiAgd2hpbGUgKChtYXRjaCA9IGJyZWFrUmUuZXhlYyhsaW5lKSkpIHtcbiAgICBuZXh0ID0gbWF0Y2guaW5kZXg7XG4gICAgLy8gbWFpbnRhaW4gaW52YXJpYW50OiBjdXJyIC0gc3RhcnQgPD0gd2lkdGhcbiAgICBpZiAobmV4dCAtIHN0YXJ0ID4gd2lkdGgpIHtcbiAgICAgIGVuZCA9IGN1cnIgPiBzdGFydCA/IGN1cnIgOiBuZXh0OyAvLyBkZXJpdmUgZW5kIDw9IGxlbmd0aC0yXG4gICAgICByZXN1bHQgKz0gYFxcbiR7bGluZS5zbGljZShzdGFydCwgZW5kKX1gO1xuICAgICAgLy8gc2tpcCB0aGUgc3BhY2UgdGhhdCB3YXMgb3V0cHV0IGFzIFxcblxuICAgICAgc3RhcnQgPSBlbmQgKyAxOyAvLyBkZXJpdmUgc3RhcnQgPD0gbGVuZ3RoLTFcbiAgICB9XG4gICAgY3VyciA9IG5leHQ7XG4gIH1cblxuICAvLyBCeSB0aGUgaW52YXJpYW50cywgc3RhcnQgPD0gbGVuZ3RoLTEsIHNvIHRoZXJlIGlzIHNvbWV0aGluZyBsZWZ0IG92ZXIuXG4gIC8vIEl0IGlzIGVpdGhlciB0aGUgd2hvbGUgc3RyaW5nIG9yIGEgcGFydCBzdGFydGluZyBmcm9tIG5vbi13aGl0ZXNwYWNlLlxuICByZXN1bHQgKz0gXCJcXG5cIjtcbiAgLy8gSW5zZXJ0IGEgYnJlYWsgaWYgdGhlIHJlbWFpbmRlciBpcyB0b28gbG9uZyBhbmQgdGhlcmUgaXMgYSBicmVhayBhdmFpbGFibGUuXG4gIGlmIChsaW5lLmxlbmd0aCAtIHN0YXJ0ID4gd2lkdGggJiYgY3VyciA+IHN0YXJ0KSB7XG4gICAgcmVzdWx0ICs9IGAke2xpbmUuc2xpY2Uoc3RhcnQsIGN1cnIpfVxcbiR7bGluZS5zbGljZShjdXJyICsgMSl9YDtcbiAgfSBlbHNlIHtcbiAgICByZXN1bHQgKz0gbGluZS5zbGljZShzdGFydCk7XG4gIH1cblxuICByZXR1cm4gcmVzdWx0LnNsaWNlKDEpOyAvLyBkcm9wIGV4dHJhIFxcbiBqb2luZXJcbn1cblxuLy8gKFNlZSB0aGUgbm90ZSBmb3Igd3JpdGVTY2FsYXIuKVxuZnVuY3Rpb24gZHJvcEVuZGluZ05ld2xpbmUoc3RyaW5nOiBzdHJpbmcpOiBzdHJpbmcge1xuICByZXR1cm4gc3RyaW5nW3N0cmluZy5sZW5ndGggLSAxXSA9PT0gXCJcXG5cIiA/IHN0cmluZy5zbGljZSgwLCAtMSkgOiBzdHJpbmc7XG59XG5cbi8vIE5vdGU6IGEgbG9uZyBsaW5lIHdpdGhvdXQgYSBzdWl0YWJsZSBicmVhayBwb2ludCB3aWxsIGV4Y2VlZCB0aGUgd2lkdGggbGltaXQuXG4vLyBQcmUtY29uZGl0aW9uczogZXZlcnkgY2hhciBpbiBzdHIgaXNQcmludGFibGUsIHN0ci5sZW5ndGggPiAwLCB3aWR0aCA+IDAuXG5mdW5jdGlvbiBmb2xkU3RyaW5nKHN0cmluZzogc3RyaW5nLCB3aWR0aDogbnVtYmVyKTogc3RyaW5nIHtcbiAgLy8gSW4gZm9sZGVkIHN0eWxlLCAkayQgY29uc2VjdXRpdmUgbmV3bGluZXMgb3V0cHV0IGFzICRrKzEkIG5ld2xpbmVz4oCUXG4gIC8vIHVubGVzcyB0aGV5J3JlIGJlZm9yZSBvciBhZnRlciBhIG1vcmUtaW5kZW50ZWQgbGluZSwgb3IgYXQgdGhlIHZlcnlcbiAgLy8gYmVnaW5uaW5nIG9yIGVuZCwgaW4gd2hpY2ggY2FzZSAkayQgbWFwcyB0byAkayQuXG4gIC8vIFRoZXJlZm9yZSwgcGFyc2UgZWFjaCBjaHVuayBhcyBuZXdsaW5lKHMpIGZvbGxvd2VkIGJ5IGEgY29udGVudCBsaW5lLlxuICBjb25zdCBsaW5lUmUgPSAvKFxcbispKFteXFxuXSopL2c7XG5cbiAgLy8gZmlyc3QgbGluZSAocG9zc2libHkgYW4gZW1wdHkgbGluZSlcbiAgbGV0IHJlc3VsdCA9ICgoKTogc3RyaW5nID0+IHtcbiAgICBsZXQgbmV4dExGID0gc3RyaW5nLmluZGV4T2YoXCJcXG5cIik7XG4gICAgbmV4dExGID0gbmV4dExGICE9PSAtMSA/IG5leHRMRiA6IHN0cmluZy5sZW5ndGg7XG4gICAgbGluZVJlLmxhc3RJbmRleCA9IG5leHRMRjtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVzZS1iZWZvcmUtZGVmaW5lXG4gICAgcmV0dXJuIGZvbGRMaW5lKHN0cmluZy5zbGljZSgwLCBuZXh0TEYpLCB3aWR0aCk7XG4gIH0pKCk7XG4gIC8vIElmIHdlIGhhdmVuJ3QgcmVhY2hlZCB0aGUgZmlyc3QgY29udGVudCBsaW5lIHlldCwgZG9uJ3QgYWRkIGFuIGV4dHJhIFxcbi5cbiAgbGV0IHByZXZNb3JlSW5kZW50ZWQgPSBzdHJpbmdbMF0gPT09IFwiXFxuXCIgfHwgc3RyaW5nWzBdID09PSBcIiBcIjtcbiAgbGV0IG1vcmVJbmRlbnRlZDtcblxuICAvLyByZXN0IG9mIHRoZSBsaW5lc1xuICBsZXQgbWF0Y2g7XG4gIC8vIHRzbGludDpkaXNhYmxlLW5leHQtbGluZTpuby1jb25kaXRpb25hbC1hc3NpZ25tZW50XG4gIHdoaWxlICgobWF0Y2ggPSBsaW5lUmUuZXhlYyhzdHJpbmcpKSkge1xuICAgIGNvbnN0IHByZWZpeCA9IG1hdGNoWzFdLFxuICAgICAgbGluZSA9IG1hdGNoWzJdO1xuICAgIG1vcmVJbmRlbnRlZCA9IGxpbmVbMF0gPT09IFwiIFwiO1xuICAgIHJlc3VsdCArPSBwcmVmaXggK1xuICAgICAgKCFwcmV2TW9yZUluZGVudGVkICYmICFtb3JlSW5kZW50ZWQgJiYgbGluZSAhPT0gXCJcIiA/IFwiXFxuXCIgOiBcIlwiKSArXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVzZS1iZWZvcmUtZGVmaW5lXG4gICAgICBmb2xkTGluZShsaW5lLCB3aWR0aCk7XG4gICAgcHJldk1vcmVJbmRlbnRlZCA9IG1vcmVJbmRlbnRlZDtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8vIEVzY2FwZXMgYSBkb3VibGUtcXVvdGVkIHN0cmluZy5cbmZ1bmN0aW9uIGVzY2FwZVN0cmluZyhzdHJpbmc6IHN0cmluZyk6IHN0cmluZyB7XG4gIGxldCByZXN1bHQgPSBcIlwiO1xuICBsZXQgY2hhciwgbmV4dENoYXI7XG4gIGxldCBlc2NhcGVTZXE7XG5cbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBzdHJpbmcubGVuZ3RoOyBpKyspIHtcbiAgICBjaGFyID0gc3RyaW5nLmNoYXJDb2RlQXQoaSk7XG4gICAgLy8gQ2hlY2sgZm9yIHN1cnJvZ2F0ZSBwYWlycyAocmVmZXJlbmNlIFVuaWNvZGUgMy4wIHNlY3Rpb24gXCIzLjcgU3Vycm9nYXRlc1wiKS5cbiAgICBpZiAoY2hhciA+PSAweGQ4MDAgJiYgY2hhciA8PSAweGRiZmYgLyogaGlnaCBzdXJyb2dhdGUgKi8pIHtcbiAgICAgIG5leHRDaGFyID0gc3RyaW5nLmNoYXJDb2RlQXQoaSArIDEpO1xuICAgICAgaWYgKG5leHRDaGFyID49IDB4ZGMwMCAmJiBuZXh0Q2hhciA8PSAweGRmZmYgLyogbG93IHN1cnJvZ2F0ZSAqLykge1xuICAgICAgICAvLyBDb21iaW5lIHRoZSBzdXJyb2dhdGUgcGFpciBhbmQgc3RvcmUgaXQgZXNjYXBlZC5cbiAgICAgICAgcmVzdWx0ICs9IGVuY29kZUhleChcbiAgICAgICAgICAoY2hhciAtIDB4ZDgwMCkgKiAweDQwMCArIG5leHRDaGFyIC0gMHhkYzAwICsgMHgxMDAwMCxcbiAgICAgICAgKTtcbiAgICAgICAgLy8gQWR2YW5jZSBpbmRleCBvbmUgZXh0cmEgc2luY2Ugd2UgYWxyZWFkeSB1c2VkIHRoYXQgY2hhciBoZXJlLlxuICAgICAgICBpKys7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgIH1cbiAgICBlc2NhcGVTZXEgPSBFU0NBUEVfU0VRVUVOQ0VTW2NoYXJdO1xuICAgIHJlc3VsdCArPSAhZXNjYXBlU2VxICYmIGlzUHJpbnRhYmxlKGNoYXIpXG4gICAgICA/IHN0cmluZ1tpXVxuICAgICAgOiBlc2NhcGVTZXEgfHwgZW5jb2RlSGV4KGNoYXIpO1xuICB9XG5cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLy8gUHJlLWNvbmRpdGlvbnM6IHN0cmluZyBpcyB2YWxpZCBmb3IgYSBibG9jayBzY2FsYXIsIDEgPD0gaW5kZW50UGVyTGV2ZWwgPD0gOS5cbmZ1bmN0aW9uIGJsb2NrSGVhZGVyKHN0cmluZzogc3RyaW5nLCBpbmRlbnRQZXJMZXZlbDogbnVtYmVyKTogc3RyaW5nIHtcbiAgY29uc3QgaW5kZW50SW5kaWNhdG9yID0gbmVlZEluZGVudEluZGljYXRvcihzdHJpbmcpXG4gICAgPyBTdHJpbmcoaW5kZW50UGVyTGV2ZWwpXG4gICAgOiBcIlwiO1xuXG4gIC8vIG5vdGUgdGhlIHNwZWNpYWwgY2FzZTogdGhlIHN0cmluZyAnXFxuJyBjb3VudHMgYXMgYSBcInRyYWlsaW5nXCIgZW1wdHkgbGluZS5cbiAgY29uc3QgY2xpcCA9IHN0cmluZ1tzdHJpbmcubGVuZ3RoIC0gMV0gPT09IFwiXFxuXCI7XG4gIGNvbnN0IGtlZXAgPSBjbGlwICYmIChzdHJpbmdbc3RyaW5nLmxlbmd0aCAtIDJdID09PSBcIlxcblwiIHx8IHN0cmluZyA9PT0gXCJcXG5cIik7XG4gIGNvbnN0IGNob21wID0ga2VlcCA/IFwiK1wiIDogY2xpcCA/IFwiXCIgOiBcIi1cIjtcblxuICByZXR1cm4gYCR7aW5kZW50SW5kaWNhdG9yfSR7Y2hvbXB9XFxuYDtcbn1cblxuLy8gTm90ZTogbGluZSBicmVha2luZy9mb2xkaW5nIGlzIGltcGxlbWVudGVkIGZvciBvbmx5IHRoZSBmb2xkZWQgc3R5bGUuXG4vLyBOQi4gV2UgZHJvcCB0aGUgbGFzdCB0cmFpbGluZyBuZXdsaW5lIChpZiBhbnkpIG9mIGEgcmV0dXJuZWQgYmxvY2sgc2NhbGFyXG4vLyAgc2luY2UgdGhlIGR1bXBlciBhZGRzIGl0cyBvd24gbmV3bGluZS4gVGhpcyBhbHdheXMgd29ya3M6XG4vLyAgICDigKIgTm8gZW5kaW5nIG5ld2xpbmUgPT4gdW5hZmZlY3RlZDsgYWxyZWFkeSB1c2luZyBzdHJpcCBcIi1cIiBjaG9tcGluZy5cbi8vICAgIOKAoiBFbmRpbmcgbmV3bGluZSAgICA9PiByZW1vdmVkIHRoZW4gcmVzdG9yZWQuXG4vLyAgSW1wb3J0YW50bHksIHRoaXMga2VlcHMgdGhlIFwiK1wiIGNob21wIGluZGljYXRvciBmcm9tIGdhaW5pbmcgYW4gZXh0cmEgbGluZS5cbmZ1bmN0aW9uIHdyaXRlU2NhbGFyKFxuICBzdGF0ZTogRHVtcGVyU3RhdGUsXG4gIHN0cmluZzogc3RyaW5nLFxuICBsZXZlbDogbnVtYmVyLFxuICBpc2tleTogYm9vbGVhbixcbik6IHZvaWQge1xuICBzdGF0ZS5kdW1wID0gKCgpOiBzdHJpbmcgPT4ge1xuICAgIGlmIChzdHJpbmcubGVuZ3RoID09PSAwKSB7XG4gICAgICByZXR1cm4gXCInJ1wiO1xuICAgIH1cbiAgICBpZiAoXG4gICAgICAhc3RhdGUubm9Db21wYXRNb2RlICYmXG4gICAgICBERVBSRUNBVEVEX0JPT0xFQU5TX1NZTlRBWC5pbmRleE9mKHN0cmluZykgIT09IC0xXG4gICAgKSB7XG4gICAgICByZXR1cm4gYCcke3N0cmluZ30nYDtcbiAgICB9XG5cbiAgICBjb25zdCBpbmRlbnQgPSBzdGF0ZS5pbmRlbnQgKiBNYXRoLm1heCgxLCBsZXZlbCk7IC8vIG5vIDAtaW5kZW50IHNjYWxhcnNcbiAgICAvLyBBcyBpbmRlbnRhdGlvbiBnZXRzIGRlZXBlciwgbGV0IHRoZSB3aWR0aCBkZWNyZWFzZSBtb25vdG9uaWNhbGx5XG4gICAgLy8gdG8gdGhlIGxvd2VyIGJvdW5kIG1pbihzdGF0ZS5saW5lV2lkdGgsIDQwKS5cbiAgICAvLyBOb3RlIHRoYXQgdGhpcyBpbXBsaWVzXG4gICAgLy8gIHN0YXRlLmxpbmVXaWR0aCDiiaQgNDAgKyBzdGF0ZS5pbmRlbnQ6IHdpZHRoIGlzIGZpeGVkIGF0IHRoZSBsb3dlciBib3VuZC5cbiAgICAvLyAgc3RhdGUubGluZVdpZHRoID4gNDAgKyBzdGF0ZS5pbmRlbnQ6IHdpZHRoIGRlY3JlYXNlcyB1bnRpbCB0aGUgbG93ZXJcbiAgICAvLyAgYm91bmQuXG4gICAgLy8gVGhpcyBiZWhhdmVzIGJldHRlciB0aGFuIGEgY29uc3RhbnQgbWluaW11bSB3aWR0aCB3aGljaCBkaXNhbGxvd3NcbiAgICAvLyBuYXJyb3dlciBvcHRpb25zLCBvciBhbiBpbmRlbnQgdGhyZXNob2xkIHdoaWNoIGNhdXNlcyB0aGUgd2lkdGhcbiAgICAvLyB0byBzdWRkZW5seSBpbmNyZWFzZS5cbiAgICBjb25zdCBsaW5lV2lkdGggPSBzdGF0ZS5saW5lV2lkdGggPT09IC0xXG4gICAgICA/IC0xXG4gICAgICA6IE1hdGgubWF4KE1hdGgubWluKHN0YXRlLmxpbmVXaWR0aCwgNDApLCBzdGF0ZS5saW5lV2lkdGggLSBpbmRlbnQpO1xuXG4gICAgLy8gV2l0aG91dCBrbm93aW5nIGlmIGtleXMgYXJlIGltcGxpY2l0L2V4cGxpY2l0LFxuICAgIC8vIGFzc3VtZSBpbXBsaWNpdCBmb3Igc2FmZXR5LlxuICAgIGNvbnN0IHNpbmdsZUxpbmVPbmx5ID0gaXNrZXkgfHxcbiAgICAgIC8vIE5vIGJsb2NrIHN0eWxlcyBpbiBmbG93IG1vZGUuXG4gICAgICAoc3RhdGUuZmxvd0xldmVsID4gLTEgJiYgbGV2ZWwgPj0gc3RhdGUuZmxvd0xldmVsKTtcbiAgICBmdW5jdGlvbiB0ZXN0QW1iaWd1aXR5KHN0cjogc3RyaW5nKTogYm9vbGVhbiB7XG4gICAgICByZXR1cm4gdGVzdEltcGxpY2l0UmVzb2x2aW5nKHN0YXRlLCBzdHIpO1xuICAgIH1cblxuICAgIHN3aXRjaCAoXG4gICAgICBjaG9vc2VTY2FsYXJTdHlsZShcbiAgICAgICAgc3RyaW5nLFxuICAgICAgICBzaW5nbGVMaW5lT25seSxcbiAgICAgICAgc3RhdGUuaW5kZW50LFxuICAgICAgICBsaW5lV2lkdGgsXG4gICAgICAgIHRlc3RBbWJpZ3VpdHksXG4gICAgICApXG4gICAgKSB7XG4gICAgICBjYXNlIFNUWUxFX1BMQUlOOlxuICAgICAgICByZXR1cm4gc3RyaW5nO1xuICAgICAgY2FzZSBTVFlMRV9TSU5HTEU6XG4gICAgICAgIHJldHVybiBgJyR7c3RyaW5nLnJlcGxhY2UoLycvZywgXCInJ1wiKX0nYDtcbiAgICAgIGNhc2UgU1RZTEVfTElURVJBTDpcbiAgICAgICAgcmV0dXJuIGB8JHtibG9ja0hlYWRlcihzdHJpbmcsIHN0YXRlLmluZGVudCl9JHtcbiAgICAgICAgICBkcm9wRW5kaW5nTmV3bGluZShcbiAgICAgICAgICAgIGluZGVudFN0cmluZyhzdHJpbmcsIGluZGVudCksXG4gICAgICAgICAgKVxuICAgICAgICB9YDtcbiAgICAgIGNhc2UgU1RZTEVfRk9MREVEOlxuICAgICAgICByZXR1cm4gYD4ke2Jsb2NrSGVhZGVyKHN0cmluZywgc3RhdGUuaW5kZW50KX0ke1xuICAgICAgICAgIGRyb3BFbmRpbmdOZXdsaW5lKFxuICAgICAgICAgICAgaW5kZW50U3RyaW5nKGZvbGRTdHJpbmcoc3RyaW5nLCBsaW5lV2lkdGgpLCBpbmRlbnQpLFxuICAgICAgICAgIClcbiAgICAgICAgfWA7XG4gICAgICBjYXNlIFNUWUxFX0RPVUJMRTpcbiAgICAgICAgcmV0dXJuIGBcIiR7ZXNjYXBlU3RyaW5nKHN0cmluZyl9XCJgO1xuICAgICAgZGVmYXVsdDpcbiAgICAgICAgdGhyb3cgbmV3IFlBTUxFcnJvcihcImltcG9zc2libGUgZXJyb3I6IGludmFsaWQgc2NhbGFyIHN0eWxlXCIpO1xuICAgIH1cbiAgfSkoKTtcbn1cblxuZnVuY3Rpb24gd3JpdGVGbG93U2VxdWVuY2UoXG4gIHN0YXRlOiBEdW1wZXJTdGF0ZSxcbiAgbGV2ZWw6IG51bWJlcixcbiAgb2JqZWN0OiBBbnksXG4pOiB2b2lkIHtcbiAgbGV0IF9yZXN1bHQgPSBcIlwiO1xuICBjb25zdCBfdGFnID0gc3RhdGUudGFnO1xuXG4gIGZvciAobGV0IGluZGV4ID0gMCwgbGVuZ3RoID0gb2JqZWN0Lmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4ICs9IDEpIHtcbiAgICAvLyBXcml0ZSBvbmx5IHZhbGlkIGVsZW1lbnRzLlxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdXNlLWJlZm9yZS1kZWZpbmVcbiAgICBpZiAod3JpdGVOb2RlKHN0YXRlLCBsZXZlbCwgb2JqZWN0W2luZGV4XSwgZmFsc2UsIGZhbHNlKSkge1xuICAgICAgaWYgKGluZGV4ICE9PSAwKSBfcmVzdWx0ICs9IGAsJHshc3RhdGUuY29uZGVuc2VGbG93ID8gXCIgXCIgOiBcIlwifWA7XG4gICAgICBfcmVzdWx0ICs9IHN0YXRlLmR1bXA7XG4gICAgfVxuICB9XG5cbiAgc3RhdGUudGFnID0gX3RhZztcbiAgc3RhdGUuZHVtcCA9IGBbJHtfcmVzdWx0fV1gO1xufVxuXG5mdW5jdGlvbiB3cml0ZUJsb2NrU2VxdWVuY2UoXG4gIHN0YXRlOiBEdW1wZXJTdGF0ZSxcbiAgbGV2ZWw6IG51bWJlcixcbiAgb2JqZWN0OiBBbnksXG4gIGNvbXBhY3QgPSBmYWxzZSxcbik6IHZvaWQge1xuICBsZXQgX3Jlc3VsdCA9IFwiXCI7XG4gIGNvbnN0IF90YWcgPSBzdGF0ZS50YWc7XG5cbiAgZm9yIChsZXQgaW5kZXggPSAwLCBsZW5ndGggPSBvYmplY3QubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIC8vIFdyaXRlIG9ubHkgdmFsaWQgZWxlbWVudHMuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11c2UtYmVmb3JlLWRlZmluZVxuICAgIGlmICh3cml0ZU5vZGUoc3RhdGUsIGxldmVsICsgMSwgb2JqZWN0W2luZGV4XSwgdHJ1ZSwgdHJ1ZSkpIHtcbiAgICAgIGlmICghY29tcGFjdCB8fCBpbmRleCAhPT0gMCkge1xuICAgICAgICBfcmVzdWx0ICs9IGdlbmVyYXRlTmV4dExpbmUoc3RhdGUsIGxldmVsKTtcbiAgICAgIH1cblxuICAgICAgaWYgKHN0YXRlLmR1bXAgJiYgQ0hBUl9MSU5FX0ZFRUQgPT09IHN0YXRlLmR1bXAuY2hhckNvZGVBdCgwKSkge1xuICAgICAgICBfcmVzdWx0ICs9IFwiLVwiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgX3Jlc3VsdCArPSBcIi0gXCI7XG4gICAgICB9XG5cbiAgICAgIF9yZXN1bHQgKz0gc3RhdGUuZHVtcDtcbiAgICB9XG4gIH1cblxuICBzdGF0ZS50YWcgPSBfdGFnO1xuICBzdGF0ZS5kdW1wID0gX3Jlc3VsdCB8fCBcIltdXCI7IC8vIEVtcHR5IHNlcXVlbmNlIGlmIG5vIHZhbGlkIHZhbHVlcy5cbn1cblxuZnVuY3Rpb24gd3JpdGVGbG93TWFwcGluZyhcbiAgc3RhdGU6IER1bXBlclN0YXRlLFxuICBsZXZlbDogbnVtYmVyLFxuICBvYmplY3Q6IEFueSxcbik6IHZvaWQge1xuICBsZXQgX3Jlc3VsdCA9IFwiXCI7XG4gIGNvbnN0IF90YWcgPSBzdGF0ZS50YWcsXG4gICAgb2JqZWN0S2V5TGlzdCA9IE9iamVjdC5rZXlzKG9iamVjdCk7XG5cbiAgbGV0IHBhaXJCdWZmZXI6IHN0cmluZywgb2JqZWN0S2V5OiBzdHJpbmcsIG9iamVjdFZhbHVlOiBBbnk7XG4gIGZvciAoXG4gICAgbGV0IGluZGV4ID0gMCwgbGVuZ3RoID0gb2JqZWN0S2V5TGlzdC5sZW5ndGg7XG4gICAgaW5kZXggPCBsZW5ndGg7XG4gICAgaW5kZXggKz0gMVxuICApIHtcbiAgICBwYWlyQnVmZmVyID0gc3RhdGUuY29uZGVuc2VGbG93ID8gJ1wiJyA6IFwiXCI7XG5cbiAgICBpZiAoaW5kZXggIT09IDApIHBhaXJCdWZmZXIgKz0gXCIsIFwiO1xuXG4gICAgb2JqZWN0S2V5ID0gb2JqZWN0S2V5TGlzdFtpbmRleF07XG4gICAgb2JqZWN0VmFsdWUgPSBvYmplY3Rbb2JqZWN0S2V5XTtcblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdXNlLWJlZm9yZS1kZWZpbmVcbiAgICBpZiAoIXdyaXRlTm9kZShzdGF0ZSwgbGV2ZWwsIG9iamVjdEtleSwgZmFsc2UsIGZhbHNlKSkge1xuICAgICAgY29udGludWU7IC8vIFNraXAgdGhpcyBwYWlyIGJlY2F1c2Ugb2YgaW52YWxpZCBrZXk7XG4gICAgfVxuXG4gICAgaWYgKHN0YXRlLmR1bXAubGVuZ3RoID4gMTAyNCkgcGFpckJ1ZmZlciArPSBcIj8gXCI7XG5cbiAgICBwYWlyQnVmZmVyICs9IGAke3N0YXRlLmR1bXB9JHtzdGF0ZS5jb25kZW5zZUZsb3cgPyAnXCInIDogXCJcIn06JHtcbiAgICAgIHN0YXRlLmNvbmRlbnNlRmxvdyA/IFwiXCIgOiBcIiBcIlxuICAgIH1gO1xuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11c2UtYmVmb3JlLWRlZmluZVxuICAgIGlmICghd3JpdGVOb2RlKHN0YXRlLCBsZXZlbCwgb2JqZWN0VmFsdWUsIGZhbHNlLCBmYWxzZSkpIHtcbiAgICAgIGNvbnRpbnVlOyAvLyBTa2lwIHRoaXMgcGFpciBiZWNhdXNlIG9mIGludmFsaWQgdmFsdWUuXG4gICAgfVxuXG4gICAgcGFpckJ1ZmZlciArPSBzdGF0ZS5kdW1wO1xuXG4gICAgLy8gQm90aCBrZXkgYW5kIHZhbHVlIGFyZSB2YWxpZC5cbiAgICBfcmVzdWx0ICs9IHBhaXJCdWZmZXI7XG4gIH1cblxuICBzdGF0ZS50YWcgPSBfdGFnO1xuICBzdGF0ZS5kdW1wID0gYHske19yZXN1bHR9fWA7XG59XG5cbmZ1bmN0aW9uIHdyaXRlQmxvY2tNYXBwaW5nKFxuICBzdGF0ZTogRHVtcGVyU3RhdGUsXG4gIGxldmVsOiBudW1iZXIsXG4gIG9iamVjdDogQW55LFxuICBjb21wYWN0ID0gZmFsc2UsXG4pOiB2b2lkIHtcbiAgY29uc3QgX3RhZyA9IHN0YXRlLnRhZyxcbiAgICBvYmplY3RLZXlMaXN0ID0gT2JqZWN0LmtleXMob2JqZWN0KTtcbiAgbGV0IF9yZXN1bHQgPSBcIlwiO1xuXG4gIC8vIEFsbG93IHNvcnRpbmcga2V5cyBzbyB0aGF0IHRoZSBvdXRwdXQgZmlsZSBpcyBkZXRlcm1pbmlzdGljXG4gIGlmIChzdGF0ZS5zb3J0S2V5cyA9PT0gdHJ1ZSkge1xuICAgIC8vIERlZmF1bHQgc29ydGluZ1xuICAgIG9iamVjdEtleUxpc3Quc29ydCgpO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBzdGF0ZS5zb3J0S2V5cyA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgLy8gQ3VzdG9tIHNvcnQgZnVuY3Rpb25cbiAgICBvYmplY3RLZXlMaXN0LnNvcnQoc3RhdGUuc29ydEtleXMpO1xuICB9IGVsc2UgaWYgKHN0YXRlLnNvcnRLZXlzKSB7XG4gICAgLy8gU29tZXRoaW5nIGlzIHdyb25nXG4gICAgdGhyb3cgbmV3IFlBTUxFcnJvcihcInNvcnRLZXlzIG11c3QgYmUgYSBib29sZWFuIG9yIGEgZnVuY3Rpb25cIik7XG4gIH1cblxuICBsZXQgcGFpckJ1ZmZlciA9IFwiXCIsXG4gICAgb2JqZWN0S2V5OiBzdHJpbmcsXG4gICAgb2JqZWN0VmFsdWU6IEFueSxcbiAgICBleHBsaWNpdFBhaXI6IGJvb2xlYW47XG4gIGZvciAoXG4gICAgbGV0IGluZGV4ID0gMCwgbGVuZ3RoID0gb2JqZWN0S2V5TGlzdC5sZW5ndGg7XG4gICAgaW5kZXggPCBsZW5ndGg7XG4gICAgaW5kZXggKz0gMVxuICApIHtcbiAgICBwYWlyQnVmZmVyID0gXCJcIjtcblxuICAgIGlmICghY29tcGFjdCB8fCBpbmRleCAhPT0gMCkge1xuICAgICAgcGFpckJ1ZmZlciArPSBnZW5lcmF0ZU5leHRMaW5lKHN0YXRlLCBsZXZlbCk7XG4gICAgfVxuXG4gICAgb2JqZWN0S2V5ID0gb2JqZWN0S2V5TGlzdFtpbmRleF07XG4gICAgb2JqZWN0VmFsdWUgPSBvYmplY3Rbb2JqZWN0S2V5XTtcblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdXNlLWJlZm9yZS1kZWZpbmVcbiAgICBpZiAoIXdyaXRlTm9kZShzdGF0ZSwgbGV2ZWwgKyAxLCBvYmplY3RLZXksIHRydWUsIHRydWUsIHRydWUpKSB7XG4gICAgICBjb250aW51ZTsgLy8gU2tpcCB0aGlzIHBhaXIgYmVjYXVzZSBvZiBpbnZhbGlkIGtleS5cbiAgICB9XG5cbiAgICBleHBsaWNpdFBhaXIgPSAoc3RhdGUudGFnICE9PSBudWxsICYmIHN0YXRlLnRhZyAhPT0gXCI/XCIpIHx8XG4gICAgICAoc3RhdGUuZHVtcCAmJiBzdGF0ZS5kdW1wLmxlbmd0aCA+IDEwMjQpO1xuXG4gICAgaWYgKGV4cGxpY2l0UGFpcikge1xuICAgICAgaWYgKHN0YXRlLmR1bXAgJiYgQ0hBUl9MSU5FX0ZFRUQgPT09IHN0YXRlLmR1bXAuY2hhckNvZGVBdCgwKSkge1xuICAgICAgICBwYWlyQnVmZmVyICs9IFwiP1wiO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcGFpckJ1ZmZlciArPSBcIj8gXCI7XG4gICAgICB9XG4gICAgfVxuXG4gICAgcGFpckJ1ZmZlciArPSBzdGF0ZS5kdW1wO1xuXG4gICAgaWYgKGV4cGxpY2l0UGFpcikge1xuICAgICAgcGFpckJ1ZmZlciArPSBnZW5lcmF0ZU5leHRMaW5lKHN0YXRlLCBsZXZlbCk7XG4gICAgfVxuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby11c2UtYmVmb3JlLWRlZmluZVxuICAgIGlmICghd3JpdGVOb2RlKHN0YXRlLCBsZXZlbCArIDEsIG9iamVjdFZhbHVlLCB0cnVlLCBleHBsaWNpdFBhaXIpKSB7XG4gICAgICBjb250aW51ZTsgLy8gU2tpcCB0aGlzIHBhaXIgYmVjYXVzZSBvZiBpbnZhbGlkIHZhbHVlLlxuICAgIH1cblxuICAgIGlmIChzdGF0ZS5kdW1wICYmIENIQVJfTElORV9GRUVEID09PSBzdGF0ZS5kdW1wLmNoYXJDb2RlQXQoMCkpIHtcbiAgICAgIHBhaXJCdWZmZXIgKz0gXCI6XCI7XG4gICAgfSBlbHNlIHtcbiAgICAgIHBhaXJCdWZmZXIgKz0gXCI6IFwiO1xuICAgIH1cblxuICAgIHBhaXJCdWZmZXIgKz0gc3RhdGUuZHVtcDtcblxuICAgIC8vIEJvdGgga2V5IGFuZCB2YWx1ZSBhcmUgdmFsaWQuXG4gICAgX3Jlc3VsdCArPSBwYWlyQnVmZmVyO1xuICB9XG5cbiAgc3RhdGUudGFnID0gX3RhZztcbiAgc3RhdGUuZHVtcCA9IF9yZXN1bHQgfHwgXCJ7fVwiOyAvLyBFbXB0eSBtYXBwaW5nIGlmIG5vIHZhbGlkIHBhaXJzLlxufVxuXG5mdW5jdGlvbiBkZXRlY3RUeXBlKFxuICBzdGF0ZTogRHVtcGVyU3RhdGUsXG4gIG9iamVjdDogQW55LFxuICBleHBsaWNpdCA9IGZhbHNlLFxuKTogYm9vbGVhbiB7XG4gIGNvbnN0IHR5cGVMaXN0ID0gZXhwbGljaXQgPyBzdGF0ZS5leHBsaWNpdFR5cGVzIDogc3RhdGUuaW1wbGljaXRUeXBlcztcblxuICBsZXQgdHlwZTogVHlwZTtcbiAgbGV0IHN0eWxlOiBTdHlsZVZhcmlhbnQ7XG4gIGxldCBfcmVzdWx0OiBzdHJpbmc7XG4gIGZvciAobGV0IGluZGV4ID0gMCwgbGVuZ3RoID0gdHlwZUxpc3QubGVuZ3RoOyBpbmRleCA8IGxlbmd0aDsgaW5kZXggKz0gMSkge1xuICAgIHR5cGUgPSB0eXBlTGlzdFtpbmRleF07XG5cbiAgICBpZiAoXG4gICAgICAodHlwZS5pbnN0YW5jZU9mIHx8IHR5cGUucHJlZGljYXRlKSAmJlxuICAgICAgKCF0eXBlLmluc3RhbmNlT2YgfHxcbiAgICAgICAgKHR5cGVvZiBvYmplY3QgPT09IFwib2JqZWN0XCIgJiYgb2JqZWN0IGluc3RhbmNlb2YgdHlwZS5pbnN0YW5jZU9mKSkgJiZcbiAgICAgICghdHlwZS5wcmVkaWNhdGUgfHwgdHlwZS5wcmVkaWNhdGUob2JqZWN0KSlcbiAgICApIHtcbiAgICAgIHN0YXRlLnRhZyA9IGV4cGxpY2l0ID8gdHlwZS50YWcgOiBcIj9cIjtcblxuICAgICAgaWYgKHR5cGUucmVwcmVzZW50KSB7XG4gICAgICAgIHN0eWxlID0gc3RhdGUuc3R5bGVNYXBbdHlwZS50YWddIHx8IHR5cGUuZGVmYXVsdFN0eWxlO1xuXG4gICAgICAgIGlmIChfdG9TdHJpbmcuY2FsbCh0eXBlLnJlcHJlc2VudCkgPT09IFwiW29iamVjdCBGdW5jdGlvbl1cIikge1xuICAgICAgICAgIF9yZXN1bHQgPSAodHlwZS5yZXByZXNlbnQgYXMgUmVwcmVzZW50Rm4pKG9iamVjdCwgc3R5bGUpO1xuICAgICAgICB9IGVsc2UgaWYgKF9oYXNPd25Qcm9wZXJ0eS5jYWxsKHR5cGUucmVwcmVzZW50LCBzdHlsZSkpIHtcbiAgICAgICAgICBfcmVzdWx0ID0gKHR5cGUucmVwcmVzZW50IGFzIEFycmF5T2JqZWN0PFJlcHJlc2VudEZuPilbc3R5bGVdKFxuICAgICAgICAgICAgb2JqZWN0LFxuICAgICAgICAgICAgc3R5bGUsXG4gICAgICAgICAgKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB0aHJvdyBuZXcgWUFNTEVycm9yKFxuICAgICAgICAgICAgYCE8JHt0eXBlLnRhZ30+IHRhZyByZXNvbHZlciBhY2NlcHRzIG5vdCBcIiR7c3R5bGV9XCIgc3R5bGVgLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICBzdGF0ZS5kdW1wID0gX3Jlc3VsdDtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG4vLyBTZXJpYWxpemVzIGBvYmplY3RgIGFuZCB3cml0ZXMgaXQgdG8gZ2xvYmFsIGByZXN1bHRgLlxuLy8gUmV0dXJucyB0cnVlIG9uIHN1Y2Nlc3MsIG9yIGZhbHNlIG9uIGludmFsaWQgb2JqZWN0LlxuLy9cbmZ1bmN0aW9uIHdyaXRlTm9kZShcbiAgc3RhdGU6IER1bXBlclN0YXRlLFxuICBsZXZlbDogbnVtYmVyLFxuICBvYmplY3Q6IEFueSxcbiAgYmxvY2s6IGJvb2xlYW4sXG4gIGNvbXBhY3Q6IGJvb2xlYW4sXG4gIGlza2V5ID0gZmFsc2UsXG4pOiBib29sZWFuIHtcbiAgc3RhdGUudGFnID0gbnVsbDtcbiAgc3RhdGUuZHVtcCA9IG9iamVjdDtcblxuICBpZiAoIWRldGVjdFR5cGUoc3RhdGUsIG9iamVjdCwgZmFsc2UpKSB7XG4gICAgZGV0ZWN0VHlwZShzdGF0ZSwgb2JqZWN0LCB0cnVlKTtcbiAgfVxuXG4gIGNvbnN0IHR5cGUgPSBfdG9TdHJpbmcuY2FsbChzdGF0ZS5kdW1wKTtcblxuICBpZiAoYmxvY2spIHtcbiAgICBibG9jayA9IHN0YXRlLmZsb3dMZXZlbCA8IDAgfHwgc3RhdGUuZmxvd0xldmVsID4gbGV2ZWw7XG4gIH1cblxuICBjb25zdCBvYmplY3RPckFycmF5ID0gdHlwZSA9PT0gXCJbb2JqZWN0IE9iamVjdF1cIiB8fCB0eXBlID09PSBcIltvYmplY3QgQXJyYXldXCI7XG5cbiAgbGV0IGR1cGxpY2F0ZUluZGV4ID0gLTE7XG4gIGxldCBkdXBsaWNhdGUgPSBmYWxzZTtcbiAgaWYgKG9iamVjdE9yQXJyYXkpIHtcbiAgICBkdXBsaWNhdGVJbmRleCA9IHN0YXRlLmR1cGxpY2F0ZXMuaW5kZXhPZihvYmplY3QpO1xuICAgIGR1cGxpY2F0ZSA9IGR1cGxpY2F0ZUluZGV4ICE9PSAtMTtcbiAgfVxuXG4gIGlmIChcbiAgICAoc3RhdGUudGFnICE9PSBudWxsICYmIHN0YXRlLnRhZyAhPT0gXCI/XCIpIHx8XG4gICAgZHVwbGljYXRlIHx8XG4gICAgKHN0YXRlLmluZGVudCAhPT0gMiAmJiBsZXZlbCA+IDApXG4gICkge1xuICAgIGNvbXBhY3QgPSBmYWxzZTtcbiAgfVxuXG4gIGlmIChkdXBsaWNhdGUgJiYgc3RhdGUudXNlZER1cGxpY2F0ZXNbZHVwbGljYXRlSW5kZXhdKSB7XG4gICAgc3RhdGUuZHVtcCA9IGAqcmVmXyR7ZHVwbGljYXRlSW5kZXh9YDtcbiAgfSBlbHNlIHtcbiAgICBpZiAob2JqZWN0T3JBcnJheSAmJiBkdXBsaWNhdGUgJiYgIXN0YXRlLnVzZWREdXBsaWNhdGVzW2R1cGxpY2F0ZUluZGV4XSkge1xuICAgICAgc3RhdGUudXNlZER1cGxpY2F0ZXNbZHVwbGljYXRlSW5kZXhdID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHR5cGUgPT09IFwiW29iamVjdCBPYmplY3RdXCIpIHtcbiAgICAgIGlmIChibG9jayAmJiBPYmplY3Qua2V5cyhzdGF0ZS5kdW1wKS5sZW5ndGggIT09IDApIHtcbiAgICAgICAgd3JpdGVCbG9ja01hcHBpbmcoc3RhdGUsIGxldmVsLCBzdGF0ZS5kdW1wLCBjb21wYWN0KTtcbiAgICAgICAgaWYgKGR1cGxpY2F0ZSkge1xuICAgICAgICAgIHN0YXRlLmR1bXAgPSBgJnJlZl8ke2R1cGxpY2F0ZUluZGV4fSR7c3RhdGUuZHVtcH1gO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB3cml0ZUZsb3dNYXBwaW5nKHN0YXRlLCBsZXZlbCwgc3RhdGUuZHVtcCk7XG4gICAgICAgIGlmIChkdXBsaWNhdGUpIHtcbiAgICAgICAgICBzdGF0ZS5kdW1wID0gYCZyZWZfJHtkdXBsaWNhdGVJbmRleH0gJHtzdGF0ZS5kdW1wfWA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09IFwiW29iamVjdCBBcnJheV1cIikge1xuICAgICAgY29uc3QgYXJyYXlMZXZlbCA9IHN0YXRlLm5vQXJyYXlJbmRlbnQgJiYgbGV2ZWwgPiAwID8gbGV2ZWwgLSAxIDogbGV2ZWw7XG4gICAgICBpZiAoYmxvY2sgJiYgc3RhdGUuZHVtcC5sZW5ndGggIT09IDApIHtcbiAgICAgICAgd3JpdGVCbG9ja1NlcXVlbmNlKHN0YXRlLCBhcnJheUxldmVsLCBzdGF0ZS5kdW1wLCBjb21wYWN0KTtcbiAgICAgICAgaWYgKGR1cGxpY2F0ZSkge1xuICAgICAgICAgIHN0YXRlLmR1bXAgPSBgJnJlZl8ke2R1cGxpY2F0ZUluZGV4fSR7c3RhdGUuZHVtcH1gO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB3cml0ZUZsb3dTZXF1ZW5jZShzdGF0ZSwgYXJyYXlMZXZlbCwgc3RhdGUuZHVtcCk7XG4gICAgICAgIGlmIChkdXBsaWNhdGUpIHtcbiAgICAgICAgICBzdGF0ZS5kdW1wID0gYCZyZWZfJHtkdXBsaWNhdGVJbmRleH0gJHtzdGF0ZS5kdW1wfWA7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKHR5cGUgPT09IFwiW29iamVjdCBTdHJpbmddXCIpIHtcbiAgICAgIGlmIChzdGF0ZS50YWcgIT09IFwiP1wiKSB7XG4gICAgICAgIHdyaXRlU2NhbGFyKHN0YXRlLCBzdGF0ZS5kdW1wLCBsZXZlbCwgaXNrZXkpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoc3RhdGUuc2tpcEludmFsaWQpIHJldHVybiBmYWxzZTtcbiAgICAgIHRocm93IG5ldyBZQU1MRXJyb3IoYHVuYWNjZXB0YWJsZSBraW5kIG9mIGFuIG9iamVjdCB0byBkdW1wICR7dHlwZX1gKTtcbiAgICB9XG5cbiAgICBpZiAoc3RhdGUudGFnICE9PSBudWxsICYmIHN0YXRlLnRhZyAhPT0gXCI/XCIpIHtcbiAgICAgIHN0YXRlLmR1bXAgPSBgITwke3N0YXRlLnRhZ30+ICR7c3RhdGUuZHVtcH1gO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBpbnNwZWN0Tm9kZShcbiAgb2JqZWN0OiBBbnksXG4gIG9iamVjdHM6IEFueVtdLFxuICBkdXBsaWNhdGVzSW5kZXhlczogbnVtYmVyW10sXG4pOiB2b2lkIHtcbiAgaWYgKG9iamVjdCAhPT0gbnVsbCAmJiB0eXBlb2Ygb2JqZWN0ID09PSBcIm9iamVjdFwiKSB7XG4gICAgY29uc3QgaW5kZXggPSBvYmplY3RzLmluZGV4T2Yob2JqZWN0KTtcbiAgICBpZiAoaW5kZXggIT09IC0xKSB7XG4gICAgICBpZiAoZHVwbGljYXRlc0luZGV4ZXMuaW5kZXhPZihpbmRleCkgPT09IC0xKSB7XG4gICAgICAgIGR1cGxpY2F0ZXNJbmRleGVzLnB1c2goaW5kZXgpO1xuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBvYmplY3RzLnB1c2gob2JqZWN0KTtcblxuICAgICAgaWYgKEFycmF5LmlzQXJyYXkob2JqZWN0KSkge1xuICAgICAgICBmb3IgKGxldCBpZHggPSAwLCBsZW5ndGggPSBvYmplY3QubGVuZ3RoOyBpZHggPCBsZW5ndGg7IGlkeCArPSAxKSB7XG4gICAgICAgICAgaW5zcGVjdE5vZGUob2JqZWN0W2lkeF0sIG9iamVjdHMsIGR1cGxpY2F0ZXNJbmRleGVzKTtcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgY29uc3Qgb2JqZWN0S2V5TGlzdCA9IE9iamVjdC5rZXlzKG9iamVjdCk7XG5cbiAgICAgICAgZm9yIChcbiAgICAgICAgICBsZXQgaWR4ID0gMCwgbGVuZ3RoID0gb2JqZWN0S2V5TGlzdC5sZW5ndGg7XG4gICAgICAgICAgaWR4IDwgbGVuZ3RoO1xuICAgICAgICAgIGlkeCArPSAxXG4gICAgICAgICkge1xuICAgICAgICAgIGluc3BlY3ROb2RlKG9iamVjdFtvYmplY3RLZXlMaXN0W2lkeF1dLCBvYmplY3RzLCBkdXBsaWNhdGVzSW5kZXhlcyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuZnVuY3Rpb24gZ2V0RHVwbGljYXRlUmVmZXJlbmNlcyhcbiAgb2JqZWN0OiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPixcbiAgc3RhdGU6IER1bXBlclN0YXRlLFxuKTogdm9pZCB7XG4gIGNvbnN0IG9iamVjdHM6IEFueVtdID0gW10sXG4gICAgZHVwbGljYXRlc0luZGV4ZXM6IG51bWJlcltdID0gW107XG5cbiAgaW5zcGVjdE5vZGUob2JqZWN0LCBvYmplY3RzLCBkdXBsaWNhdGVzSW5kZXhlcyk7XG5cbiAgY29uc3QgbGVuZ3RoID0gZHVwbGljYXRlc0luZGV4ZXMubGVuZ3RoO1xuICBmb3IgKGxldCBpbmRleCA9IDA7IGluZGV4IDwgbGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgc3RhdGUuZHVwbGljYXRlcy5wdXNoKG9iamVjdHNbZHVwbGljYXRlc0luZGV4ZXNbaW5kZXhdXSk7XG4gIH1cbiAgc3RhdGUudXNlZER1cGxpY2F0ZXMgPSBuZXcgQXJyYXkobGVuZ3RoKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGR1bXAoaW5wdXQ6IEFueSwgb3B0aW9ucz86IER1bXBlclN0YXRlT3B0aW9ucyk6IHN0cmluZyB7XG4gIG9wdGlvbnMgPSBvcHRpb25zIHx8IHt9O1xuXG4gIGNvbnN0IHN0YXRlID0gbmV3IER1bXBlclN0YXRlKG9wdGlvbnMpO1xuXG4gIGlmICghc3RhdGUubm9SZWZzKSBnZXREdXBsaWNhdGVSZWZlcmVuY2VzKGlucHV0LCBzdGF0ZSk7XG5cbiAgaWYgKHdyaXRlTm9kZShzdGF0ZSwgMCwgaW5wdXQsIHRydWUsIHRydWUpKSByZXR1cm4gYCR7c3RhdGUuZHVtcH1cXG5gO1xuXG4gIHJldHVybiBcIlwiO1xufVxuIl19