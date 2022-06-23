// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { YAMLError } from "../error.ts";
import { Mark } from "../mark.ts";
import * as common from "../utils.ts";
import { LoaderState } from "./loader_state.ts";
const _hasOwnProperty = Object.prototype.hasOwnProperty;
const CONTEXT_FLOW_IN = 1;
const CONTEXT_FLOW_OUT = 2;
const CONTEXT_BLOCK_IN = 3;
const CONTEXT_BLOCK_OUT = 4;
const CHOMPING_CLIP = 1;
const CHOMPING_STRIP = 2;
const CHOMPING_KEEP = 3;
const PATTERN_NON_PRINTABLE = // deno-lint-ignore no-control-regex
/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x84\x86-\x9F\uFFFE\uFFFF]|[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?:[^\uD800-\uDBFF]|^)[\uDC00-\uDFFF]/;
const PATTERN_NON_ASCII_LINE_BREAKS = /[\x85\u2028\u2029]/;
const PATTERN_FLOW_INDICATORS = /[,\[\]\{\}]/;
const PATTERN_TAG_HANDLE = /^(?:!|!!|![a-z\-]+!)$/i;
const PATTERN_TAG_URI = /^(?:!|[^,\[\]\{\}])(?:%[0-9a-f]{2}|[0-9a-z\-#;\/\?:@&=\+\$,_\.!~\*'\(\)\[\]])*$/i;
function _class(obj) {
    return Object.prototype.toString.call(obj);
}
function isEOL(c) {
    return c === 10 || /* LF */ c === 13 /* CR */ ;
}
function isWhiteSpace(c) {
    return c === 9 || /* Tab */ c === 32 /* Space */ ;
}
function isWsOrEol(c) {
    return c === 9 /* Tab */  || c === 32 /* Space */  || c === 10 /* LF */  || c === 13 /* CR */ ;
}
function isFlowIndicator(c) {
    return c === 44 /* , */  || c === 91 /* [ */  || c === 93 /* ] */  || c === 123 /* { */  || c === 125 /* } */ ;
}
function fromHexCode(c) {
    if (48 <= /* 0 */ c && c <= 57 /* 9 */ ) {
        return c - 48;
    }
    const lc = c | 32;
    if (97 <= /* a */ lc && lc <= 102 /* f */ ) {
        return lc - 97 + 10;
    }
    return -1;
}
function escapedHexLen(c) {
    if (c === 120 /* x */ ) {
        return 2;
    }
    if (c === 117 /* u */ ) {
        return 4;
    }
    if (c === 85 /* U */ ) {
        return 8;
    }
    return 0;
}
function fromDecimalCode(c) {
    if (48 <= /* 0 */ c && c <= 57 /* 9 */ ) {
        return c - 48;
    }
    return -1;
}
function simpleEscapeSequence(c) {
    /* eslint:disable:prettier */ return c === 48 /* 0 */  ? "\x00" : c === 97 /* a */  ? "\x07" : c === 98 /* b */  ? "\x08" : c === 116 /* t */  ? "\x09" : c === 9 /* Tab */  ? "\x09" : c === 110 /* n */  ? "\x0A" : c === 118 /* v */  ? "\x0B" : c === 102 /* f */  ? "\x0C" : c === 114 /* r */  ? "\x0D" : c === 101 /* e */  ? "\x1B" : c === 32 /* Space */  ? " " : c === 34 /* " */  ? "\x22" : c === 47 /* / */  ? "/" : c === 92 /* \ */  ? "\x5C" : c === 78 /* N */  ? "\x85" : c === 95 /* _ */  ? "\xA0" : c === 76 /* L */  ? "\u2028" : c === 80 /* P */  ? "\u2029" : "";
/* eslint:enable:prettier */ }
function charFromCodepoint(c) {
    if (c <= 65535) {
        return String.fromCharCode(c);
    }
    // Encode UTF-16 surrogate pair
    // https://en.wikipedia.org/wiki/UTF-16#Code_points_U.2B010000_to_U.2B10FFFF
    return String.fromCharCode((c - 65536 >> 10) + 55296, (c - 65536 & 1023) + 56320);
}
const simpleEscapeCheck = new Array(256); // integer, for fast access
const simpleEscapeMap = new Array(256);
for(let i = 0; i < 256; i++){
    simpleEscapeCheck[i] = simpleEscapeSequence(i) ? 1 : 0;
    simpleEscapeMap[i] = simpleEscapeSequence(i);
}
function generateError(state, message) {
    return new YAMLError(message, new Mark(state.filename, state.input, state.position, state.line, state.position - state.lineStart));
}
function throwError(state, message) {
    throw generateError(state, message);
}
function throwWarning(state, message) {
    if (state.onWarning) {
        state.onWarning.call(null, generateError(state, message));
    }
}
const directiveHandlers = {
    YAML (state, _name, ...args) {
        if (state.version !== null) {
            return throwError(state, "duplication of %YAML directive");
        }
        if (args.length !== 1) {
            return throwError(state, "YAML directive accepts exactly one argument");
        }
        const match = /^([0-9]+)\.([0-9]+)$/.exec(args[0]);
        if (match === null) {
            return throwError(state, "ill-formed argument of the YAML directive");
        }
        const major = parseInt(match[1], 10);
        const minor = parseInt(match[2], 10);
        if (major !== 1) {
            return throwError(state, "unacceptable YAML version of the document");
        }
        state.version = args[0];
        state.checkLineBreaks = minor < 2;
        if (minor !== 1 && minor !== 2) {
            return throwWarning(state, "unsupported YAML version of the document");
        }
    },
    TAG (state, _name, ...args) {
        if (args.length !== 2) {
            return throwError(state, "TAG directive accepts exactly two arguments");
        }
        const handle = args[0];
        const prefix = args[1];
        if (!PATTERN_TAG_HANDLE.test(handle)) {
            return throwError(state, "ill-formed tag handle (first argument) of the TAG directive");
        }
        if (_hasOwnProperty.call(state.tagMap, handle)) {
            return throwError(state, `there is a previously declared suffix for "${handle}" tag handle`);
        }
        if (!PATTERN_TAG_URI.test(prefix)) {
            return throwError(state, "ill-formed tag prefix (second argument) of the TAG directive");
        }
        if (typeof state.tagMap === "undefined") {
            state.tagMap = {
            };
        }
        state.tagMap[handle] = prefix;
    }
};
function captureSegment(state, start, end, checkJson) {
    let result;
    if (start < end) {
        result = state.input.slice(start, end);
        if (checkJson) {
            for(let position = 0, length = result.length; position < length; position++){
                const character = result.charCodeAt(position);
                if (!(character === 9 || 32 <= character && character <= 1114111)) {
                    return throwError(state, "expected valid JSON character");
                }
            }
        } else if (PATTERN_NON_PRINTABLE.test(result)) {
            return throwError(state, "the stream contains non-printable characters");
        }
        state.result += result;
    }
}
function mergeMappings(state, destination, source, overridableKeys) {
    if (!common.isObject(source)) {
        return throwError(state, "cannot merge mappings; the provided source object is unacceptable");
    }
    const keys = Object.keys(source);
    for(let i = 0, len = keys.length; i < len; i++){
        const key = keys[i];
        if (!_hasOwnProperty.call(destination, key)) {
            destination[key] = source[key];
            overridableKeys[key] = true;
        }
    }
}
function storeMappingPair(state, result, overridableKeys, keyTag, keyNode, valueNode, startLine, startPos) {
    // The output is a plain object here, so keys can only be strings.
    // We need to convert keyNode to a string, but doing so can hang the process
    // (deeply nested arrays that explode exponentially using aliases).
    if (Array.isArray(keyNode)) {
        keyNode = Array.prototype.slice.call(keyNode);
        for(let index = 0, quantity = keyNode.length; index < quantity; index++){
            if (Array.isArray(keyNode[index])) {
                return throwError(state, "nested arrays are not supported inside keys");
            }
            if (typeof keyNode === "object" && _class(keyNode[index]) === "[object Object]") {
                keyNode[index] = "[object Object]";
            }
        }
    }
    // Avoid code execution in load() via toString property
    // (still use its own toString for arrays, timestamps,
    // and whatever user schema extensions happen to have @@toStringTag)
    if (typeof keyNode === "object" && _class(keyNode) === "[object Object]") {
        keyNode = "[object Object]";
    }
    keyNode = String(keyNode);
    if (result === null) {
        result = {
        };
    }
    if (keyTag === "tag:yaml.org,2002:merge") {
        if (Array.isArray(valueNode)) {
            for(let index = 0, quantity = valueNode.length; index < quantity; index++){
                mergeMappings(state, result, valueNode[index], overridableKeys);
            }
        } else {
            mergeMappings(state, result, valueNode, overridableKeys);
        }
    } else {
        if (!state.json && !_hasOwnProperty.call(overridableKeys, keyNode) && _hasOwnProperty.call(result, keyNode)) {
            state.line = startLine || state.line;
            state.position = startPos || state.position;
            return throwError(state, "duplicated mapping key");
        }
        result[keyNode] = valueNode;
        delete overridableKeys[keyNode];
    }
    return result;
}
function readLineBreak(state) {
    const ch = state.input.charCodeAt(state.position);
    if (ch === 10 /* LF */ ) {
        state.position++;
    } else if (ch === 13 /* CR */ ) {
        state.position++;
        if (state.input.charCodeAt(state.position) === 10 /* LF */ ) {
            state.position++;
        }
    } else {
        return throwError(state, "a line break is expected");
    }
    state.line += 1;
    state.lineStart = state.position;
}
function skipSeparationSpace(state, allowComments, checkIndent) {
    let lineBreaks = 0, ch = state.input.charCodeAt(state.position);
    while(ch !== 0){
        while(isWhiteSpace(ch)){
            ch = state.input.charCodeAt(++state.position);
        }
        if (allowComments && ch === 35 /* # */ ) {
            do {
                ch = state.input.charCodeAt(++state.position);
            }while (ch !== 10 && /* LF */ ch !== 13 && /* CR */ ch !== 0)
        }
        if (isEOL(ch)) {
            readLineBreak(state);
            ch = state.input.charCodeAt(state.position);
            lineBreaks++;
            state.lineIndent = 0;
            while(ch === 32 /* Space */ ){
                state.lineIndent++;
                ch = state.input.charCodeAt(++state.position);
            }
        } else {
            break;
        }
    }
    if (checkIndent !== -1 && lineBreaks !== 0 && state.lineIndent < checkIndent) {
        throwWarning(state, "deficient indentation");
    }
    return lineBreaks;
}
function testDocumentSeparator(state) {
    let _position = state.position;
    let ch = state.input.charCodeAt(_position);
    // Condition state.position === state.lineStart is tested
    // in parent on each call, for efficiency. No needs to test here again.
    if ((ch === 45 || /* - */ ch === 46) && ch === state.input.charCodeAt(_position + 1) && ch === state.input.charCodeAt(_position + 2)) {
        _position += 3;
        ch = state.input.charCodeAt(_position);
        if (ch === 0 || isWsOrEol(ch)) {
            return true;
        }
    }
    return false;
}
function writeFoldedLines(state, count) {
    if (count === 1) {
        state.result += " ";
    } else if (count > 1) {
        state.result += common.repeat("\n", count - 1);
    }
}
function readPlainScalar(state, nodeIndent, withinFlowCollection) {
    const kind = state.kind;
    const result = state.result;
    let ch = state.input.charCodeAt(state.position);
    if (isWsOrEol(ch) || isFlowIndicator(ch) || ch === 35 /* # */  || ch === 38 /* & */  || ch === 42 /* * */  || ch === 33 /* ! */  || ch === 124 /* | */  || ch === 62 /* > */  || ch === 39 /* ' */  || ch === 34 /* " */  || ch === 37 /* % */  || ch === 64 /* @ */  || ch === 96 /* ` */ ) {
        return false;
    }
    let following;
    if (ch === 63 || /* ? */ ch === 45 /* - */ ) {
        following = state.input.charCodeAt(state.position + 1);
        if (isWsOrEol(following) || withinFlowCollection && isFlowIndicator(following)) {
            return false;
        }
    }
    state.kind = "scalar";
    state.result = "";
    let captureEnd, captureStart = captureEnd = state.position;
    let hasPendingContent = false;
    let line = 0;
    while(ch !== 0){
        if (ch === 58 /* : */ ) {
            following = state.input.charCodeAt(state.position + 1);
            if (isWsOrEol(following) || withinFlowCollection && isFlowIndicator(following)) {
                break;
            }
        } else if (ch === 35 /* # */ ) {
            const preceding = state.input.charCodeAt(state.position - 1);
            if (isWsOrEol(preceding)) {
                break;
            }
        } else if (state.position === state.lineStart && testDocumentSeparator(state) || withinFlowCollection && isFlowIndicator(ch)) {
            break;
        } else if (isEOL(ch)) {
            line = state.line;
            const lineStart = state.lineStart;
            const lineIndent = state.lineIndent;
            skipSeparationSpace(state, false, -1);
            if (state.lineIndent >= nodeIndent) {
                hasPendingContent = true;
                ch = state.input.charCodeAt(state.position);
                continue;
            } else {
                state.position = captureEnd;
                state.line = line;
                state.lineStart = lineStart;
                state.lineIndent = lineIndent;
                break;
            }
        }
        if (hasPendingContent) {
            captureSegment(state, captureStart, captureEnd, false);
            writeFoldedLines(state, state.line - line);
            captureStart = captureEnd = state.position;
            hasPendingContent = false;
        }
        if (!isWhiteSpace(ch)) {
            captureEnd = state.position + 1;
        }
        ch = state.input.charCodeAt(++state.position);
    }
    captureSegment(state, captureStart, captureEnd, false);
    if (state.result) {
        return true;
    }
    state.kind = kind;
    state.result = result;
    return false;
}
function readSingleQuotedScalar(state, nodeIndent) {
    let ch, captureStart, captureEnd;
    ch = state.input.charCodeAt(state.position);
    if (ch !== 39 /* ' */ ) {
        return false;
    }
    state.kind = "scalar";
    state.result = "";
    state.position++;
    captureStart = captureEnd = state.position;
    while((ch = state.input.charCodeAt(state.position)) !== 0){
        if (ch === 39 /* ' */ ) {
            captureSegment(state, captureStart, state.position, true);
            ch = state.input.charCodeAt(++state.position);
            if (ch === 39 /* ' */ ) {
                captureStart = state.position;
                state.position++;
                captureEnd = state.position;
            } else {
                return true;
            }
        } else if (isEOL(ch)) {
            captureSegment(state, captureStart, captureEnd, true);
            writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
            captureStart = captureEnd = state.position;
        } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
            return throwError(state, "unexpected end of the document within a single quoted scalar");
        } else {
            state.position++;
            captureEnd = state.position;
        }
    }
    return throwError(state, "unexpected end of the stream within a single quoted scalar");
}
function readDoubleQuotedScalar(state, nodeIndent) {
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 34 /* " */ ) {
        return false;
    }
    state.kind = "scalar";
    state.result = "";
    state.position++;
    let captureEnd, captureStart = captureEnd = state.position;
    let tmp;
    while((ch = state.input.charCodeAt(state.position)) !== 0){
        if (ch === 34 /* " */ ) {
            captureSegment(state, captureStart, state.position, true);
            state.position++;
            return true;
        }
        if (ch === 92 /* \ */ ) {
            captureSegment(state, captureStart, state.position, true);
            ch = state.input.charCodeAt(++state.position);
            if (isEOL(ch)) {
                skipSeparationSpace(state, false, nodeIndent);
            // TODO(bartlomieju): rework to inline fn with no type cast?
            } else if (ch < 256 && simpleEscapeCheck[ch]) {
                state.result += simpleEscapeMap[ch];
                state.position++;
            } else if ((tmp = escapedHexLen(ch)) > 0) {
                let hexLength = tmp;
                let hexResult = 0;
                for(; hexLength > 0; hexLength--){
                    ch = state.input.charCodeAt(++state.position);
                    if ((tmp = fromHexCode(ch)) >= 0) {
                        hexResult = (hexResult << 4) + tmp;
                    } else {
                        return throwError(state, "expected hexadecimal character");
                    }
                }
                state.result += charFromCodepoint(hexResult);
                state.position++;
            } else {
                return throwError(state, "unknown escape sequence");
            }
            captureStart = captureEnd = state.position;
        } else if (isEOL(ch)) {
            captureSegment(state, captureStart, captureEnd, true);
            writeFoldedLines(state, skipSeparationSpace(state, false, nodeIndent));
            captureStart = captureEnd = state.position;
        } else if (state.position === state.lineStart && testDocumentSeparator(state)) {
            return throwError(state, "unexpected end of the document within a double quoted scalar");
        } else {
            state.position++;
            captureEnd = state.position;
        }
    }
    return throwError(state, "unexpected end of the stream within a double quoted scalar");
}
function readFlowCollection(state, nodeIndent) {
    let ch = state.input.charCodeAt(state.position);
    let terminator;
    let isMapping = true;
    let result = {
    };
    if (ch === 91 /* [ */ ) {
        terminator = 93; /* ] */ 
        isMapping = false;
        result = [];
    } else if (ch === 123 /* { */ ) {
        terminator = 125; /* } */ 
    } else {
        return false;
    }
    if (state.anchor !== null && typeof state.anchor != "undefined" && typeof state.anchorMap != "undefined") {
        state.anchorMap[state.anchor] = result;
    }
    ch = state.input.charCodeAt(++state.position);
    const tag = state.tag, anchor = state.anchor;
    let readNext = true;
    let valueNode, keyNode, keyTag = keyNode = valueNode = null, isExplicitPair, isPair = isExplicitPair = false;
    let following = 0, line = 0;
    const overridableKeys = {
    };
    while(ch !== 0){
        skipSeparationSpace(state, true, nodeIndent);
        ch = state.input.charCodeAt(state.position);
        if (ch === terminator) {
            state.position++;
            state.tag = tag;
            state.anchor = anchor;
            state.kind = isMapping ? "mapping" : "sequence";
            state.result = result;
            return true;
        }
        if (!readNext) {
            return throwError(state, "missed comma between flow collection entries");
        }
        keyTag = keyNode = valueNode = null;
        isPair = isExplicitPair = false;
        if (ch === 63 /* ? */ ) {
            following = state.input.charCodeAt(state.position + 1);
            if (isWsOrEol(following)) {
                isPair = isExplicitPair = true;
                state.position++;
                skipSeparationSpace(state, true, nodeIndent);
            }
        }
        line = state.line;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
        keyTag = state.tag || null;
        keyNode = state.result;
        skipSeparationSpace(state, true, nodeIndent);
        ch = state.input.charCodeAt(state.position);
        if ((isExplicitPair || state.line === line) && ch === 58 /* : */ ) {
            isPair = true;
            ch = state.input.charCodeAt(++state.position);
            skipSeparationSpace(state, true, nodeIndent);
            // eslint-disable-next-line @typescript-eslint/no-use-before-define
            composeNode(state, nodeIndent, CONTEXT_FLOW_IN, false, true);
            valueNode = state.result;
        }
        if (isMapping) {
            storeMappingPair(state, result, overridableKeys, keyTag, keyNode, valueNode);
        } else if (isPair) {
            result.push(storeMappingPair(state, null, overridableKeys, keyTag, keyNode, valueNode));
        } else {
            result.push(keyNode);
        }
        skipSeparationSpace(state, true, nodeIndent);
        ch = state.input.charCodeAt(state.position);
        if (ch === 44 /* , */ ) {
            readNext = true;
            ch = state.input.charCodeAt(++state.position);
        } else {
            readNext = false;
        }
    }
    return throwError(state, "unexpected end of the stream within a flow collection");
}
function readBlockScalar(state, nodeIndent) {
    let chomping = CHOMPING_CLIP, didReadContent = false, detectedIndent = false, textIndent = nodeIndent, emptyLines = 0, atMoreIndented = false;
    let ch = state.input.charCodeAt(state.position);
    let folding = false;
    if (ch === 124 /* | */ ) {
        folding = false;
    } else if (ch === 62 /* > */ ) {
        folding = true;
    } else {
        return false;
    }
    state.kind = "scalar";
    state.result = "";
    let tmp = 0;
    while(ch !== 0){
        ch = state.input.charCodeAt(++state.position);
        if (ch === 43 || /* + */ ch === 45 /* - */ ) {
            if (CHOMPING_CLIP === chomping) {
                chomping = ch === 43 /* + */  ? CHOMPING_KEEP : CHOMPING_STRIP;
            } else {
                return throwError(state, "repeat of a chomping mode identifier");
            }
        } else if ((tmp = fromDecimalCode(ch)) >= 0) {
            if (tmp === 0) {
                return throwError(state, "bad explicit indentation width of a block scalar; it cannot be less than one");
            } else if (!detectedIndent) {
                textIndent = nodeIndent + tmp - 1;
                detectedIndent = true;
            } else {
                return throwError(state, "repeat of an indentation width identifier");
            }
        } else {
            break;
        }
    }
    if (isWhiteSpace(ch)) {
        do {
            ch = state.input.charCodeAt(++state.position);
        }while (isWhiteSpace(ch))
        if (ch === 35 /* # */ ) {
            do {
                ch = state.input.charCodeAt(++state.position);
            }while (!isEOL(ch) && ch !== 0)
        }
    }
    while(ch !== 0){
        readLineBreak(state);
        state.lineIndent = 0;
        ch = state.input.charCodeAt(state.position);
        while((!detectedIndent || state.lineIndent < textIndent) && ch === 32 /* Space */ ){
            state.lineIndent++;
            ch = state.input.charCodeAt(++state.position);
        }
        if (!detectedIndent && state.lineIndent > textIndent) {
            textIndent = state.lineIndent;
        }
        if (isEOL(ch)) {
            emptyLines++;
            continue;
        }
        // End of the scalar.
        if (state.lineIndent < textIndent) {
            // Perform the chomping.
            if (chomping === CHOMPING_KEEP) {
                state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
            } else if (chomping === CHOMPING_CLIP) {
                if (didReadContent) {
                    // i.e. only if the scalar is not empty.
                    state.result += "\n";
                }
            }
            break;
        }
        // Folded style: use fancy rules to handle line breaks.
        if (folding) {
            // Lines starting with white space characters (more-indented lines) are not folded.
            if (isWhiteSpace(ch)) {
                atMoreIndented = true;
                // except for the first content line (cf. Example 8.1)
                state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
            // End of more-indented block.
            } else if (atMoreIndented) {
                atMoreIndented = false;
                state.result += common.repeat("\n", emptyLines + 1);
            // Just one line break - perceive as the same line.
            } else if (emptyLines === 0) {
                if (didReadContent) {
                    // i.e. only if we have already read some scalar content.
                    state.result += " ";
                }
            // Several line breaks - perceive as different lines.
            } else {
                state.result += common.repeat("\n", emptyLines);
            }
        // Literal style: just add exact number of line breaks between content lines.
        } else {
            // Keep all line breaks except the header line break.
            state.result += common.repeat("\n", didReadContent ? 1 + emptyLines : emptyLines);
        }
        didReadContent = true;
        detectedIndent = true;
        emptyLines = 0;
        const captureStart = state.position;
        while(!isEOL(ch) && ch !== 0){
            ch = state.input.charCodeAt(++state.position);
        }
        captureSegment(state, captureStart, state.position, false);
    }
    return true;
}
function readBlockSequence(state, nodeIndent) {
    let line, following, detected = false, ch;
    const tag = state.tag, anchor = state.anchor, result = [];
    if (state.anchor !== null && typeof state.anchor !== "undefined" && typeof state.anchorMap !== "undefined") {
        state.anchorMap[state.anchor] = result;
    }
    ch = state.input.charCodeAt(state.position);
    while(ch !== 0){
        if (ch !== 45 /* - */ ) {
            break;
        }
        following = state.input.charCodeAt(state.position + 1);
        if (!isWsOrEol(following)) {
            break;
        }
        detected = true;
        state.position++;
        if (skipSeparationSpace(state, true, -1)) {
            if (state.lineIndent <= nodeIndent) {
                result.push(null);
                ch = state.input.charCodeAt(state.position);
                continue;
            }
        }
        line = state.line;
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        composeNode(state, nodeIndent, CONTEXT_BLOCK_IN, false, true);
        result.push(state.result);
        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);
        if ((state.line === line || state.lineIndent > nodeIndent) && ch !== 0) {
            return throwError(state, "bad indentation of a sequence entry");
        } else if (state.lineIndent < nodeIndent) {
            break;
        }
    }
    if (detected) {
        state.tag = tag;
        state.anchor = anchor;
        state.kind = "sequence";
        state.result = result;
        return true;
    }
    return false;
}
function readBlockMapping(state, nodeIndent, flowIndent) {
    const tag = state.tag, anchor = state.anchor, result = {
    }, overridableKeys = {
    };
    let following, allowCompact = false, line, pos, keyTag = null, keyNode = null, valueNode = null, atExplicitKey = false, detected = false, ch;
    if (state.anchor !== null && typeof state.anchor !== "undefined" && typeof state.anchorMap !== "undefined") {
        state.anchorMap[state.anchor] = result;
    }
    ch = state.input.charCodeAt(state.position);
    while(ch !== 0){
        following = state.input.charCodeAt(state.position + 1);
        line = state.line; // Save the current line.
        pos = state.position;
        //
        // Explicit notation case. There are two separate blocks:
        // first for the key (denoted by "?") and second for the value (denoted by ":")
        //
        if ((ch === 63 || /* ? */ ch === 58) && /* : */ isWsOrEol(following)) {
            if (ch === 63 /* ? */ ) {
                if (atExplicitKey) {
                    storeMappingPair(state, result, overridableKeys, keyTag, keyNode, null);
                    keyTag = keyNode = valueNode = null;
                }
                detected = true;
                atExplicitKey = true;
                allowCompact = true;
            } else if (atExplicitKey) {
                // i.e. 0x3A/* : */ === character after the explicit key.
                atExplicitKey = false;
                allowCompact = true;
            } else {
                return throwError(state, "incomplete explicit mapping pair; a key node is missed; or followed by a non-tabulated empty line");
            }
            state.position += 1;
            ch = following;
        //
        // Implicit notation case. Flow-style node as the key first, then ":", and the value.
        //
        // eslint-disable-next-line @typescript-eslint/no-use-before-define
        } else if (composeNode(state, flowIndent, CONTEXT_FLOW_OUT, false, true)) {
            if (state.line === line) {
                ch = state.input.charCodeAt(state.position);
                while(isWhiteSpace(ch)){
                    ch = state.input.charCodeAt(++state.position);
                }
                if (ch === 58 /* : */ ) {
                    ch = state.input.charCodeAt(++state.position);
                    if (!isWsOrEol(ch)) {
                        return throwError(state, "a whitespace character is expected after the key-value separator within a block mapping");
                    }
                    if (atExplicitKey) {
                        storeMappingPair(state, result, overridableKeys, keyTag, keyNode, null);
                        keyTag = keyNode = valueNode = null;
                    }
                    detected = true;
                    atExplicitKey = false;
                    allowCompact = false;
                    keyTag = state.tag;
                    keyNode = state.result;
                } else if (detected) {
                    return throwError(state, "can not read an implicit mapping pair; a colon is missed");
                } else {
                    state.tag = tag;
                    state.anchor = anchor;
                    return true; // Keep the result of `composeNode`.
                }
            } else if (detected) {
                return throwError(state, "can not read a block mapping entry; a multiline key may not be an implicit key");
            } else {
                state.tag = tag;
                state.anchor = anchor;
                return true; // Keep the result of `composeNode`.
            }
        } else {
            break; // Reading is done. Go to the epilogue.
        }
        //
        // Common reading code for both explicit and implicit notations.
        //
        if (state.line === line || state.lineIndent > nodeIndent) {
            if (// eslint-disable-next-line @typescript-eslint/no-use-before-define
            composeNode(state, nodeIndent, CONTEXT_BLOCK_OUT, true, allowCompact)) {
                if (atExplicitKey) {
                    keyNode = state.result;
                } else {
                    valueNode = state.result;
                }
            }
            if (!atExplicitKey) {
                storeMappingPair(state, result, overridableKeys, keyTag, keyNode, valueNode, line, pos);
                keyTag = keyNode = valueNode = null;
            }
            skipSeparationSpace(state, true, -1);
            ch = state.input.charCodeAt(state.position);
        }
        if (state.lineIndent > nodeIndent && ch !== 0) {
            return throwError(state, "bad indentation of a mapping entry");
        } else if (state.lineIndent < nodeIndent) {
            break;
        }
    }
    //
    // Epilogue.
    //
    // Special case: last mapping's node contains only the key in explicit notation.
    if (atExplicitKey) {
        storeMappingPair(state, result, overridableKeys, keyTag, keyNode, null);
    }
    // Expose the resulting mapping.
    if (detected) {
        state.tag = tag;
        state.anchor = anchor;
        state.kind = "mapping";
        state.result = result;
    }
    return detected;
}
function readTagProperty(state) {
    let position, isVerbatim = false, isNamed = false, tagHandle = "", tagName, ch;
    ch = state.input.charCodeAt(state.position);
    if (ch !== 33 /* ! */ ) return false;
    if (state.tag !== null) {
        return throwError(state, "duplication of a tag property");
    }
    ch = state.input.charCodeAt(++state.position);
    if (ch === 60 /* < */ ) {
        isVerbatim = true;
        ch = state.input.charCodeAt(++state.position);
    } else if (ch === 33 /* ! */ ) {
        isNamed = true;
        tagHandle = "!!";
        ch = state.input.charCodeAt(++state.position);
    } else {
        tagHandle = "!";
    }
    position = state.position;
    if (isVerbatim) {
        do {
            ch = state.input.charCodeAt(++state.position);
        }while (ch !== 0 && ch !== 62 /* > */ )
        if (state.position < state.length) {
            tagName = state.input.slice(position, state.position);
            ch = state.input.charCodeAt(++state.position);
        } else {
            return throwError(state, "unexpected end of the stream within a verbatim tag");
        }
    } else {
        while(ch !== 0 && !isWsOrEol(ch)){
            if (ch === 33 /* ! */ ) {
                if (!isNamed) {
                    tagHandle = state.input.slice(position - 1, state.position + 1);
                    if (!PATTERN_TAG_HANDLE.test(tagHandle)) {
                        return throwError(state, "named tag handle cannot contain such characters");
                    }
                    isNamed = true;
                    position = state.position + 1;
                } else {
                    return throwError(state, "tag suffix cannot contain exclamation marks");
                }
            }
            ch = state.input.charCodeAt(++state.position);
        }
        tagName = state.input.slice(position, state.position);
        if (PATTERN_FLOW_INDICATORS.test(tagName)) {
            return throwError(state, "tag suffix cannot contain flow indicator characters");
        }
    }
    if (tagName && !PATTERN_TAG_URI.test(tagName)) {
        return throwError(state, `tag name cannot contain such characters: ${tagName}`);
    }
    if (isVerbatim) {
        state.tag = tagName;
    } else if (typeof state.tagMap !== "undefined" && _hasOwnProperty.call(state.tagMap, tagHandle)) {
        state.tag = state.tagMap[tagHandle] + tagName;
    } else if (tagHandle === "!") {
        state.tag = `!${tagName}`;
    } else if (tagHandle === "!!") {
        state.tag = `tag:yaml.org,2002:${tagName}`;
    } else {
        return throwError(state, `undeclared tag handle "${tagHandle}"`);
    }
    return true;
}
function readAnchorProperty(state) {
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 38 /* & */ ) return false;
    if (state.anchor !== null) {
        return throwError(state, "duplication of an anchor property");
    }
    ch = state.input.charCodeAt(++state.position);
    const position = state.position;
    while(ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch)){
        ch = state.input.charCodeAt(++state.position);
    }
    if (state.position === position) {
        return throwError(state, "name of an anchor node must contain at least one character");
    }
    state.anchor = state.input.slice(position, state.position);
    return true;
}
function readAlias(state) {
    let ch = state.input.charCodeAt(state.position);
    if (ch !== 42 /* * */ ) return false;
    ch = state.input.charCodeAt(++state.position);
    const _position = state.position;
    while(ch !== 0 && !isWsOrEol(ch) && !isFlowIndicator(ch)){
        ch = state.input.charCodeAt(++state.position);
    }
    if (state.position === _position) {
        return throwError(state, "name of an alias node must contain at least one character");
    }
    const alias = state.input.slice(_position, state.position);
    if (typeof state.anchorMap !== "undefined" && !Object.prototype.hasOwnProperty.call(state.anchorMap, alias)) {
        return throwError(state, `unidentified alias "${alias}"`);
    }
    if (typeof state.anchorMap !== "undefined") {
        state.result = state.anchorMap[alias];
    }
    skipSeparationSpace(state, true, -1);
    return true;
}
function composeNode(state, parentIndent, nodeContext, allowToSeek, allowCompact) {
    let allowBlockScalars, allowBlockCollections, indentStatus = 1, atNewLine = false, hasContent = false, type, flowIndent, blockIndent;
    if (state.listener && state.listener !== null) {
        state.listener("open", state);
    }
    state.tag = null;
    state.anchor = null;
    state.kind = null;
    state.result = null;
    const allowBlockStyles = allowBlockScalars = allowBlockCollections = CONTEXT_BLOCK_OUT === nodeContext || CONTEXT_BLOCK_IN === nodeContext;
    if (allowToSeek) {
        if (skipSeparationSpace(state, true, -1)) {
            atNewLine = true;
            if (state.lineIndent > parentIndent) {
                indentStatus = 1;
            } else if (state.lineIndent === parentIndent) {
                indentStatus = 0;
            } else if (state.lineIndent < parentIndent) {
                indentStatus = -1;
            }
        }
    }
    if (indentStatus === 1) {
        while(readTagProperty(state) || readAnchorProperty(state)){
            if (skipSeparationSpace(state, true, -1)) {
                atNewLine = true;
                allowBlockCollections = allowBlockStyles;
                if (state.lineIndent > parentIndent) {
                    indentStatus = 1;
                } else if (state.lineIndent === parentIndent) {
                    indentStatus = 0;
                } else if (state.lineIndent < parentIndent) {
                    indentStatus = -1;
                }
            } else {
                allowBlockCollections = false;
            }
        }
    }
    if (allowBlockCollections) {
        allowBlockCollections = atNewLine || allowCompact;
    }
    if (indentStatus === 1 || CONTEXT_BLOCK_OUT === nodeContext) {
        const cond = CONTEXT_FLOW_IN === nodeContext || CONTEXT_FLOW_OUT === nodeContext;
        flowIndent = cond ? parentIndent : parentIndent + 1;
        blockIndent = state.position - state.lineStart;
        if (indentStatus === 1) {
            if (allowBlockCollections && (readBlockSequence(state, blockIndent) || readBlockMapping(state, blockIndent, flowIndent)) || readFlowCollection(state, flowIndent)) {
                hasContent = true;
            } else {
                if (allowBlockScalars && readBlockScalar(state, flowIndent) || readSingleQuotedScalar(state, flowIndent) || readDoubleQuotedScalar(state, flowIndent)) {
                    hasContent = true;
                } else if (readAlias(state)) {
                    hasContent = true;
                    if (state.tag !== null || state.anchor !== null) {
                        return throwError(state, "alias node should not have Any properties");
                    }
                } else if (readPlainScalar(state, flowIndent, CONTEXT_FLOW_IN === nodeContext)) {
                    hasContent = true;
                    if (state.tag === null) {
                        state.tag = "?";
                    }
                }
                if (state.anchor !== null && typeof state.anchorMap !== "undefined") {
                    state.anchorMap[state.anchor] = state.result;
                }
            }
        } else if (indentStatus === 0) {
            // Special case: block sequences are allowed to have same indentation level as the parent.
            // http://www.yaml.org/spec/1.2/spec.html#id2799784
            hasContent = allowBlockCollections && readBlockSequence(state, blockIndent);
        }
    }
    if (state.tag !== null && state.tag !== "!") {
        if (state.tag === "?") {
            for(let typeIndex = 0, typeQuantity = state.implicitTypes.length; typeIndex < typeQuantity; typeIndex++){
                type = state.implicitTypes[typeIndex];
                // Implicit resolving is not allowed for non-scalar types, and '?'
                // non-specific tag is only assigned to plain scalars. So, it isn't
                // needed to check for 'kind' conformity.
                if (type.resolve(state.result)) {
                    // `state.result` updated in resolver if matched
                    state.result = type.construct(state.result);
                    state.tag = type.tag;
                    if (state.anchor !== null && typeof state.anchorMap !== "undefined") {
                        state.anchorMap[state.anchor] = state.result;
                    }
                    break;
                }
            }
        } else if (_hasOwnProperty.call(state.typeMap[state.kind || "fallback"], state.tag)) {
            type = state.typeMap[state.kind || "fallback"][state.tag];
            if (state.result !== null && type.kind !== state.kind) {
                return throwError(state, `unacceptable node kind for !<${state.tag}> tag; it should be "${type.kind}", not "${state.kind}"`);
            }
            if (!type.resolve(state.result)) {
                // `state.result` updated in resolver if matched
                return throwError(state, `cannot resolve a node with !<${state.tag}> explicit tag`);
            } else {
                state.result = type.construct(state.result);
                if (state.anchor !== null && typeof state.anchorMap !== "undefined") {
                    state.anchorMap[state.anchor] = state.result;
                }
            }
        } else {
            return throwError(state, `unknown tag !<${state.tag}>`);
        }
    }
    if (state.listener && state.listener !== null) {
        state.listener("close", state);
    }
    return state.tag !== null || state.anchor !== null || hasContent;
}
function readDocument(state) {
    const documentStart = state.position;
    let position, directiveName, directiveArgs, hasDirectives = false, ch;
    state.version = null;
    state.checkLineBreaks = state.legacy;
    state.tagMap = {
    };
    state.anchorMap = {
    };
    while((ch = state.input.charCodeAt(state.position)) !== 0){
        skipSeparationSpace(state, true, -1);
        ch = state.input.charCodeAt(state.position);
        if (state.lineIndent > 0 || ch !== 37 /* % */ ) {
            break;
        }
        hasDirectives = true;
        ch = state.input.charCodeAt(++state.position);
        position = state.position;
        while(ch !== 0 && !isWsOrEol(ch)){
            ch = state.input.charCodeAt(++state.position);
        }
        directiveName = state.input.slice(position, state.position);
        directiveArgs = [];
        if (directiveName.length < 1) {
            return throwError(state, "directive name must not be less than one character in length");
        }
        while(ch !== 0){
            while(isWhiteSpace(ch)){
                ch = state.input.charCodeAt(++state.position);
            }
            if (ch === 35 /* # */ ) {
                do {
                    ch = state.input.charCodeAt(++state.position);
                }while (ch !== 0 && !isEOL(ch))
                break;
            }
            if (isEOL(ch)) break;
            position = state.position;
            while(ch !== 0 && !isWsOrEol(ch)){
                ch = state.input.charCodeAt(++state.position);
            }
            directiveArgs.push(state.input.slice(position, state.position));
        }
        if (ch !== 0) readLineBreak(state);
        if (_hasOwnProperty.call(directiveHandlers, directiveName)) {
            directiveHandlers[directiveName](state, directiveName, ...directiveArgs);
        } else {
            throwWarning(state, `unknown document directive "${directiveName}"`);
        }
    }
    skipSeparationSpace(state, true, -1);
    if (state.lineIndent === 0 && state.input.charCodeAt(state.position) === 45 /* - */  && state.input.charCodeAt(state.position + 1) === 45 /* - */  && state.input.charCodeAt(state.position + 2) === 45 /* - */ ) {
        state.position += 3;
        skipSeparationSpace(state, true, -1);
    } else if (hasDirectives) {
        return throwError(state, "directives end mark is expected");
    }
    composeNode(state, state.lineIndent - 1, CONTEXT_BLOCK_OUT, false, true);
    skipSeparationSpace(state, true, -1);
    if (state.checkLineBreaks && PATTERN_NON_ASCII_LINE_BREAKS.test(state.input.slice(documentStart, state.position))) {
        throwWarning(state, "non-ASCII line breaks are interpreted as content");
    }
    state.documents.push(state.result);
    if (state.position === state.lineStart && testDocumentSeparator(state)) {
        if (state.input.charCodeAt(state.position) === 46 /* . */ ) {
            state.position += 3;
            skipSeparationSpace(state, true, -1);
        }
        return;
    }
    if (state.position < state.length - 1) {
        return throwError(state, "end of the stream or a document separator is expected");
    } else {
        return;
    }
}
function loadDocuments(input, options) {
    input = String(input);
    options = options || {
    };
    if (input.length !== 0) {
        // Add tailing `\n` if not exists
        if (input.charCodeAt(input.length - 1) !== 10 /* LF */  && input.charCodeAt(input.length - 1) !== 13 /* CR */ ) {
            input += "\n";
        }
        // Strip BOM
        if (input.charCodeAt(0) === 65279) {
            input = input.slice(1);
        }
    }
    const state = new LoaderState(input, options);
    // Use 0 as string terminator. That significantly simplifies bounds check.
    state.input += "\0";
    while(state.input.charCodeAt(state.position) === 32 /* Space */ ){
        state.lineIndent += 1;
        state.position += 1;
    }
    while(state.position < state.length - 1){
        readDocument(state);
    }
    return state.documents;
}
function isCbFunction(fn) {
    return typeof fn === "function";
}
export function loadAll(input, iteratorOrOption, options) {
    if (!isCbFunction(iteratorOrOption)) {
        return loadDocuments(input, iteratorOrOption);
    }
    const documents = loadDocuments(input, options);
    const iterator = iteratorOrOption;
    for(let index = 0, length = documents.length; index < length; index++){
        iterator(documents[index]);
    }
    return void 0;
}
export function load(input, options) {
    const documents = loadDocuments(input, options);
    if (documents.length === 0) {
        return;
    }
    if (documents.length === 1) {
        return documents[0];
    }
    throw new YAMLError("expected a single document in the stream, but found more");
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjk3LjAvZW5jb2RpbmcvX3lhbWwvbG9hZGVyL2xvYWRlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBQb3J0ZWQgZnJvbSBqcy15YW1sIHYzLjEzLjE6XG4vLyBodHRwczovL2dpdGh1Yi5jb20vbm9kZWNhL2pzLXlhbWwvY29tbWl0LzY2NWFhZGRhNDIzNDlkY2FlODY5ZjEyMDQwZDliMTBlZjE4ZDEyZGFcbi8vIENvcHlyaWdodCAyMDExLTIwMTUgYnkgVml0YWx5IFB1enJpbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG5pbXBvcnQgeyBZQU1MRXJyb3IgfSBmcm9tIFwiLi4vZXJyb3IudHNcIjtcbmltcG9ydCB7IE1hcmsgfSBmcm9tIFwiLi4vbWFyay50c1wiO1xuaW1wb3J0IHR5cGUgeyBUeXBlIH0gZnJvbSBcIi4uL3R5cGUudHNcIjtcbmltcG9ydCAqIGFzIGNvbW1vbiBmcm9tIFwiLi4vdXRpbHMudHNcIjtcbmltcG9ydCB7IExvYWRlclN0YXRlLCBMb2FkZXJTdGF0ZU9wdGlvbnMsIFJlc3VsdFR5cGUgfSBmcm9tIFwiLi9sb2FkZXJfc3RhdGUudHNcIjtcblxudHlwZSBBbnkgPSBjb21tb24uQW55O1xudHlwZSBBcnJheU9iamVjdDxUID0gQW55PiA9IGNvbW1vbi5BcnJheU9iamVjdDxUPjtcblxuY29uc3QgX2hhc093blByb3BlcnR5ID0gT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eTtcblxuY29uc3QgQ09OVEVYVF9GTE9XX0lOID0gMTtcbmNvbnN0IENPTlRFWFRfRkxPV19PVVQgPSAyO1xuY29uc3QgQ09OVEVYVF9CTE9DS19JTiA9IDM7XG5jb25zdCBDT05URVhUX0JMT0NLX09VVCA9IDQ7XG5cbmNvbnN0IENIT01QSU5HX0NMSVAgPSAxO1xuY29uc3QgQ0hPTVBJTkdfU1RSSVAgPSAyO1xuY29uc3QgQ0hPTVBJTkdfS0VFUCA9IDM7XG5cbmNvbnN0IFBBVFRFUk5fTk9OX1BSSU5UQUJMRSA9XG4gIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tY29udHJvbC1yZWdleFxuICAvW1xceDAwLVxceDA4XFx4MEJcXHgwQ1xceDBFLVxceDFGXFx4N0YtXFx4ODRcXHg4Ni1cXHg5RlxcdUZGRkVcXHVGRkZGXXxbXFx1RDgwMC1cXHVEQkZGXSg/IVtcXHVEQzAwLVxcdURGRkZdKXwoPzpbXlxcdUQ4MDAtXFx1REJGRl18XilbXFx1REMwMC1cXHVERkZGXS87XG5jb25zdCBQQVRURVJOX05PTl9BU0NJSV9MSU5FX0JSRUFLUyA9IC9bXFx4ODVcXHUyMDI4XFx1MjAyOV0vO1xuY29uc3QgUEFUVEVSTl9GTE9XX0lORElDQVRPUlMgPSAvWyxcXFtcXF1cXHtcXH1dLztcbmNvbnN0IFBBVFRFUk5fVEFHX0hBTkRMRSA9IC9eKD86IXwhIXwhW2EtelxcLV0rISkkL2k7XG5jb25zdCBQQVRURVJOX1RBR19VUkkgPVxuICAvXig/OiF8W14sXFxbXFxdXFx7XFx9XSkoPzolWzAtOWEtZl17Mn18WzAtOWEtelxcLSM7XFwvXFw/OkAmPVxcK1xcJCxfXFwuIX5cXConXFwoXFwpXFxbXFxdXSkqJC9pO1xuXG5mdW5jdGlvbiBfY2xhc3Mob2JqOiB1bmtub3duKTogc3RyaW5nIHtcbiAgcmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmopO1xufVxuXG5mdW5jdGlvbiBpc0VPTChjOiBudW1iZXIpOiBib29sZWFuIHtcbiAgcmV0dXJuIGMgPT09IDB4MGEgfHwgLyogTEYgKi8gYyA9PT0gMHgwZCAvKiBDUiAqLztcbn1cblxuZnVuY3Rpb24gaXNXaGl0ZVNwYWNlKGM6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gYyA9PT0gMHgwOSB8fCAvKiBUYWIgKi8gYyA9PT0gMHgyMCAvKiBTcGFjZSAqLztcbn1cblxuZnVuY3Rpb24gaXNXc09yRW9sKGM6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgIGMgPT09IDB4MDkgLyogVGFiICovIHx8XG4gICAgYyA9PT0gMHgyMCAvKiBTcGFjZSAqLyB8fFxuICAgIGMgPT09IDB4MGEgLyogTEYgKi8gfHxcbiAgICBjID09PSAweDBkIC8qIENSICovXG4gICk7XG59XG5cbmZ1bmN0aW9uIGlzRmxvd0luZGljYXRvcihjOiBudW1iZXIpOiBib29sZWFuIHtcbiAgcmV0dXJuIChcbiAgICBjID09PSAweDJjIC8qICwgKi8gfHxcbiAgICBjID09PSAweDViIC8qIFsgKi8gfHxcbiAgICBjID09PSAweDVkIC8qIF0gKi8gfHxcbiAgICBjID09PSAweDdiIC8qIHsgKi8gfHxcbiAgICBjID09PSAweDdkIC8qIH0gKi9cbiAgKTtcbn1cblxuZnVuY3Rpb24gZnJvbUhleENvZGUoYzogbnVtYmVyKTogbnVtYmVyIHtcbiAgaWYgKDB4MzAgPD0gLyogMCAqLyBjICYmIGMgPD0gMHgzOSAvKiA5ICovKSB7XG4gICAgcmV0dXJuIGMgLSAweDMwO1xuICB9XG5cbiAgY29uc3QgbGMgPSBjIHwgMHgyMDtcblxuICBpZiAoMHg2MSA8PSAvKiBhICovIGxjICYmIGxjIDw9IDB4NjYgLyogZiAqLykge1xuICAgIHJldHVybiBsYyAtIDB4NjEgKyAxMDtcbiAgfVxuXG4gIHJldHVybiAtMTtcbn1cblxuZnVuY3Rpb24gZXNjYXBlZEhleExlbihjOiBudW1iZXIpOiBudW1iZXIge1xuICBpZiAoYyA9PT0gMHg3OCAvKiB4ICovKSB7XG4gICAgcmV0dXJuIDI7XG4gIH1cbiAgaWYgKGMgPT09IDB4NzUgLyogdSAqLykge1xuICAgIHJldHVybiA0O1xuICB9XG4gIGlmIChjID09PSAweDU1IC8qIFUgKi8pIHtcbiAgICByZXR1cm4gODtcbiAgfVxuICByZXR1cm4gMDtcbn1cblxuZnVuY3Rpb24gZnJvbURlY2ltYWxDb2RlKGM6IG51bWJlcik6IG51bWJlciB7XG4gIGlmICgweDMwIDw9IC8qIDAgKi8gYyAmJiBjIDw9IDB4MzkgLyogOSAqLykge1xuICAgIHJldHVybiBjIC0gMHgzMDtcbiAgfVxuXG4gIHJldHVybiAtMTtcbn1cblxuZnVuY3Rpb24gc2ltcGxlRXNjYXBlU2VxdWVuY2UoYzogbnVtYmVyKTogc3RyaW5nIHtcbiAgLyogZXNsaW50OmRpc2FibGU6cHJldHRpZXIgKi9cbiAgcmV0dXJuIGMgPT09IDB4MzAgLyogMCAqL1xuICAgID8gXCJcXHgwMFwiXG4gICAgOiBjID09PSAweDYxIC8qIGEgKi9cbiAgICA/IFwiXFx4MDdcIlxuICAgIDogYyA9PT0gMHg2MiAvKiBiICovXG4gICAgPyBcIlxceDA4XCJcbiAgICA6IGMgPT09IDB4NzQgLyogdCAqL1xuICAgID8gXCJcXHgwOVwiXG4gICAgOiBjID09PSAweDA5IC8qIFRhYiAqL1xuICAgID8gXCJcXHgwOVwiXG4gICAgOiBjID09PSAweDZlIC8qIG4gKi9cbiAgICA/IFwiXFx4MEFcIlxuICAgIDogYyA9PT0gMHg3NiAvKiB2ICovXG4gICAgPyBcIlxceDBCXCJcbiAgICA6IGMgPT09IDB4NjYgLyogZiAqL1xuICAgID8gXCJcXHgwQ1wiXG4gICAgOiBjID09PSAweDcyIC8qIHIgKi9cbiAgICA/IFwiXFx4MERcIlxuICAgIDogYyA9PT0gMHg2NSAvKiBlICovXG4gICAgPyBcIlxceDFCXCJcbiAgICA6IGMgPT09IDB4MjAgLyogU3BhY2UgKi9cbiAgICA/IFwiIFwiXG4gICAgOiBjID09PSAweDIyIC8qIFwiICovXG4gICAgPyBcIlxceDIyXCJcbiAgICA6IGMgPT09IDB4MmYgLyogLyAqL1xuICAgID8gXCIvXCJcbiAgICA6IGMgPT09IDB4NWMgLyogXFwgKi9cbiAgICA/IFwiXFx4NUNcIlxuICAgIDogYyA9PT0gMHg0ZSAvKiBOICovXG4gICAgPyBcIlxceDg1XCJcbiAgICA6IGMgPT09IDB4NWYgLyogXyAqL1xuICAgID8gXCJcXHhBMFwiXG4gICAgOiBjID09PSAweDRjIC8qIEwgKi9cbiAgICA/IFwiXFx1MjAyOFwiXG4gICAgOiBjID09PSAweDUwIC8qIFAgKi9cbiAgICA/IFwiXFx1MjAyOVwiXG4gICAgOiBcIlwiO1xuICAvKiBlc2xpbnQ6ZW5hYmxlOnByZXR0aWVyICovXG59XG5cbmZ1bmN0aW9uIGNoYXJGcm9tQ29kZXBvaW50KGM6IG51bWJlcik6IHN0cmluZyB7XG4gIGlmIChjIDw9IDB4ZmZmZikge1xuICAgIHJldHVybiBTdHJpbmcuZnJvbUNoYXJDb2RlKGMpO1xuICB9XG4gIC8vIEVuY29kZSBVVEYtMTYgc3Vycm9nYXRlIHBhaXJcbiAgLy8gaHR0cHM6Ly9lbi53aWtpcGVkaWEub3JnL3dpa2kvVVRGLTE2I0NvZGVfcG9pbnRzX1UuMkIwMTAwMDBfdG9fVS4yQjEwRkZGRlxuICByZXR1cm4gU3RyaW5nLmZyb21DaGFyQ29kZShcbiAgICAoKGMgLSAweDAxMDAwMCkgPj4gMTApICsgMHhkODAwLFxuICAgICgoYyAtIDB4MDEwMDAwKSAmIDB4MDNmZikgKyAweGRjMDAsXG4gICk7XG59XG5cbmNvbnN0IHNpbXBsZUVzY2FwZUNoZWNrID0gbmV3IEFycmF5KDI1Nik7IC8vIGludGVnZXIsIGZvciBmYXN0IGFjY2Vzc1xuY29uc3Qgc2ltcGxlRXNjYXBlTWFwID0gbmV3IEFycmF5KDI1Nik7XG5mb3IgKGxldCBpID0gMDsgaSA8IDI1NjsgaSsrKSB7XG4gIHNpbXBsZUVzY2FwZUNoZWNrW2ldID0gc2ltcGxlRXNjYXBlU2VxdWVuY2UoaSkgPyAxIDogMDtcbiAgc2ltcGxlRXNjYXBlTWFwW2ldID0gc2ltcGxlRXNjYXBlU2VxdWVuY2UoaSk7XG59XG5cbmZ1bmN0aW9uIGdlbmVyYXRlRXJyb3Ioc3RhdGU6IExvYWRlclN0YXRlLCBtZXNzYWdlOiBzdHJpbmcpOiBZQU1MRXJyb3Ige1xuICByZXR1cm4gbmV3IFlBTUxFcnJvcihcbiAgICBtZXNzYWdlLFxuICAgIG5ldyBNYXJrKFxuICAgICAgc3RhdGUuZmlsZW5hbWUgYXMgc3RyaW5nLFxuICAgICAgc3RhdGUuaW5wdXQsXG4gICAgICBzdGF0ZS5wb3NpdGlvbixcbiAgICAgIHN0YXRlLmxpbmUsXG4gICAgICBzdGF0ZS5wb3NpdGlvbiAtIHN0YXRlLmxpbmVTdGFydCxcbiAgICApLFxuICApO1xufVxuXG5mdW5jdGlvbiB0aHJvd0Vycm9yKHN0YXRlOiBMb2FkZXJTdGF0ZSwgbWVzc2FnZTogc3RyaW5nKTogbmV2ZXIge1xuICB0aHJvdyBnZW5lcmF0ZUVycm9yKHN0YXRlLCBtZXNzYWdlKTtcbn1cblxuZnVuY3Rpb24gdGhyb3dXYXJuaW5nKHN0YXRlOiBMb2FkZXJTdGF0ZSwgbWVzc2FnZTogc3RyaW5nKTogdm9pZCB7XG4gIGlmIChzdGF0ZS5vbldhcm5pbmcpIHtcbiAgICBzdGF0ZS5vbldhcm5pbmcuY2FsbChudWxsLCBnZW5lcmF0ZUVycm9yKHN0YXRlLCBtZXNzYWdlKSk7XG4gIH1cbn1cblxuaW50ZXJmYWNlIERpcmVjdGl2ZUhhbmRsZXJzIHtcbiAgW2RpcmVjdGl2ZTogc3RyaW5nXTogKFxuICAgIHN0YXRlOiBMb2FkZXJTdGF0ZSxcbiAgICBuYW1lOiBzdHJpbmcsXG4gICAgLi4uYXJnczogc3RyaW5nW11cbiAgKSA9PiB2b2lkO1xufVxuXG5jb25zdCBkaXJlY3RpdmVIYW5kbGVyczogRGlyZWN0aXZlSGFuZGxlcnMgPSB7XG4gIFlBTUwoc3RhdGUsIF9uYW1lLCAuLi5hcmdzOiBzdHJpbmdbXSkge1xuICAgIGlmIChzdGF0ZS52ZXJzaW9uICE9PSBudWxsKSB7XG4gICAgICByZXR1cm4gdGhyb3dFcnJvcihzdGF0ZSwgXCJkdXBsaWNhdGlvbiBvZiAlWUFNTCBkaXJlY3RpdmVcIik7XG4gICAgfVxuXG4gICAgaWYgKGFyZ3MubGVuZ3RoICE9PSAxKSB7XG4gICAgICByZXR1cm4gdGhyb3dFcnJvcihzdGF0ZSwgXCJZQU1MIGRpcmVjdGl2ZSBhY2NlcHRzIGV4YWN0bHkgb25lIGFyZ3VtZW50XCIpO1xuICAgIH1cblxuICAgIGNvbnN0IG1hdGNoID0gL14oWzAtOV0rKVxcLihbMC05XSspJC8uZXhlYyhhcmdzWzBdKTtcbiAgICBpZiAobWF0Y2ggPT09IG51bGwpIHtcbiAgICAgIHJldHVybiB0aHJvd0Vycm9yKHN0YXRlLCBcImlsbC1mb3JtZWQgYXJndW1lbnQgb2YgdGhlIFlBTUwgZGlyZWN0aXZlXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IG1ham9yID0gcGFyc2VJbnQobWF0Y2hbMV0sIDEwKTtcbiAgICBjb25zdCBtaW5vciA9IHBhcnNlSW50KG1hdGNoWzJdLCAxMCk7XG4gICAgaWYgKG1ham9yICE9PSAxKSB7XG4gICAgICByZXR1cm4gdGhyb3dFcnJvcihzdGF0ZSwgXCJ1bmFjY2VwdGFibGUgWUFNTCB2ZXJzaW9uIG9mIHRoZSBkb2N1bWVudFwiKTtcbiAgICB9XG5cbiAgICBzdGF0ZS52ZXJzaW9uID0gYXJnc1swXTtcbiAgICBzdGF0ZS5jaGVja0xpbmVCcmVha3MgPSBtaW5vciA8IDI7XG4gICAgaWYgKG1pbm9yICE9PSAxICYmIG1pbm9yICE9PSAyKSB7XG4gICAgICByZXR1cm4gdGhyb3dXYXJuaW5nKHN0YXRlLCBcInVuc3VwcG9ydGVkIFlBTUwgdmVyc2lvbiBvZiB0aGUgZG9jdW1lbnRcIik7XG4gICAgfVxuICB9LFxuXG4gIFRBRyhzdGF0ZSwgX25hbWUsIC4uLmFyZ3M6IHN0cmluZ1tdKTogdm9pZCB7XG4gICAgaWYgKGFyZ3MubGVuZ3RoICE9PSAyKSB7XG4gICAgICByZXR1cm4gdGhyb3dFcnJvcihzdGF0ZSwgXCJUQUcgZGlyZWN0aXZlIGFjY2VwdHMgZXhhY3RseSB0d28gYXJndW1lbnRzXCIpO1xuICAgIH1cblxuICAgIGNvbnN0IGhhbmRsZSA9IGFyZ3NbMF07XG4gICAgY29uc3QgcHJlZml4ID0gYXJnc1sxXTtcblxuICAgIGlmICghUEFUVEVSTl9UQUdfSEFORExFLnRlc3QoaGFuZGxlKSkge1xuICAgICAgcmV0dXJuIHRocm93RXJyb3IoXG4gICAgICAgIHN0YXRlLFxuICAgICAgICBcImlsbC1mb3JtZWQgdGFnIGhhbmRsZSAoZmlyc3QgYXJndW1lbnQpIG9mIHRoZSBUQUcgZGlyZWN0aXZlXCIsXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmIChfaGFzT3duUHJvcGVydHkuY2FsbChzdGF0ZS50YWdNYXAsIGhhbmRsZSkpIHtcbiAgICAgIHJldHVybiB0aHJvd0Vycm9yKFxuICAgICAgICBzdGF0ZSxcbiAgICAgICAgYHRoZXJlIGlzIGEgcHJldmlvdXNseSBkZWNsYXJlZCBzdWZmaXggZm9yIFwiJHtoYW5kbGV9XCIgdGFnIGhhbmRsZWAsXG4gICAgICApO1xuICAgIH1cblxuICAgIGlmICghUEFUVEVSTl9UQUdfVVJJLnRlc3QocHJlZml4KSkge1xuICAgICAgcmV0dXJuIHRocm93RXJyb3IoXG4gICAgICAgIHN0YXRlLFxuICAgICAgICBcImlsbC1mb3JtZWQgdGFnIHByZWZpeCAoc2Vjb25kIGFyZ3VtZW50KSBvZiB0aGUgVEFHIGRpcmVjdGl2ZVwiLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBpZiAodHlwZW9mIHN0YXRlLnRhZ01hcCA9PT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgc3RhdGUudGFnTWFwID0ge307XG4gICAgfVxuICAgIHN0YXRlLnRhZ01hcFtoYW5kbGVdID0gcHJlZml4O1xuICB9LFxufTtcblxuZnVuY3Rpb24gY2FwdHVyZVNlZ21lbnQoXG4gIHN0YXRlOiBMb2FkZXJTdGF0ZSxcbiAgc3RhcnQ6IG51bWJlcixcbiAgZW5kOiBudW1iZXIsXG4gIGNoZWNrSnNvbjogYm9vbGVhbixcbik6IHZvaWQge1xuICBsZXQgcmVzdWx0OiBzdHJpbmc7XG4gIGlmIChzdGFydCA8IGVuZCkge1xuICAgIHJlc3VsdCA9IHN0YXRlLmlucHV0LnNsaWNlKHN0YXJ0LCBlbmQpO1xuXG4gICAgaWYgKGNoZWNrSnNvbikge1xuICAgICAgZm9yIChcbiAgICAgICAgbGV0IHBvc2l0aW9uID0gMCwgbGVuZ3RoID0gcmVzdWx0Lmxlbmd0aDtcbiAgICAgICAgcG9zaXRpb24gPCBsZW5ndGg7XG4gICAgICAgIHBvc2l0aW9uKytcbiAgICAgICkge1xuICAgICAgICBjb25zdCBjaGFyYWN0ZXIgPSByZXN1bHQuY2hhckNvZGVBdChwb3NpdGlvbik7XG4gICAgICAgIGlmIChcbiAgICAgICAgICAhKGNoYXJhY3RlciA9PT0gMHgwOSB8fCAoMHgyMCA8PSBjaGFyYWN0ZXIgJiYgY2hhcmFjdGVyIDw9IDB4MTBmZmZmKSlcbiAgICAgICAgKSB7XG4gICAgICAgICAgcmV0dXJuIHRocm93RXJyb3Ioc3RhdGUsIFwiZXhwZWN0ZWQgdmFsaWQgSlNPTiBjaGFyYWN0ZXJcIik7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKFBBVFRFUk5fTk9OX1BSSU5UQUJMRS50ZXN0KHJlc3VsdCkpIHtcbiAgICAgIHJldHVybiB0aHJvd0Vycm9yKHN0YXRlLCBcInRoZSBzdHJlYW0gY29udGFpbnMgbm9uLXByaW50YWJsZSBjaGFyYWN0ZXJzXCIpO1xuICAgIH1cblxuICAgIHN0YXRlLnJlc3VsdCArPSByZXN1bHQ7XG4gIH1cbn1cblxuZnVuY3Rpb24gbWVyZ2VNYXBwaW5ncyhcbiAgc3RhdGU6IExvYWRlclN0YXRlLFxuICBkZXN0aW5hdGlvbjogQXJyYXlPYmplY3QsXG4gIHNvdXJjZTogQXJyYXlPYmplY3QsXG4gIG92ZXJyaWRhYmxlS2V5czogQXJyYXlPYmplY3Q8Ym9vbGVhbj4sXG4pOiB2b2lkIHtcbiAgaWYgKCFjb21tb24uaXNPYmplY3Qoc291cmNlKSkge1xuICAgIHJldHVybiB0aHJvd0Vycm9yKFxuICAgICAgc3RhdGUsXG4gICAgICBcImNhbm5vdCBtZXJnZSBtYXBwaW5nczsgdGhlIHByb3ZpZGVkIHNvdXJjZSBvYmplY3QgaXMgdW5hY2NlcHRhYmxlXCIsXG4gICAgKTtcbiAgfVxuXG4gIGNvbnN0IGtleXMgPSBPYmplY3Qua2V5cyhzb3VyY2UpO1xuICBmb3IgKGxldCBpID0gMCwgbGVuID0ga2V5cy5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xuICAgIGNvbnN0IGtleSA9IGtleXNbaV07XG4gICAgaWYgKCFfaGFzT3duUHJvcGVydHkuY2FsbChkZXN0aW5hdGlvbiwga2V5KSkge1xuICAgICAgZGVzdGluYXRpb25ba2V5XSA9IChzb3VyY2UgYXMgQXJyYXlPYmplY3QpW2tleV07XG4gICAgICBvdmVycmlkYWJsZUtleXNba2V5XSA9IHRydWU7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIHN0b3JlTWFwcGluZ1BhaXIoXG4gIHN0YXRlOiBMb2FkZXJTdGF0ZSxcbiAgcmVzdWx0OiBBcnJheU9iamVjdCB8IG51bGwsXG4gIG92ZXJyaWRhYmxlS2V5czogQXJyYXlPYmplY3Q8Ym9vbGVhbj4sXG4gIGtleVRhZzogc3RyaW5nIHwgbnVsbCxcbiAga2V5Tm9kZTogQW55LFxuICB2YWx1ZU5vZGU6IHVua25vd24sXG4gIHN0YXJ0TGluZT86IG51bWJlcixcbiAgc3RhcnRQb3M/OiBudW1iZXIsXG4pOiBBcnJheU9iamVjdCB7XG4gIC8vIFRoZSBvdXRwdXQgaXMgYSBwbGFpbiBvYmplY3QgaGVyZSwgc28ga2V5cyBjYW4gb25seSBiZSBzdHJpbmdzLlxuICAvLyBXZSBuZWVkIHRvIGNvbnZlcnQga2V5Tm9kZSB0byBhIHN0cmluZywgYnV0IGRvaW5nIHNvIGNhbiBoYW5nIHRoZSBwcm9jZXNzXG4gIC8vIChkZWVwbHkgbmVzdGVkIGFycmF5cyB0aGF0IGV4cGxvZGUgZXhwb25lbnRpYWxseSB1c2luZyBhbGlhc2VzKS5cbiAgaWYgKEFycmF5LmlzQXJyYXkoa2V5Tm9kZSkpIHtcbiAgICBrZXlOb2RlID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoa2V5Tm9kZSk7XG5cbiAgICBmb3IgKGxldCBpbmRleCA9IDAsIHF1YW50aXR5ID0ga2V5Tm9kZS5sZW5ndGg7IGluZGV4IDwgcXVhbnRpdHk7IGluZGV4KyspIHtcbiAgICAgIGlmIChBcnJheS5pc0FycmF5KGtleU5vZGVbaW5kZXhdKSkge1xuICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihzdGF0ZSwgXCJuZXN0ZWQgYXJyYXlzIGFyZSBub3Qgc3VwcG9ydGVkIGluc2lkZSBrZXlzXCIpO1xuICAgICAgfVxuXG4gICAgICBpZiAoXG4gICAgICAgIHR5cGVvZiBrZXlOb2RlID09PSBcIm9iamVjdFwiICYmXG4gICAgICAgIF9jbGFzcyhrZXlOb2RlW2luZGV4XSkgPT09IFwiW29iamVjdCBPYmplY3RdXCJcbiAgICAgICkge1xuICAgICAgICBrZXlOb2RlW2luZGV4XSA9IFwiW29iamVjdCBPYmplY3RdXCI7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgLy8gQXZvaWQgY29kZSBleGVjdXRpb24gaW4gbG9hZCgpIHZpYSB0b1N0cmluZyBwcm9wZXJ0eVxuICAvLyAoc3RpbGwgdXNlIGl0cyBvd24gdG9TdHJpbmcgZm9yIGFycmF5cywgdGltZXN0YW1wcyxcbiAgLy8gYW5kIHdoYXRldmVyIHVzZXIgc2NoZW1hIGV4dGVuc2lvbnMgaGFwcGVuIHRvIGhhdmUgQEB0b1N0cmluZ1RhZylcbiAgaWYgKHR5cGVvZiBrZXlOb2RlID09PSBcIm9iamVjdFwiICYmIF9jbGFzcyhrZXlOb2RlKSA9PT0gXCJbb2JqZWN0IE9iamVjdF1cIikge1xuICAgIGtleU5vZGUgPSBcIltvYmplY3QgT2JqZWN0XVwiO1xuICB9XG5cbiAga2V5Tm9kZSA9IFN0cmluZyhrZXlOb2RlKTtcblxuICBpZiAocmVzdWx0ID09PSBudWxsKSB7XG4gICAgcmVzdWx0ID0ge307XG4gIH1cblxuICBpZiAoa2V5VGFnID09PSBcInRhZzp5YW1sLm9yZywyMDAyOm1lcmdlXCIpIHtcbiAgICBpZiAoQXJyYXkuaXNBcnJheSh2YWx1ZU5vZGUpKSB7XG4gICAgICBmb3IgKFxuICAgICAgICBsZXQgaW5kZXggPSAwLCBxdWFudGl0eSA9IHZhbHVlTm9kZS5sZW5ndGg7XG4gICAgICAgIGluZGV4IDwgcXVhbnRpdHk7XG4gICAgICAgIGluZGV4KytcbiAgICAgICkge1xuICAgICAgICBtZXJnZU1hcHBpbmdzKHN0YXRlLCByZXN1bHQsIHZhbHVlTm9kZVtpbmRleF0sIG92ZXJyaWRhYmxlS2V5cyk7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIG1lcmdlTWFwcGluZ3Moc3RhdGUsIHJlc3VsdCwgdmFsdWVOb2RlIGFzIEFycmF5T2JqZWN0LCBvdmVycmlkYWJsZUtleXMpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICBpZiAoXG4gICAgICAhc3RhdGUuanNvbiAmJlxuICAgICAgIV9oYXNPd25Qcm9wZXJ0eS5jYWxsKG92ZXJyaWRhYmxlS2V5cywga2V5Tm9kZSkgJiZcbiAgICAgIF9oYXNPd25Qcm9wZXJ0eS5jYWxsKHJlc3VsdCwga2V5Tm9kZSlcbiAgICApIHtcbiAgICAgIHN0YXRlLmxpbmUgPSBzdGFydExpbmUgfHwgc3RhdGUubGluZTtcbiAgICAgIHN0YXRlLnBvc2l0aW9uID0gc3RhcnRQb3MgfHwgc3RhdGUucG9zaXRpb247XG4gICAgICByZXR1cm4gdGhyb3dFcnJvcihzdGF0ZSwgXCJkdXBsaWNhdGVkIG1hcHBpbmcga2V5XCIpO1xuICAgIH1cbiAgICByZXN1bHRba2V5Tm9kZV0gPSB2YWx1ZU5vZGU7XG4gICAgZGVsZXRlIG92ZXJyaWRhYmxlS2V5c1trZXlOb2RlXTtcbiAgfVxuXG4gIHJldHVybiByZXN1bHQ7XG59XG5cbmZ1bmN0aW9uIHJlYWRMaW5lQnJlYWsoc3RhdGU6IExvYWRlclN0YXRlKTogdm9pZCB7XG4gIGNvbnN0IGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG5cbiAgaWYgKGNoID09PSAweDBhIC8qIExGICovKSB7XG4gICAgc3RhdGUucG9zaXRpb24rKztcbiAgfSBlbHNlIGlmIChjaCA9PT0gMHgwZCAvKiBDUiAqLykge1xuICAgIHN0YXRlLnBvc2l0aW9uKys7XG4gICAgaWYgKHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pID09PSAweDBhIC8qIExGICovKSB7XG4gICAgICBzdGF0ZS5wb3NpdGlvbisrO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gdGhyb3dFcnJvcihzdGF0ZSwgXCJhIGxpbmUgYnJlYWsgaXMgZXhwZWN0ZWRcIik7XG4gIH1cblxuICBzdGF0ZS5saW5lICs9IDE7XG4gIHN0YXRlLmxpbmVTdGFydCA9IHN0YXRlLnBvc2l0aW9uO1xufVxuXG5mdW5jdGlvbiBza2lwU2VwYXJhdGlvblNwYWNlKFxuICBzdGF0ZTogTG9hZGVyU3RhdGUsXG4gIGFsbG93Q29tbWVudHM6IGJvb2xlYW4sXG4gIGNoZWNrSW5kZW50OiBudW1iZXIsXG4pOiBudW1iZXIge1xuICBsZXQgbGluZUJyZWFrcyA9IDAsXG4gICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKTtcblxuICB3aGlsZSAoY2ggIT09IDApIHtcbiAgICB3aGlsZSAoaXNXaGl0ZVNwYWNlKGNoKSkge1xuICAgICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgIH1cblxuICAgIGlmIChhbGxvd0NvbW1lbnRzICYmIGNoID09PSAweDIzIC8qICMgKi8pIHtcbiAgICAgIGRvIHtcbiAgICAgICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgICAgfSB3aGlsZSAoY2ggIT09IDB4MGEgJiYgLyogTEYgKi8gY2ggIT09IDB4MGQgJiYgLyogQ1IgKi8gY2ggIT09IDApO1xuICAgIH1cblxuICAgIGlmIChpc0VPTChjaCkpIHtcbiAgICAgIHJlYWRMaW5lQnJlYWsoc3RhdGUpO1xuXG4gICAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pO1xuICAgICAgbGluZUJyZWFrcysrO1xuICAgICAgc3RhdGUubGluZUluZGVudCA9IDA7XG5cbiAgICAgIHdoaWxlIChjaCA9PT0gMHgyMCAvKiBTcGFjZSAqLykge1xuICAgICAgICBzdGF0ZS5saW5lSW5kZW50Kys7XG4gICAgICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgICAgIH1cbiAgICB9IGVsc2Uge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgaWYgKFxuICAgIGNoZWNrSW5kZW50ICE9PSAtMSAmJlxuICAgIGxpbmVCcmVha3MgIT09IDAgJiZcbiAgICBzdGF0ZS5saW5lSW5kZW50IDwgY2hlY2tJbmRlbnRcbiAgKSB7XG4gICAgdGhyb3dXYXJuaW5nKHN0YXRlLCBcImRlZmljaWVudCBpbmRlbnRhdGlvblwiKTtcbiAgfVxuXG4gIHJldHVybiBsaW5lQnJlYWtzO1xufVxuXG5mdW5jdGlvbiB0ZXN0RG9jdW1lbnRTZXBhcmF0b3Ioc3RhdGU6IExvYWRlclN0YXRlKTogYm9vbGVhbiB7XG4gIGxldCBfcG9zaXRpb24gPSBzdGF0ZS5wb3NpdGlvbjtcbiAgbGV0IGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChfcG9zaXRpb24pO1xuXG4gIC8vIENvbmRpdGlvbiBzdGF0ZS5wb3NpdGlvbiA9PT0gc3RhdGUubGluZVN0YXJ0IGlzIHRlc3RlZFxuICAvLyBpbiBwYXJlbnQgb24gZWFjaCBjYWxsLCBmb3IgZWZmaWNpZW5jeS4gTm8gbmVlZHMgdG8gdGVzdCBoZXJlIGFnYWluLlxuICBpZiAoXG4gICAgKGNoID09PSAweDJkIHx8IC8qIC0gKi8gY2ggPT09IDB4MmUpIC8qIC4gKi8gJiZcbiAgICBjaCA9PT0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChfcG9zaXRpb24gKyAxKSAmJlxuICAgIGNoID09PSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KF9wb3NpdGlvbiArIDIpXG4gICkge1xuICAgIF9wb3NpdGlvbiArPSAzO1xuXG4gICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KF9wb3NpdGlvbik7XG5cbiAgICBpZiAoY2ggPT09IDAgfHwgaXNXc09yRW9sKGNoKSkge1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiB3cml0ZUZvbGRlZExpbmVzKHN0YXRlOiBMb2FkZXJTdGF0ZSwgY291bnQ6IG51bWJlcik6IHZvaWQge1xuICBpZiAoY291bnQgPT09IDEpIHtcbiAgICBzdGF0ZS5yZXN1bHQgKz0gXCIgXCI7XG4gIH0gZWxzZSBpZiAoY291bnQgPiAxKSB7XG4gICAgc3RhdGUucmVzdWx0ICs9IGNvbW1vbi5yZXBlYXQoXCJcXG5cIiwgY291bnQgLSAxKTtcbiAgfVxufVxuXG5mdW5jdGlvbiByZWFkUGxhaW5TY2FsYXIoXG4gIHN0YXRlOiBMb2FkZXJTdGF0ZSxcbiAgbm9kZUluZGVudDogbnVtYmVyLFxuICB3aXRoaW5GbG93Q29sbGVjdGlvbjogYm9vbGVhbixcbik6IGJvb2xlYW4ge1xuICBjb25zdCBraW5kID0gc3RhdGUua2luZDtcbiAgY29uc3QgcmVzdWx0ID0gc3RhdGUucmVzdWx0O1xuICBsZXQgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKTtcblxuICBpZiAoXG4gICAgaXNXc09yRW9sKGNoKSB8fFxuICAgIGlzRmxvd0luZGljYXRvcihjaCkgfHxcbiAgICBjaCA9PT0gMHgyMyAvKiAjICovIHx8XG4gICAgY2ggPT09IDB4MjYgLyogJiAqLyB8fFxuICAgIGNoID09PSAweDJhIC8qICogKi8gfHxcbiAgICBjaCA9PT0gMHgyMSAvKiAhICovIHx8XG4gICAgY2ggPT09IDB4N2MgLyogfCAqLyB8fFxuICAgIGNoID09PSAweDNlIC8qID4gKi8gfHxcbiAgICBjaCA9PT0gMHgyNyAvKiAnICovIHx8XG4gICAgY2ggPT09IDB4MjIgLyogXCIgKi8gfHxcbiAgICBjaCA9PT0gMHgyNSAvKiAlICovIHx8XG4gICAgY2ggPT09IDB4NDAgLyogQCAqLyB8fFxuICAgIGNoID09PSAweDYwIC8qIGAgKi9cbiAgKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgbGV0IGZvbGxvd2luZzogbnVtYmVyO1xuICBpZiAoY2ggPT09IDB4M2YgfHwgLyogPyAqLyBjaCA9PT0gMHgyZCAvKiAtICovKSB7XG4gICAgZm9sbG93aW5nID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbiArIDEpO1xuXG4gICAgaWYgKFxuICAgICAgaXNXc09yRW9sKGZvbGxvd2luZykgfHxcbiAgICAgICh3aXRoaW5GbG93Q29sbGVjdGlvbiAmJiBpc0Zsb3dJbmRpY2F0b3IoZm9sbG93aW5nKSlcbiAgICApIHtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBzdGF0ZS5raW5kID0gXCJzY2FsYXJcIjtcbiAgc3RhdGUucmVzdWx0ID0gXCJcIjtcbiAgbGV0IGNhcHR1cmVFbmQ6IG51bWJlcixcbiAgICBjYXB0dXJlU3RhcnQgPSAoY2FwdHVyZUVuZCA9IHN0YXRlLnBvc2l0aW9uKTtcbiAgbGV0IGhhc1BlbmRpbmdDb250ZW50ID0gZmFsc2U7XG4gIGxldCBsaW5lID0gMDtcbiAgd2hpbGUgKGNoICE9PSAwKSB7XG4gICAgaWYgKGNoID09PSAweDNhIC8qIDogKi8pIHtcbiAgICAgIGZvbGxvd2luZyA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24gKyAxKTtcblxuICAgICAgaWYgKFxuICAgICAgICBpc1dzT3JFb2woZm9sbG93aW5nKSB8fFxuICAgICAgICAod2l0aGluRmxvd0NvbGxlY3Rpb24gJiYgaXNGbG93SW5kaWNhdG9yKGZvbGxvd2luZykpXG4gICAgICApIHtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChjaCA9PT0gMHgyMyAvKiAjICovKSB7XG4gICAgICBjb25zdCBwcmVjZWRpbmcgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uIC0gMSk7XG5cbiAgICAgIGlmIChpc1dzT3JFb2wocHJlY2VkaW5nKSkge1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKFxuICAgICAgKHN0YXRlLnBvc2l0aW9uID09PSBzdGF0ZS5saW5lU3RhcnQgJiYgdGVzdERvY3VtZW50U2VwYXJhdG9yKHN0YXRlKSkgfHxcbiAgICAgICh3aXRoaW5GbG93Q29sbGVjdGlvbiAmJiBpc0Zsb3dJbmRpY2F0b3IoY2gpKVxuICAgICkge1xuICAgICAgYnJlYWs7XG4gICAgfSBlbHNlIGlmIChpc0VPTChjaCkpIHtcbiAgICAgIGxpbmUgPSBzdGF0ZS5saW5lO1xuICAgICAgY29uc3QgbGluZVN0YXJ0ID0gc3RhdGUubGluZVN0YXJ0O1xuICAgICAgY29uc3QgbGluZUluZGVudCA9IHN0YXRlLmxpbmVJbmRlbnQ7XG4gICAgICBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCBmYWxzZSwgLTEpO1xuXG4gICAgICBpZiAoc3RhdGUubGluZUluZGVudCA+PSBub2RlSW5kZW50KSB7XG4gICAgICAgIGhhc1BlbmRpbmdDb250ZW50ID0gdHJ1ZTtcbiAgICAgICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKTtcbiAgICAgICAgY29udGludWU7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0ZS5wb3NpdGlvbiA9IGNhcHR1cmVFbmQ7XG4gICAgICAgIHN0YXRlLmxpbmUgPSBsaW5lO1xuICAgICAgICBzdGF0ZS5saW5lU3RhcnQgPSBsaW5lU3RhcnQ7XG4gICAgICAgIHN0YXRlLmxpbmVJbmRlbnQgPSBsaW5lSW5kZW50O1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoaGFzUGVuZGluZ0NvbnRlbnQpIHtcbiAgICAgIGNhcHR1cmVTZWdtZW50KHN0YXRlLCBjYXB0dXJlU3RhcnQsIGNhcHR1cmVFbmQsIGZhbHNlKTtcbiAgICAgIHdyaXRlRm9sZGVkTGluZXMoc3RhdGUsIHN0YXRlLmxpbmUgLSBsaW5lKTtcbiAgICAgIGNhcHR1cmVTdGFydCA9IGNhcHR1cmVFbmQgPSBzdGF0ZS5wb3NpdGlvbjtcbiAgICAgIGhhc1BlbmRpbmdDb250ZW50ID0gZmFsc2U7XG4gICAgfVxuXG4gICAgaWYgKCFpc1doaXRlU3BhY2UoY2gpKSB7XG4gICAgICBjYXB0dXJlRW5kID0gc3RhdGUucG9zaXRpb24gKyAxO1xuICAgIH1cblxuICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgfVxuXG4gIGNhcHR1cmVTZWdtZW50KHN0YXRlLCBjYXB0dXJlU3RhcnQsIGNhcHR1cmVFbmQsIGZhbHNlKTtcblxuICBpZiAoc3RhdGUucmVzdWx0KSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cblxuICBzdGF0ZS5raW5kID0ga2luZDtcbiAgc3RhdGUucmVzdWx0ID0gcmVzdWx0O1xuICByZXR1cm4gZmFsc2U7XG59XG5cbmZ1bmN0aW9uIHJlYWRTaW5nbGVRdW90ZWRTY2FsYXIoXG4gIHN0YXRlOiBMb2FkZXJTdGF0ZSxcbiAgbm9kZUluZGVudDogbnVtYmVyLFxuKTogYm9vbGVhbiB7XG4gIGxldCBjaCwgY2FwdHVyZVN0YXJ0LCBjYXB0dXJlRW5kO1xuXG4gIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG5cbiAgaWYgKGNoICE9PSAweDI3IC8qICcgKi8pIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBzdGF0ZS5raW5kID0gXCJzY2FsYXJcIjtcbiAgc3RhdGUucmVzdWx0ID0gXCJcIjtcbiAgc3RhdGUucG9zaXRpb24rKztcbiAgY2FwdHVyZVN0YXJ0ID0gY2FwdHVyZUVuZCA9IHN0YXRlLnBvc2l0aW9uO1xuXG4gIHdoaWxlICgoY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKSkgIT09IDApIHtcbiAgICBpZiAoY2ggPT09IDB4MjcgLyogJyAqLykge1xuICAgICAgY2FwdHVyZVNlZ21lbnQoc3RhdGUsIGNhcHR1cmVTdGFydCwgc3RhdGUucG9zaXRpb24sIHRydWUpO1xuICAgICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuXG4gICAgICBpZiAoY2ggPT09IDB4MjcgLyogJyAqLykge1xuICAgICAgICBjYXB0dXJlU3RhcnQgPSBzdGF0ZS5wb3NpdGlvbjtcbiAgICAgICAgc3RhdGUucG9zaXRpb24rKztcbiAgICAgICAgY2FwdHVyZUVuZCA9IHN0YXRlLnBvc2l0aW9uO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpc0VPTChjaCkpIHtcbiAgICAgIGNhcHR1cmVTZWdtZW50KHN0YXRlLCBjYXB0dXJlU3RhcnQsIGNhcHR1cmVFbmQsIHRydWUpO1xuICAgICAgd3JpdGVGb2xkZWRMaW5lcyhzdGF0ZSwgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgZmFsc2UsIG5vZGVJbmRlbnQpKTtcbiAgICAgIGNhcHR1cmVTdGFydCA9IGNhcHR1cmVFbmQgPSBzdGF0ZS5wb3NpdGlvbjtcbiAgICB9IGVsc2UgaWYgKFxuICAgICAgc3RhdGUucG9zaXRpb24gPT09IHN0YXRlLmxpbmVTdGFydCAmJlxuICAgICAgdGVzdERvY3VtZW50U2VwYXJhdG9yKHN0YXRlKVxuICAgICkge1xuICAgICAgcmV0dXJuIHRocm93RXJyb3IoXG4gICAgICAgIHN0YXRlLFxuICAgICAgICBcInVuZXhwZWN0ZWQgZW5kIG9mIHRoZSBkb2N1bWVudCB3aXRoaW4gYSBzaW5nbGUgcXVvdGVkIHNjYWxhclwiLFxuICAgICAgKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc3RhdGUucG9zaXRpb24rKztcbiAgICAgIGNhcHR1cmVFbmQgPSBzdGF0ZS5wb3NpdGlvbjtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhyb3dFcnJvcihcbiAgICBzdGF0ZSxcbiAgICBcInVuZXhwZWN0ZWQgZW5kIG9mIHRoZSBzdHJlYW0gd2l0aGluIGEgc2luZ2xlIHF1b3RlZCBzY2FsYXJcIixcbiAgKTtcbn1cblxuZnVuY3Rpb24gcmVhZERvdWJsZVF1b3RlZFNjYWxhcihcbiAgc3RhdGU6IExvYWRlclN0YXRlLFxuICBub2RlSW5kZW50OiBudW1iZXIsXG4pOiBib29sZWFuIHtcbiAgbGV0IGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG5cbiAgaWYgKGNoICE9PSAweDIyIC8qIFwiICovKSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgc3RhdGUua2luZCA9IFwic2NhbGFyXCI7XG4gIHN0YXRlLnJlc3VsdCA9IFwiXCI7XG4gIHN0YXRlLnBvc2l0aW9uKys7XG4gIGxldCBjYXB0dXJlRW5kOiBudW1iZXIsXG4gICAgY2FwdHVyZVN0YXJ0ID0gKGNhcHR1cmVFbmQgPSBzdGF0ZS5wb3NpdGlvbik7XG4gIGxldCB0bXA6IG51bWJlcjtcbiAgd2hpbGUgKChjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pKSAhPT0gMCkge1xuICAgIGlmIChjaCA9PT0gMHgyMiAvKiBcIiAqLykge1xuICAgICAgY2FwdHVyZVNlZ21lbnQoc3RhdGUsIGNhcHR1cmVTdGFydCwgc3RhdGUucG9zaXRpb24sIHRydWUpO1xuICAgICAgc3RhdGUucG9zaXRpb24rKztcbiAgICAgIHJldHVybiB0cnVlO1xuICAgIH1cbiAgICBpZiAoY2ggPT09IDB4NWMgLyogXFwgKi8pIHtcbiAgICAgIGNhcHR1cmVTZWdtZW50KHN0YXRlLCBjYXB0dXJlU3RhcnQsIHN0YXRlLnBvc2l0aW9uLCB0cnVlKTtcbiAgICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcblxuICAgICAgaWYgKGlzRU9MKGNoKSkge1xuICAgICAgICBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCBmYWxzZSwgbm9kZUluZGVudCk7XG5cbiAgICAgICAgLy8gVE9ETyhiYXJ0bG9taWVqdSk6IHJld29yayB0byBpbmxpbmUgZm4gd2l0aCBubyB0eXBlIGNhc3Q/XG4gICAgICB9IGVsc2UgaWYgKGNoIDwgMjU2ICYmIHNpbXBsZUVzY2FwZUNoZWNrW2NoXSkge1xuICAgICAgICBzdGF0ZS5yZXN1bHQgKz0gc2ltcGxlRXNjYXBlTWFwW2NoXTtcbiAgICAgICAgc3RhdGUucG9zaXRpb24rKztcbiAgICAgIH0gZWxzZSBpZiAoKHRtcCA9IGVzY2FwZWRIZXhMZW4oY2gpKSA+IDApIHtcbiAgICAgICAgbGV0IGhleExlbmd0aCA9IHRtcDtcbiAgICAgICAgbGV0IGhleFJlc3VsdCA9IDA7XG5cbiAgICAgICAgZm9yICg7IGhleExlbmd0aCA+IDA7IGhleExlbmd0aC0tKSB7XG4gICAgICAgICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuXG4gICAgICAgICAgaWYgKCh0bXAgPSBmcm9tSGV4Q29kZShjaCkpID49IDApIHtcbiAgICAgICAgICAgIGhleFJlc3VsdCA9IChoZXhSZXN1bHQgPDwgNCkgKyB0bXA7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHJldHVybiB0aHJvd0Vycm9yKHN0YXRlLCBcImV4cGVjdGVkIGhleGFkZWNpbWFsIGNoYXJhY3RlclwiKTtcbiAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICBzdGF0ZS5yZXN1bHQgKz0gY2hhckZyb21Db2RlcG9pbnQoaGV4UmVzdWx0KTtcblxuICAgICAgICBzdGF0ZS5wb3NpdGlvbisrO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRocm93RXJyb3Ioc3RhdGUsIFwidW5rbm93biBlc2NhcGUgc2VxdWVuY2VcIik7XG4gICAgICB9XG5cbiAgICAgIGNhcHR1cmVTdGFydCA9IGNhcHR1cmVFbmQgPSBzdGF0ZS5wb3NpdGlvbjtcbiAgICB9IGVsc2UgaWYgKGlzRU9MKGNoKSkge1xuICAgICAgY2FwdHVyZVNlZ21lbnQoc3RhdGUsIGNhcHR1cmVTdGFydCwgY2FwdHVyZUVuZCwgdHJ1ZSk7XG4gICAgICB3cml0ZUZvbGRlZExpbmVzKHN0YXRlLCBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCBmYWxzZSwgbm9kZUluZGVudCkpO1xuICAgICAgY2FwdHVyZVN0YXJ0ID0gY2FwdHVyZUVuZCA9IHN0YXRlLnBvc2l0aW9uO1xuICAgIH0gZWxzZSBpZiAoXG4gICAgICBzdGF0ZS5wb3NpdGlvbiA9PT0gc3RhdGUubGluZVN0YXJ0ICYmXG4gICAgICB0ZXN0RG9jdW1lbnRTZXBhcmF0b3Ioc3RhdGUpXG4gICAgKSB7XG4gICAgICByZXR1cm4gdGhyb3dFcnJvcihcbiAgICAgICAgc3RhdGUsXG4gICAgICAgIFwidW5leHBlY3RlZCBlbmQgb2YgdGhlIGRvY3VtZW50IHdpdGhpbiBhIGRvdWJsZSBxdW90ZWQgc2NhbGFyXCIsXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICBzdGF0ZS5wb3NpdGlvbisrO1xuICAgICAgY2FwdHVyZUVuZCA9IHN0YXRlLnBvc2l0aW9uO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiB0aHJvd0Vycm9yKFxuICAgIHN0YXRlLFxuICAgIFwidW5leHBlY3RlZCBlbmQgb2YgdGhlIHN0cmVhbSB3aXRoaW4gYSBkb3VibGUgcXVvdGVkIHNjYWxhclwiLFxuICApO1xufVxuXG5mdW5jdGlvbiByZWFkRmxvd0NvbGxlY3Rpb24oc3RhdGU6IExvYWRlclN0YXRlLCBub2RlSW5kZW50OiBudW1iZXIpOiBib29sZWFuIHtcbiAgbGV0IGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG4gIGxldCB0ZXJtaW5hdG9yOiBudW1iZXI7XG4gIGxldCBpc01hcHBpbmcgPSB0cnVlO1xuICBsZXQgcmVzdWx0OiBSZXN1bHRUeXBlID0ge307XG4gIGlmIChjaCA9PT0gMHg1YiAvKiBbICovKSB7XG4gICAgdGVybWluYXRvciA9IDB4NWQ7IC8qIF0gKi9cbiAgICBpc01hcHBpbmcgPSBmYWxzZTtcbiAgICByZXN1bHQgPSBbXTtcbiAgfSBlbHNlIGlmIChjaCA9PT0gMHg3YiAvKiB7ICovKSB7XG4gICAgdGVybWluYXRvciA9IDB4N2Q7IC8qIH0gKi9cbiAgfSBlbHNlIHtcbiAgICByZXR1cm4gZmFsc2U7XG4gIH1cblxuICBpZiAoXG4gICAgc3RhdGUuYW5jaG9yICE9PSBudWxsICYmXG4gICAgdHlwZW9mIHN0YXRlLmFuY2hvciAhPSBcInVuZGVmaW5lZFwiICYmXG4gICAgdHlwZW9mIHN0YXRlLmFuY2hvck1hcCAhPSBcInVuZGVmaW5lZFwiXG4gICkge1xuICAgIHN0YXRlLmFuY2hvck1hcFtzdGF0ZS5hbmNob3JdID0gcmVzdWx0O1xuICB9XG5cbiAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuXG4gIGNvbnN0IHRhZyA9IHN0YXRlLnRhZyxcbiAgICBhbmNob3IgPSBzdGF0ZS5hbmNob3I7XG4gIGxldCByZWFkTmV4dCA9IHRydWU7XG4gIGxldCB2YWx1ZU5vZGUsXG4gICAga2V5Tm9kZSxcbiAgICBrZXlUYWc6IHN0cmluZyB8IG51bGwgPSAoa2V5Tm9kZSA9IHZhbHVlTm9kZSA9IG51bGwpLFxuICAgIGlzRXhwbGljaXRQYWlyOiBib29sZWFuLFxuICAgIGlzUGFpciA9IChpc0V4cGxpY2l0UGFpciA9IGZhbHNlKTtcbiAgbGV0IGZvbGxvd2luZyA9IDAsXG4gICAgbGluZSA9IDA7XG4gIGNvbnN0IG92ZXJyaWRhYmxlS2V5czogQXJyYXlPYmplY3Q8Ym9vbGVhbj4gPSB7fTtcbiAgd2hpbGUgKGNoICE9PSAwKSB7XG4gICAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgbm9kZUluZGVudCk7XG5cbiAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pO1xuXG4gICAgaWYgKGNoID09PSB0ZXJtaW5hdG9yKSB7XG4gICAgICBzdGF0ZS5wb3NpdGlvbisrO1xuICAgICAgc3RhdGUudGFnID0gdGFnO1xuICAgICAgc3RhdGUuYW5jaG9yID0gYW5jaG9yO1xuICAgICAgc3RhdGUua2luZCA9IGlzTWFwcGluZyA/IFwibWFwcGluZ1wiIDogXCJzZXF1ZW5jZVwiO1xuICAgICAgc3RhdGUucmVzdWx0ID0gcmVzdWx0O1xuICAgICAgcmV0dXJuIHRydWU7XG4gICAgfVxuICAgIGlmICghcmVhZE5leHQpIHtcbiAgICAgIHJldHVybiB0aHJvd0Vycm9yKHN0YXRlLCBcIm1pc3NlZCBjb21tYSBiZXR3ZWVuIGZsb3cgY29sbGVjdGlvbiBlbnRyaWVzXCIpO1xuICAgIH1cblxuICAgIGtleVRhZyA9IGtleU5vZGUgPSB2YWx1ZU5vZGUgPSBudWxsO1xuICAgIGlzUGFpciA9IGlzRXhwbGljaXRQYWlyID0gZmFsc2U7XG5cbiAgICBpZiAoY2ggPT09IDB4M2YgLyogPyAqLykge1xuICAgICAgZm9sbG93aW5nID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbiArIDEpO1xuXG4gICAgICBpZiAoaXNXc09yRW9sKGZvbGxvd2luZykpIHtcbiAgICAgICAgaXNQYWlyID0gaXNFeHBsaWNpdFBhaXIgPSB0cnVlO1xuICAgICAgICBzdGF0ZS5wb3NpdGlvbisrO1xuICAgICAgICBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCBub2RlSW5kZW50KTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBsaW5lID0gc3RhdGUubGluZTtcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVzZS1iZWZvcmUtZGVmaW5lXG4gICAgY29tcG9zZU5vZGUoc3RhdGUsIG5vZGVJbmRlbnQsIENPTlRFWFRfRkxPV19JTiwgZmFsc2UsIHRydWUpO1xuICAgIGtleVRhZyA9IHN0YXRlLnRhZyB8fCBudWxsO1xuICAgIGtleU5vZGUgPSBzdGF0ZS5yZXN1bHQ7XG4gICAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgbm9kZUluZGVudCk7XG5cbiAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pO1xuXG4gICAgaWYgKChpc0V4cGxpY2l0UGFpciB8fCBzdGF0ZS5saW5lID09PSBsaW5lKSAmJiBjaCA9PT0gMHgzYSAvKiA6ICovKSB7XG4gICAgICBpc1BhaXIgPSB0cnVlO1xuICAgICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgICAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgbm9kZUluZGVudCk7XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVzZS1iZWZvcmUtZGVmaW5lXG4gICAgICBjb21wb3NlTm9kZShzdGF0ZSwgbm9kZUluZGVudCwgQ09OVEVYVF9GTE9XX0lOLCBmYWxzZSwgdHJ1ZSk7XG4gICAgICB2YWx1ZU5vZGUgPSBzdGF0ZS5yZXN1bHQ7XG4gICAgfVxuXG4gICAgaWYgKGlzTWFwcGluZykge1xuICAgICAgc3RvcmVNYXBwaW5nUGFpcihcbiAgICAgICAgc3RhdGUsXG4gICAgICAgIHJlc3VsdCxcbiAgICAgICAgb3ZlcnJpZGFibGVLZXlzLFxuICAgICAgICBrZXlUYWcsXG4gICAgICAgIGtleU5vZGUsXG4gICAgICAgIHZhbHVlTm9kZSxcbiAgICAgICk7XG4gICAgfSBlbHNlIGlmIChpc1BhaXIpIHtcbiAgICAgIChyZXN1bHQgYXMgQXJyYXlPYmplY3RbXSkucHVzaChcbiAgICAgICAgc3RvcmVNYXBwaW5nUGFpcihcbiAgICAgICAgICBzdGF0ZSxcbiAgICAgICAgICBudWxsLFxuICAgICAgICAgIG92ZXJyaWRhYmxlS2V5cyxcbiAgICAgICAgICBrZXlUYWcsXG4gICAgICAgICAga2V5Tm9kZSxcbiAgICAgICAgICB2YWx1ZU5vZGUsXG4gICAgICAgICksXG4gICAgICApO1xuICAgIH0gZWxzZSB7XG4gICAgICAocmVzdWx0IGFzIFJlc3VsdFR5cGVbXSkucHVzaChrZXlOb2RlIGFzIFJlc3VsdFR5cGUpO1xuICAgIH1cblxuICAgIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIHRydWUsIG5vZGVJbmRlbnQpO1xuXG4gICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKTtcblxuICAgIGlmIChjaCA9PT0gMHgyYyAvKiAsICovKSB7XG4gICAgICByZWFkTmV4dCA9IHRydWU7XG4gICAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJlYWROZXh0ID0gZmFsc2U7XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHRocm93RXJyb3IoXG4gICAgc3RhdGUsXG4gICAgXCJ1bmV4cGVjdGVkIGVuZCBvZiB0aGUgc3RyZWFtIHdpdGhpbiBhIGZsb3cgY29sbGVjdGlvblwiLFxuICApO1xufVxuXG5mdW5jdGlvbiByZWFkQmxvY2tTY2FsYXIoc3RhdGU6IExvYWRlclN0YXRlLCBub2RlSW5kZW50OiBudW1iZXIpOiBib29sZWFuIHtcbiAgbGV0IGNob21waW5nID0gQ0hPTVBJTkdfQ0xJUCxcbiAgICBkaWRSZWFkQ29udGVudCA9IGZhbHNlLFxuICAgIGRldGVjdGVkSW5kZW50ID0gZmFsc2UsXG4gICAgdGV4dEluZGVudCA9IG5vZGVJbmRlbnQsXG4gICAgZW1wdHlMaW5lcyA9IDAsXG4gICAgYXRNb3JlSW5kZW50ZWQgPSBmYWxzZTtcblxuICBsZXQgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKTtcblxuICBsZXQgZm9sZGluZyA9IGZhbHNlO1xuICBpZiAoY2ggPT09IDB4N2MgLyogfCAqLykge1xuICAgIGZvbGRpbmcgPSBmYWxzZTtcbiAgfSBlbHNlIGlmIChjaCA9PT0gMHgzZSAvKiA+ICovKSB7XG4gICAgZm9sZGluZyA9IHRydWU7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIGZhbHNlO1xuICB9XG5cbiAgc3RhdGUua2luZCA9IFwic2NhbGFyXCI7XG4gIHN0YXRlLnJlc3VsdCA9IFwiXCI7XG5cbiAgbGV0IHRtcCA9IDA7XG4gIHdoaWxlIChjaCAhPT0gMCkge1xuICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcblxuICAgIGlmIChjaCA9PT0gMHgyYiB8fCAvKiArICovIGNoID09PSAweDJkIC8qIC0gKi8pIHtcbiAgICAgIGlmIChDSE9NUElOR19DTElQID09PSBjaG9tcGluZykge1xuICAgICAgICBjaG9tcGluZyA9IGNoID09PSAweDJiIC8qICsgKi8gPyBDSE9NUElOR19LRUVQIDogQ0hPTVBJTkdfU1RSSVA7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihzdGF0ZSwgXCJyZXBlYXQgb2YgYSBjaG9tcGluZyBtb2RlIGlkZW50aWZpZXJcIik7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmICgodG1wID0gZnJvbURlY2ltYWxDb2RlKGNoKSkgPj0gMCkge1xuICAgICAgaWYgKHRtcCA9PT0gMCkge1xuICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihcbiAgICAgICAgICBzdGF0ZSxcbiAgICAgICAgICBcImJhZCBleHBsaWNpdCBpbmRlbnRhdGlvbiB3aWR0aCBvZiBhIGJsb2NrIHNjYWxhcjsgaXQgY2Fubm90IGJlIGxlc3MgdGhhbiBvbmVcIixcbiAgICAgICAgKTtcbiAgICAgIH0gZWxzZSBpZiAoIWRldGVjdGVkSW5kZW50KSB7XG4gICAgICAgIHRleHRJbmRlbnQgPSBub2RlSW5kZW50ICsgdG1wIC0gMTtcbiAgICAgICAgZGV0ZWN0ZWRJbmRlbnQgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmV0dXJuIHRocm93RXJyb3Ioc3RhdGUsIFwicmVwZWF0IG9mIGFuIGluZGVudGF0aW9uIHdpZHRoIGlkZW50aWZpZXJcIik7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGlmIChpc1doaXRlU3BhY2UoY2gpKSB7XG4gICAgZG8ge1xuICAgICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgIH0gd2hpbGUgKGlzV2hpdGVTcGFjZShjaCkpO1xuXG4gICAgaWYgKGNoID09PSAweDIzIC8qICMgKi8pIHtcbiAgICAgIGRvIHtcbiAgICAgICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgICAgfSB3aGlsZSAoIWlzRU9MKGNoKSAmJiBjaCAhPT0gMCk7XG4gICAgfVxuICB9XG5cbiAgd2hpbGUgKGNoICE9PSAwKSB7XG4gICAgcmVhZExpbmVCcmVhayhzdGF0ZSk7XG4gICAgc3RhdGUubGluZUluZGVudCA9IDA7XG5cbiAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pO1xuXG4gICAgd2hpbGUgKFxuICAgICAgKCFkZXRlY3RlZEluZGVudCB8fCBzdGF0ZS5saW5lSW5kZW50IDwgdGV4dEluZGVudCkgJiZcbiAgICAgIGNoID09PSAweDIwIC8qIFNwYWNlICovXG4gICAgKSB7XG4gICAgICBzdGF0ZS5saW5lSW5kZW50Kys7XG4gICAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgfVxuXG4gICAgaWYgKCFkZXRlY3RlZEluZGVudCAmJiBzdGF0ZS5saW5lSW5kZW50ID4gdGV4dEluZGVudCkge1xuICAgICAgdGV4dEluZGVudCA9IHN0YXRlLmxpbmVJbmRlbnQ7XG4gICAgfVxuXG4gICAgaWYgKGlzRU9MKGNoKSkge1xuICAgICAgZW1wdHlMaW5lcysrO1xuICAgICAgY29udGludWU7XG4gICAgfVxuXG4gICAgLy8gRW5kIG9mIHRoZSBzY2FsYXIuXG4gICAgaWYgKHN0YXRlLmxpbmVJbmRlbnQgPCB0ZXh0SW5kZW50KSB7XG4gICAgICAvLyBQZXJmb3JtIHRoZSBjaG9tcGluZy5cbiAgICAgIGlmIChjaG9tcGluZyA9PT0gQ0hPTVBJTkdfS0VFUCkge1xuICAgICAgICBzdGF0ZS5yZXN1bHQgKz0gY29tbW9uLnJlcGVhdChcbiAgICAgICAgICBcIlxcblwiLFxuICAgICAgICAgIGRpZFJlYWRDb250ZW50ID8gMSArIGVtcHR5TGluZXMgOiBlbXB0eUxpbmVzLFxuICAgICAgICApO1xuICAgICAgfSBlbHNlIGlmIChjaG9tcGluZyA9PT0gQ0hPTVBJTkdfQ0xJUCkge1xuICAgICAgICBpZiAoZGlkUmVhZENvbnRlbnQpIHtcbiAgICAgICAgICAvLyBpLmUuIG9ubHkgaWYgdGhlIHNjYWxhciBpcyBub3QgZW1wdHkuXG4gICAgICAgICAgc3RhdGUucmVzdWx0ICs9IFwiXFxuXCI7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gQnJlYWsgdGhpcyBgd2hpbGVgIGN5Y2xlIGFuZCBnbyB0byB0aGUgZnVuY3Rpb24ncyBlcGlsb2d1ZS5cbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIC8vIEZvbGRlZCBzdHlsZTogdXNlIGZhbmN5IHJ1bGVzIHRvIGhhbmRsZSBsaW5lIGJyZWFrcy5cbiAgICBpZiAoZm9sZGluZykge1xuICAgICAgLy8gTGluZXMgc3RhcnRpbmcgd2l0aCB3aGl0ZSBzcGFjZSBjaGFyYWN0ZXJzIChtb3JlLWluZGVudGVkIGxpbmVzKSBhcmUgbm90IGZvbGRlZC5cbiAgICAgIGlmIChpc1doaXRlU3BhY2UoY2gpKSB7XG4gICAgICAgIGF0TW9yZUluZGVudGVkID0gdHJ1ZTtcbiAgICAgICAgLy8gZXhjZXB0IGZvciB0aGUgZmlyc3QgY29udGVudCBsaW5lIChjZi4gRXhhbXBsZSA4LjEpXG4gICAgICAgIHN0YXRlLnJlc3VsdCArPSBjb21tb24ucmVwZWF0KFxuICAgICAgICAgIFwiXFxuXCIsXG4gICAgICAgICAgZGlkUmVhZENvbnRlbnQgPyAxICsgZW1wdHlMaW5lcyA6IGVtcHR5TGluZXMsXG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gRW5kIG9mIG1vcmUtaW5kZW50ZWQgYmxvY2suXG4gICAgICB9IGVsc2UgaWYgKGF0TW9yZUluZGVudGVkKSB7XG4gICAgICAgIGF0TW9yZUluZGVudGVkID0gZmFsc2U7XG4gICAgICAgIHN0YXRlLnJlc3VsdCArPSBjb21tb24ucmVwZWF0KFwiXFxuXCIsIGVtcHR5TGluZXMgKyAxKTtcblxuICAgICAgICAvLyBKdXN0IG9uZSBsaW5lIGJyZWFrIC0gcGVyY2VpdmUgYXMgdGhlIHNhbWUgbGluZS5cbiAgICAgIH0gZWxzZSBpZiAoZW1wdHlMaW5lcyA9PT0gMCkge1xuICAgICAgICBpZiAoZGlkUmVhZENvbnRlbnQpIHtcbiAgICAgICAgICAvLyBpLmUuIG9ubHkgaWYgd2UgaGF2ZSBhbHJlYWR5IHJlYWQgc29tZSBzY2FsYXIgY29udGVudC5cbiAgICAgICAgICBzdGF0ZS5yZXN1bHQgKz0gXCIgXCI7XG4gICAgICAgIH1cblxuICAgICAgICAvLyBTZXZlcmFsIGxpbmUgYnJlYWtzIC0gcGVyY2VpdmUgYXMgZGlmZmVyZW50IGxpbmVzLlxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgc3RhdGUucmVzdWx0ICs9IGNvbW1vbi5yZXBlYXQoXCJcXG5cIiwgZW1wdHlMaW5lcyk7XG4gICAgICB9XG5cbiAgICAgIC8vIExpdGVyYWwgc3R5bGU6IGp1c3QgYWRkIGV4YWN0IG51bWJlciBvZiBsaW5lIGJyZWFrcyBiZXR3ZWVuIGNvbnRlbnQgbGluZXMuXG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIEtlZXAgYWxsIGxpbmUgYnJlYWtzIGV4Y2VwdCB0aGUgaGVhZGVyIGxpbmUgYnJlYWsuXG4gICAgICBzdGF0ZS5yZXN1bHQgKz0gY29tbW9uLnJlcGVhdChcbiAgICAgICAgXCJcXG5cIixcbiAgICAgICAgZGlkUmVhZENvbnRlbnQgPyAxICsgZW1wdHlMaW5lcyA6IGVtcHR5TGluZXMsXG4gICAgICApO1xuICAgIH1cblxuICAgIGRpZFJlYWRDb250ZW50ID0gdHJ1ZTtcbiAgICBkZXRlY3RlZEluZGVudCA9IHRydWU7XG4gICAgZW1wdHlMaW5lcyA9IDA7XG4gICAgY29uc3QgY2FwdHVyZVN0YXJ0ID0gc3RhdGUucG9zaXRpb247XG5cbiAgICB3aGlsZSAoIWlzRU9MKGNoKSAmJiBjaCAhPT0gMCkge1xuICAgICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgIH1cblxuICAgIGNhcHR1cmVTZWdtZW50KHN0YXRlLCBjYXB0dXJlU3RhcnQsIHN0YXRlLnBvc2l0aW9uLCBmYWxzZSk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn1cblxuZnVuY3Rpb24gcmVhZEJsb2NrU2VxdWVuY2Uoc3RhdGU6IExvYWRlclN0YXRlLCBub2RlSW5kZW50OiBudW1iZXIpOiBib29sZWFuIHtcbiAgbGV0IGxpbmU6IG51bWJlcixcbiAgICBmb2xsb3dpbmc6IG51bWJlcixcbiAgICBkZXRlY3RlZCA9IGZhbHNlLFxuICAgIGNoOiBudW1iZXI7XG4gIGNvbnN0IHRhZyA9IHN0YXRlLnRhZyxcbiAgICBhbmNob3IgPSBzdGF0ZS5hbmNob3IsXG4gICAgcmVzdWx0OiB1bmtub3duW10gPSBbXTtcblxuICBpZiAoXG4gICAgc3RhdGUuYW5jaG9yICE9PSBudWxsICYmXG4gICAgdHlwZW9mIHN0YXRlLmFuY2hvciAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgIHR5cGVvZiBzdGF0ZS5hbmNob3JNYXAgIT09IFwidW5kZWZpbmVkXCJcbiAgKSB7XG4gICAgc3RhdGUuYW5jaG9yTWFwW3N0YXRlLmFuY2hvcl0gPSByZXN1bHQ7XG4gIH1cblxuICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pO1xuXG4gIHdoaWxlIChjaCAhPT0gMCkge1xuICAgIGlmIChjaCAhPT0gMHgyZCAvKiAtICovKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBmb2xsb3dpbmcgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uICsgMSk7XG5cbiAgICBpZiAoIWlzV3NPckVvbChmb2xsb3dpbmcpKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICBkZXRlY3RlZCA9IHRydWU7XG4gICAgc3RhdGUucG9zaXRpb24rKztcblxuICAgIGlmIChza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCAtMSkpIHtcbiAgICAgIGlmIChzdGF0ZS5saW5lSW5kZW50IDw9IG5vZGVJbmRlbnQpIHtcbiAgICAgICAgcmVzdWx0LnB1c2gobnVsbCk7XG4gICAgICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG4gICAgICAgIGNvbnRpbnVlO1xuICAgICAgfVxuICAgIH1cblxuICAgIGxpbmUgPSBzdGF0ZS5saW5lO1xuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tdXNlLWJlZm9yZS1kZWZpbmVcbiAgICBjb21wb3NlTm9kZShzdGF0ZSwgbm9kZUluZGVudCwgQ09OVEVYVF9CTE9DS19JTiwgZmFsc2UsIHRydWUpO1xuICAgIHJlc3VsdC5wdXNoKHN0YXRlLnJlc3VsdCk7XG4gICAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgLTEpO1xuXG4gICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKTtcblxuICAgIGlmICgoc3RhdGUubGluZSA9PT0gbGluZSB8fCBzdGF0ZS5saW5lSW5kZW50ID4gbm9kZUluZGVudCkgJiYgY2ggIT09IDApIHtcbiAgICAgIHJldHVybiB0aHJvd0Vycm9yKHN0YXRlLCBcImJhZCBpbmRlbnRhdGlvbiBvZiBhIHNlcXVlbmNlIGVudHJ5XCIpO1xuICAgIH0gZWxzZSBpZiAoc3RhdGUubGluZUluZGVudCA8IG5vZGVJbmRlbnQpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgfVxuXG4gIGlmIChkZXRlY3RlZCkge1xuICAgIHN0YXRlLnRhZyA9IHRhZztcbiAgICBzdGF0ZS5hbmNob3IgPSBhbmNob3I7XG4gICAgc3RhdGUua2luZCA9IFwic2VxdWVuY2VcIjtcbiAgICBzdGF0ZS5yZXN1bHQgPSByZXN1bHQ7XG4gICAgcmV0dXJuIHRydWU7XG4gIH1cbiAgcmV0dXJuIGZhbHNlO1xufVxuXG5mdW5jdGlvbiByZWFkQmxvY2tNYXBwaW5nKFxuICBzdGF0ZTogTG9hZGVyU3RhdGUsXG4gIG5vZGVJbmRlbnQ6IG51bWJlcixcbiAgZmxvd0luZGVudDogbnVtYmVyLFxuKTogYm9vbGVhbiB7XG4gIGNvbnN0IHRhZyA9IHN0YXRlLnRhZyxcbiAgICBhbmNob3IgPSBzdGF0ZS5hbmNob3IsXG4gICAgcmVzdWx0ID0ge30sXG4gICAgb3ZlcnJpZGFibGVLZXlzID0ge307XG4gIGxldCBmb2xsb3dpbmc6IG51bWJlcixcbiAgICBhbGxvd0NvbXBhY3QgPSBmYWxzZSxcbiAgICBsaW5lOiBudW1iZXIsXG4gICAgcG9zOiBudW1iZXIsXG4gICAga2V5VGFnID0gbnVsbCxcbiAgICBrZXlOb2RlID0gbnVsbCxcbiAgICB2YWx1ZU5vZGUgPSBudWxsLFxuICAgIGF0RXhwbGljaXRLZXkgPSBmYWxzZSxcbiAgICBkZXRlY3RlZCA9IGZhbHNlLFxuICAgIGNoOiBudW1iZXI7XG5cbiAgaWYgKFxuICAgIHN0YXRlLmFuY2hvciAhPT0gbnVsbCAmJlxuICAgIHR5cGVvZiBzdGF0ZS5hbmNob3IgIT09IFwidW5kZWZpbmVkXCIgJiZcbiAgICB0eXBlb2Ygc3RhdGUuYW5jaG9yTWFwICE9PSBcInVuZGVmaW5lZFwiXG4gICkge1xuICAgIHN0YXRlLmFuY2hvck1hcFtzdGF0ZS5hbmNob3JdID0gcmVzdWx0O1xuICB9XG5cbiAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKTtcblxuICB3aGlsZSAoY2ggIT09IDApIHtcbiAgICBmb2xsb3dpbmcgPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uICsgMSk7XG4gICAgbGluZSA9IHN0YXRlLmxpbmU7IC8vIFNhdmUgdGhlIGN1cnJlbnQgbGluZS5cbiAgICBwb3MgPSBzdGF0ZS5wb3NpdGlvbjtcblxuICAgIC8vXG4gICAgLy8gRXhwbGljaXQgbm90YXRpb24gY2FzZS4gVGhlcmUgYXJlIHR3byBzZXBhcmF0ZSBibG9ja3M6XG4gICAgLy8gZmlyc3QgZm9yIHRoZSBrZXkgKGRlbm90ZWQgYnkgXCI/XCIpIGFuZCBzZWNvbmQgZm9yIHRoZSB2YWx1ZSAoZGVub3RlZCBieSBcIjpcIilcbiAgICAvL1xuICAgIGlmICgoY2ggPT09IDB4M2YgfHwgLyogPyAqLyBjaCA9PT0gMHgzYSkgJiYgLyogOiAqLyBpc1dzT3JFb2woZm9sbG93aW5nKSkge1xuICAgICAgaWYgKGNoID09PSAweDNmIC8qID8gKi8pIHtcbiAgICAgICAgaWYgKGF0RXhwbGljaXRLZXkpIHtcbiAgICAgICAgICBzdG9yZU1hcHBpbmdQYWlyKFxuICAgICAgICAgICAgc3RhdGUsXG4gICAgICAgICAgICByZXN1bHQsXG4gICAgICAgICAgICBvdmVycmlkYWJsZUtleXMsXG4gICAgICAgICAgICBrZXlUYWcgYXMgc3RyaW5nLFxuICAgICAgICAgICAga2V5Tm9kZSxcbiAgICAgICAgICAgIG51bGwsXG4gICAgICAgICAgKTtcbiAgICAgICAgICBrZXlUYWcgPSBrZXlOb2RlID0gdmFsdWVOb2RlID0gbnVsbDtcbiAgICAgICAgfVxuXG4gICAgICAgIGRldGVjdGVkID0gdHJ1ZTtcbiAgICAgICAgYXRFeHBsaWNpdEtleSA9IHRydWU7XG4gICAgICAgIGFsbG93Q29tcGFjdCA9IHRydWU7XG4gICAgICB9IGVsc2UgaWYgKGF0RXhwbGljaXRLZXkpIHtcbiAgICAgICAgLy8gaS5lLiAweDNBLyogOiAqLyA9PT0gY2hhcmFjdGVyIGFmdGVyIHRoZSBleHBsaWNpdCBrZXkuXG4gICAgICAgIGF0RXhwbGljaXRLZXkgPSBmYWxzZTtcbiAgICAgICAgYWxsb3dDb21wYWN0ID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJldHVybiB0aHJvd0Vycm9yKFxuICAgICAgICAgIHN0YXRlLFxuICAgICAgICAgIFwiaW5jb21wbGV0ZSBleHBsaWNpdCBtYXBwaW5nIHBhaXI7IGEga2V5IG5vZGUgaXMgbWlzc2VkOyBvciBmb2xsb3dlZCBieSBhIG5vbi10YWJ1bGF0ZWQgZW1wdHkgbGluZVwiLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBzdGF0ZS5wb3NpdGlvbiArPSAxO1xuICAgICAgY2ggPSBmb2xsb3dpbmc7XG5cbiAgICAgIC8vXG4gICAgICAvLyBJbXBsaWNpdCBub3RhdGlvbiBjYXNlLiBGbG93LXN0eWxlIG5vZGUgYXMgdGhlIGtleSBmaXJzdCwgdGhlbiBcIjpcIiwgYW5kIHRoZSB2YWx1ZS5cbiAgICAgIC8vXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVzZS1iZWZvcmUtZGVmaW5lXG4gICAgfSBlbHNlIGlmIChjb21wb3NlTm9kZShzdGF0ZSwgZmxvd0luZGVudCwgQ09OVEVYVF9GTE9XX09VVCwgZmFsc2UsIHRydWUpKSB7XG4gICAgICBpZiAoc3RhdGUubGluZSA9PT0gbGluZSkge1xuICAgICAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pO1xuXG4gICAgICAgIHdoaWxlIChpc1doaXRlU3BhY2UoY2gpKSB7XG4gICAgICAgICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGNoID09PSAweDNhIC8qIDogKi8pIHtcbiAgICAgICAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG5cbiAgICAgICAgICBpZiAoIWlzV3NPckVvbChjaCkpIHtcbiAgICAgICAgICAgIHJldHVybiB0aHJvd0Vycm9yKFxuICAgICAgICAgICAgICBzdGF0ZSxcbiAgICAgICAgICAgICAgXCJhIHdoaXRlc3BhY2UgY2hhcmFjdGVyIGlzIGV4cGVjdGVkIGFmdGVyIHRoZSBrZXktdmFsdWUgc2VwYXJhdG9yIHdpdGhpbiBhIGJsb2NrIG1hcHBpbmdcIixcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaWYgKGF0RXhwbGljaXRLZXkpIHtcbiAgICAgICAgICAgIHN0b3JlTWFwcGluZ1BhaXIoXG4gICAgICAgICAgICAgIHN0YXRlLFxuICAgICAgICAgICAgICByZXN1bHQsXG4gICAgICAgICAgICAgIG92ZXJyaWRhYmxlS2V5cyxcbiAgICAgICAgICAgICAga2V5VGFnIGFzIHN0cmluZyxcbiAgICAgICAgICAgICAga2V5Tm9kZSxcbiAgICAgICAgICAgICAgbnVsbCxcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgICBrZXlUYWcgPSBrZXlOb2RlID0gdmFsdWVOb2RlID0gbnVsbDtcbiAgICAgICAgICB9XG5cbiAgICAgICAgICBkZXRlY3RlZCA9IHRydWU7XG4gICAgICAgICAgYXRFeHBsaWNpdEtleSA9IGZhbHNlO1xuICAgICAgICAgIGFsbG93Q29tcGFjdCA9IGZhbHNlO1xuICAgICAgICAgIGtleVRhZyA9IHN0YXRlLnRhZztcbiAgICAgICAgICBrZXlOb2RlID0gc3RhdGUucmVzdWx0O1xuICAgICAgICB9IGVsc2UgaWYgKGRldGVjdGVkKSB7XG4gICAgICAgICAgcmV0dXJuIHRocm93RXJyb3IoXG4gICAgICAgICAgICBzdGF0ZSxcbiAgICAgICAgICAgIFwiY2FuIG5vdCByZWFkIGFuIGltcGxpY2l0IG1hcHBpbmcgcGFpcjsgYSBjb2xvbiBpcyBtaXNzZWRcIixcbiAgICAgICAgICApO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHN0YXRlLnRhZyA9IHRhZztcbiAgICAgICAgICBzdGF0ZS5hbmNob3IgPSBhbmNob3I7XG4gICAgICAgICAgcmV0dXJuIHRydWU7IC8vIEtlZXAgdGhlIHJlc3VsdCBvZiBgY29tcG9zZU5vZGVgLlxuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGRldGVjdGVkKSB7XG4gICAgICAgIHJldHVybiB0aHJvd0Vycm9yKFxuICAgICAgICAgIHN0YXRlLFxuICAgICAgICAgIFwiY2FuIG5vdCByZWFkIGEgYmxvY2sgbWFwcGluZyBlbnRyeTsgYSBtdWx0aWxpbmUga2V5IG1heSBub3QgYmUgYW4gaW1wbGljaXQga2V5XCIsXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0ZS50YWcgPSB0YWc7XG4gICAgICAgIHN0YXRlLmFuY2hvciA9IGFuY2hvcjtcbiAgICAgICAgcmV0dXJuIHRydWU7IC8vIEtlZXAgdGhlIHJlc3VsdCBvZiBgY29tcG9zZU5vZGVgLlxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICBicmVhazsgLy8gUmVhZGluZyBpcyBkb25lLiBHbyB0byB0aGUgZXBpbG9ndWUuXG4gICAgfVxuXG4gICAgLy9cbiAgICAvLyBDb21tb24gcmVhZGluZyBjb2RlIGZvciBib3RoIGV4cGxpY2l0IGFuZCBpbXBsaWNpdCBub3RhdGlvbnMuXG4gICAgLy9cbiAgICBpZiAoc3RhdGUubGluZSA9PT0gbGluZSB8fCBzdGF0ZS5saW5lSW5kZW50ID4gbm9kZUluZGVudCkge1xuICAgICAgaWYgKFxuICAgICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLXVzZS1iZWZvcmUtZGVmaW5lXG4gICAgICAgIGNvbXBvc2VOb2RlKHN0YXRlLCBub2RlSW5kZW50LCBDT05URVhUX0JMT0NLX09VVCwgdHJ1ZSwgYWxsb3dDb21wYWN0KVxuICAgICAgKSB7XG4gICAgICAgIGlmIChhdEV4cGxpY2l0S2V5KSB7XG4gICAgICAgICAga2V5Tm9kZSA9IHN0YXRlLnJlc3VsdDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICB2YWx1ZU5vZGUgPSBzdGF0ZS5yZXN1bHQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKCFhdEV4cGxpY2l0S2V5KSB7XG4gICAgICAgIHN0b3JlTWFwcGluZ1BhaXIoXG4gICAgICAgICAgc3RhdGUsXG4gICAgICAgICAgcmVzdWx0LFxuICAgICAgICAgIG92ZXJyaWRhYmxlS2V5cyxcbiAgICAgICAgICBrZXlUYWcgYXMgc3RyaW5nLFxuICAgICAgICAgIGtleU5vZGUsXG4gICAgICAgICAgdmFsdWVOb2RlLFxuICAgICAgICAgIGxpbmUsXG4gICAgICAgICAgcG9zLFxuICAgICAgICApO1xuICAgICAgICBrZXlUYWcgPSBrZXlOb2RlID0gdmFsdWVOb2RlID0gbnVsbDtcbiAgICAgIH1cblxuICAgICAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgLTEpO1xuICAgICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKTtcbiAgICB9XG5cbiAgICBpZiAoc3RhdGUubGluZUluZGVudCA+IG5vZGVJbmRlbnQgJiYgY2ggIT09IDApIHtcbiAgICAgIHJldHVybiB0aHJvd0Vycm9yKHN0YXRlLCBcImJhZCBpbmRlbnRhdGlvbiBvZiBhIG1hcHBpbmcgZW50cnlcIik7XG4gICAgfSBlbHNlIGlmIChzdGF0ZS5saW5lSW5kZW50IDwgbm9kZUluZGVudCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuICB9XG5cbiAgLy9cbiAgLy8gRXBpbG9ndWUuXG4gIC8vXG5cbiAgLy8gU3BlY2lhbCBjYXNlOiBsYXN0IG1hcHBpbmcncyBub2RlIGNvbnRhaW5zIG9ubHkgdGhlIGtleSBpbiBleHBsaWNpdCBub3RhdGlvbi5cbiAgaWYgKGF0RXhwbGljaXRLZXkpIHtcbiAgICBzdG9yZU1hcHBpbmdQYWlyKFxuICAgICAgc3RhdGUsXG4gICAgICByZXN1bHQsXG4gICAgICBvdmVycmlkYWJsZUtleXMsXG4gICAgICBrZXlUYWcgYXMgc3RyaW5nLFxuICAgICAga2V5Tm9kZSxcbiAgICAgIG51bGwsXG4gICAgKTtcbiAgfVxuXG4gIC8vIEV4cG9zZSB0aGUgcmVzdWx0aW5nIG1hcHBpbmcuXG4gIGlmIChkZXRlY3RlZCkge1xuICAgIHN0YXRlLnRhZyA9IHRhZztcbiAgICBzdGF0ZS5hbmNob3IgPSBhbmNob3I7XG4gICAgc3RhdGUua2luZCA9IFwibWFwcGluZ1wiO1xuICAgIHN0YXRlLnJlc3VsdCA9IHJlc3VsdDtcbiAgfVxuXG4gIHJldHVybiBkZXRlY3RlZDtcbn1cblxuZnVuY3Rpb24gcmVhZFRhZ1Byb3BlcnR5KHN0YXRlOiBMb2FkZXJTdGF0ZSk6IGJvb2xlYW4ge1xuICBsZXQgcG9zaXRpb246IG51bWJlcixcbiAgICBpc1ZlcmJhdGltID0gZmFsc2UsXG4gICAgaXNOYW1lZCA9IGZhbHNlLFxuICAgIHRhZ0hhbmRsZSA9IFwiXCIsXG4gICAgdGFnTmFtZTogc3RyaW5nLFxuICAgIGNoOiBudW1iZXI7XG5cbiAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKTtcblxuICBpZiAoY2ggIT09IDB4MjEgLyogISAqLykgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChzdGF0ZS50YWcgIT09IG51bGwpIHtcbiAgICByZXR1cm4gdGhyb3dFcnJvcihzdGF0ZSwgXCJkdXBsaWNhdGlvbiBvZiBhIHRhZyBwcm9wZXJ0eVwiKTtcbiAgfVxuXG4gIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcblxuICBpZiAoY2ggPT09IDB4M2MgLyogPCAqLykge1xuICAgIGlzVmVyYmF0aW0gPSB0cnVlO1xuICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgfSBlbHNlIGlmIChjaCA9PT0gMHgyMSAvKiAhICovKSB7XG4gICAgaXNOYW1lZCA9IHRydWU7XG4gICAgdGFnSGFuZGxlID0gXCIhIVwiO1xuICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgfSBlbHNlIHtcbiAgICB0YWdIYW5kbGUgPSBcIiFcIjtcbiAgfVxuXG4gIHBvc2l0aW9uID0gc3RhdGUucG9zaXRpb247XG5cbiAgaWYgKGlzVmVyYmF0aW0pIHtcbiAgICBkbyB7XG4gICAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgfSB3aGlsZSAoY2ggIT09IDAgJiYgY2ggIT09IDB4M2UgLyogPiAqLyk7XG5cbiAgICBpZiAoc3RhdGUucG9zaXRpb24gPCBzdGF0ZS5sZW5ndGgpIHtcbiAgICAgIHRhZ05hbWUgPSBzdGF0ZS5pbnB1dC5zbGljZShwb3NpdGlvbiwgc3RhdGUucG9zaXRpb24pO1xuICAgICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhyb3dFcnJvcihcbiAgICAgICAgc3RhdGUsXG4gICAgICAgIFwidW5leHBlY3RlZCBlbmQgb2YgdGhlIHN0cmVhbSB3aXRoaW4gYSB2ZXJiYXRpbSB0YWdcIixcbiAgICAgICk7XG4gICAgfVxuICB9IGVsc2Uge1xuICAgIHdoaWxlIChjaCAhPT0gMCAmJiAhaXNXc09yRW9sKGNoKSkge1xuICAgICAgaWYgKGNoID09PSAweDIxIC8qICEgKi8pIHtcbiAgICAgICAgaWYgKCFpc05hbWVkKSB7XG4gICAgICAgICAgdGFnSGFuZGxlID0gc3RhdGUuaW5wdXQuc2xpY2UocG9zaXRpb24gLSAxLCBzdGF0ZS5wb3NpdGlvbiArIDEpO1xuXG4gICAgICAgICAgaWYgKCFQQVRURVJOX1RBR19IQU5ETEUudGVzdCh0YWdIYW5kbGUpKSB7XG4gICAgICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihcbiAgICAgICAgICAgICAgc3RhdGUsXG4gICAgICAgICAgICAgIFwibmFtZWQgdGFnIGhhbmRsZSBjYW5ub3QgY29udGFpbiBzdWNoIGNoYXJhY3RlcnNcIixcbiAgICAgICAgICAgICk7XG4gICAgICAgICAgfVxuXG4gICAgICAgICAgaXNOYW1lZCA9IHRydWU7XG4gICAgICAgICAgcG9zaXRpb24gPSBzdGF0ZS5wb3NpdGlvbiArIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcmV0dXJuIHRocm93RXJyb3IoXG4gICAgICAgICAgICBzdGF0ZSxcbiAgICAgICAgICAgIFwidGFnIHN1ZmZpeCBjYW5ub3QgY29udGFpbiBleGNsYW1hdGlvbiBtYXJrc1wiLFxuICAgICAgICAgICk7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICAgIH1cblxuICAgIHRhZ05hbWUgPSBzdGF0ZS5pbnB1dC5zbGljZShwb3NpdGlvbiwgc3RhdGUucG9zaXRpb24pO1xuXG4gICAgaWYgKFBBVFRFUk5fRkxPV19JTkRJQ0FUT1JTLnRlc3QodGFnTmFtZSkpIHtcbiAgICAgIHJldHVybiB0aHJvd0Vycm9yKFxuICAgICAgICBzdGF0ZSxcbiAgICAgICAgXCJ0YWcgc3VmZml4IGNhbm5vdCBjb250YWluIGZsb3cgaW5kaWNhdG9yIGNoYXJhY3RlcnNcIixcbiAgICAgICk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHRhZ05hbWUgJiYgIVBBVFRFUk5fVEFHX1VSSS50ZXN0KHRhZ05hbWUpKSB7XG4gICAgcmV0dXJuIHRocm93RXJyb3IoXG4gICAgICBzdGF0ZSxcbiAgICAgIGB0YWcgbmFtZSBjYW5ub3QgY29udGFpbiBzdWNoIGNoYXJhY3RlcnM6ICR7dGFnTmFtZX1gLFxuICAgICk7XG4gIH1cblxuICBpZiAoaXNWZXJiYXRpbSkge1xuICAgIHN0YXRlLnRhZyA9IHRhZ05hbWU7XG4gIH0gZWxzZSBpZiAoXG4gICAgdHlwZW9mIHN0YXRlLnRhZ01hcCAhPT0gXCJ1bmRlZmluZWRcIiAmJlxuICAgIF9oYXNPd25Qcm9wZXJ0eS5jYWxsKHN0YXRlLnRhZ01hcCwgdGFnSGFuZGxlKVxuICApIHtcbiAgICBzdGF0ZS50YWcgPSBzdGF0ZS50YWdNYXBbdGFnSGFuZGxlXSArIHRhZ05hbWU7XG4gIH0gZWxzZSBpZiAodGFnSGFuZGxlID09PSBcIiFcIikge1xuICAgIHN0YXRlLnRhZyA9IGAhJHt0YWdOYW1lfWA7XG4gIH0gZWxzZSBpZiAodGFnSGFuZGxlID09PSBcIiEhXCIpIHtcbiAgICBzdGF0ZS50YWcgPSBgdGFnOnlhbWwub3JnLDIwMDI6JHt0YWdOYW1lfWA7XG4gIH0gZWxzZSB7XG4gICAgcmV0dXJuIHRocm93RXJyb3Ioc3RhdGUsIGB1bmRlY2xhcmVkIHRhZyBoYW5kbGUgXCIke3RhZ0hhbmRsZX1cImApO1xuICB9XG5cbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIHJlYWRBbmNob3JQcm9wZXJ0eShzdGF0ZTogTG9hZGVyU3RhdGUpOiBib29sZWFuIHtcbiAgbGV0IGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG4gIGlmIChjaCAhPT0gMHgyNiAvKiAmICovKSByZXR1cm4gZmFsc2U7XG5cbiAgaWYgKHN0YXRlLmFuY2hvciAhPT0gbnVsbCkge1xuICAgIHJldHVybiB0aHJvd0Vycm9yKHN0YXRlLCBcImR1cGxpY2F0aW9uIG9mIGFuIGFuY2hvciBwcm9wZXJ0eVwiKTtcbiAgfVxuICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG5cbiAgY29uc3QgcG9zaXRpb24gPSBzdGF0ZS5wb3NpdGlvbjtcbiAgd2hpbGUgKGNoICE9PSAwICYmICFpc1dzT3JFb2woY2gpICYmICFpc0Zsb3dJbmRpY2F0b3IoY2gpKSB7XG4gICAgY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KCsrc3RhdGUucG9zaXRpb24pO1xuICB9XG5cbiAgaWYgKHN0YXRlLnBvc2l0aW9uID09PSBwb3NpdGlvbikge1xuICAgIHJldHVybiB0aHJvd0Vycm9yKFxuICAgICAgc3RhdGUsXG4gICAgICBcIm5hbWUgb2YgYW4gYW5jaG9yIG5vZGUgbXVzdCBjb250YWluIGF0IGxlYXN0IG9uZSBjaGFyYWN0ZXJcIixcbiAgICApO1xuICB9XG5cbiAgc3RhdGUuYW5jaG9yID0gc3RhdGUuaW5wdXQuc2xpY2UocG9zaXRpb24sIHN0YXRlLnBvc2l0aW9uKTtcbiAgcmV0dXJuIHRydWU7XG59XG5cbmZ1bmN0aW9uIHJlYWRBbGlhcyhzdGF0ZTogTG9hZGVyU3RhdGUpOiBib29sZWFuIHtcbiAgbGV0IGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbik7XG5cbiAgaWYgKGNoICE9PSAweDJhIC8qICogKi8pIHJldHVybiBmYWxzZTtcblxuICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gIGNvbnN0IF9wb3NpdGlvbiA9IHN0YXRlLnBvc2l0aW9uO1xuXG4gIHdoaWxlIChjaCAhPT0gMCAmJiAhaXNXc09yRW9sKGNoKSAmJiAhaXNGbG93SW5kaWNhdG9yKGNoKSkge1xuICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgfVxuXG4gIGlmIChzdGF0ZS5wb3NpdGlvbiA9PT0gX3Bvc2l0aW9uKSB7XG4gICAgcmV0dXJuIHRocm93RXJyb3IoXG4gICAgICBzdGF0ZSxcbiAgICAgIFwibmFtZSBvZiBhbiBhbGlhcyBub2RlIG11c3QgY29udGFpbiBhdCBsZWFzdCBvbmUgY2hhcmFjdGVyXCIsXG4gICAgKTtcbiAgfVxuXG4gIGNvbnN0IGFsaWFzID0gc3RhdGUuaW5wdXQuc2xpY2UoX3Bvc2l0aW9uLCBzdGF0ZS5wb3NpdGlvbik7XG4gIGlmIChcbiAgICB0eXBlb2Ygc3RhdGUuYW5jaG9yTWFwICE9PSBcInVuZGVmaW5lZFwiICYmXG4gICAgIU9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChzdGF0ZS5hbmNob3JNYXAsIGFsaWFzKVxuICApIHtcbiAgICByZXR1cm4gdGhyb3dFcnJvcihzdGF0ZSwgYHVuaWRlbnRpZmllZCBhbGlhcyBcIiR7YWxpYXN9XCJgKTtcbiAgfVxuXG4gIGlmICh0eXBlb2Ygc3RhdGUuYW5jaG9yTWFwICE9PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgc3RhdGUucmVzdWx0ID0gc3RhdGUuYW5jaG9yTWFwW2FsaWFzXTtcbiAgfVxuICBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCAtMSk7XG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBjb21wb3NlTm9kZShcbiAgc3RhdGU6IExvYWRlclN0YXRlLFxuICBwYXJlbnRJbmRlbnQ6IG51bWJlcixcbiAgbm9kZUNvbnRleHQ6IG51bWJlcixcbiAgYWxsb3dUb1NlZWs6IGJvb2xlYW4sXG4gIGFsbG93Q29tcGFjdDogYm9vbGVhbixcbik6IGJvb2xlYW4ge1xuICBsZXQgYWxsb3dCbG9ja1NjYWxhcnM6IGJvb2xlYW4sXG4gICAgYWxsb3dCbG9ja0NvbGxlY3Rpb25zOiBib29sZWFuLFxuICAgIGluZGVudFN0YXR1cyA9IDEsIC8vIDE6IHRoaXM+cGFyZW50LCAwOiB0aGlzPXBhcmVudCwgLTE6IHRoaXM8cGFyZW50XG4gICAgYXROZXdMaW5lID0gZmFsc2UsXG4gICAgaGFzQ29udGVudCA9IGZhbHNlLFxuICAgIHR5cGU6IFR5cGUsXG4gICAgZmxvd0luZGVudDogbnVtYmVyLFxuICAgIGJsb2NrSW5kZW50OiBudW1iZXI7XG5cbiAgaWYgKHN0YXRlLmxpc3RlbmVyICYmIHN0YXRlLmxpc3RlbmVyICE9PSBudWxsKSB7XG4gICAgc3RhdGUubGlzdGVuZXIoXCJvcGVuXCIsIHN0YXRlKTtcbiAgfVxuXG4gIHN0YXRlLnRhZyA9IG51bGw7XG4gIHN0YXRlLmFuY2hvciA9IG51bGw7XG4gIHN0YXRlLmtpbmQgPSBudWxsO1xuICBzdGF0ZS5yZXN1bHQgPSBudWxsO1xuXG4gIGNvbnN0IGFsbG93QmxvY2tTdHlsZXMgPVxuICAgIChhbGxvd0Jsb2NrU2NhbGFycyA9IGFsbG93QmxvY2tDb2xsZWN0aW9ucyA9XG4gICAgICBDT05URVhUX0JMT0NLX09VVCA9PT0gbm9kZUNvbnRleHQgfHwgQ09OVEVYVF9CTE9DS19JTiA9PT0gbm9kZUNvbnRleHQpO1xuXG4gIGlmIChhbGxvd1RvU2Vlaykge1xuICAgIGlmIChza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCAtMSkpIHtcbiAgICAgIGF0TmV3TGluZSA9IHRydWU7XG5cbiAgICAgIGlmIChzdGF0ZS5saW5lSW5kZW50ID4gcGFyZW50SW5kZW50KSB7XG4gICAgICAgIGluZGVudFN0YXR1cyA9IDE7XG4gICAgICB9IGVsc2UgaWYgKHN0YXRlLmxpbmVJbmRlbnQgPT09IHBhcmVudEluZGVudCkge1xuICAgICAgICBpbmRlbnRTdGF0dXMgPSAwO1xuICAgICAgfSBlbHNlIGlmIChzdGF0ZS5saW5lSW5kZW50IDwgcGFyZW50SW5kZW50KSB7XG4gICAgICAgIGluZGVudFN0YXR1cyA9IC0xO1xuICAgICAgfVxuICAgIH1cbiAgfVxuXG4gIGlmIChpbmRlbnRTdGF0dXMgPT09IDEpIHtcbiAgICB3aGlsZSAocmVhZFRhZ1Byb3BlcnR5KHN0YXRlKSB8fCByZWFkQW5jaG9yUHJvcGVydHkoc3RhdGUpKSB7XG4gICAgICBpZiAoc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgLTEpKSB7XG4gICAgICAgIGF0TmV3TGluZSA9IHRydWU7XG4gICAgICAgIGFsbG93QmxvY2tDb2xsZWN0aW9ucyA9IGFsbG93QmxvY2tTdHlsZXM7XG5cbiAgICAgICAgaWYgKHN0YXRlLmxpbmVJbmRlbnQgPiBwYXJlbnRJbmRlbnQpIHtcbiAgICAgICAgICBpbmRlbnRTdGF0dXMgPSAxO1xuICAgICAgICB9IGVsc2UgaWYgKHN0YXRlLmxpbmVJbmRlbnQgPT09IHBhcmVudEluZGVudCkge1xuICAgICAgICAgIGluZGVudFN0YXR1cyA9IDA7XG4gICAgICAgIH0gZWxzZSBpZiAoc3RhdGUubGluZUluZGVudCA8IHBhcmVudEluZGVudCkge1xuICAgICAgICAgIGluZGVudFN0YXR1cyA9IC0xO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBhbGxvd0Jsb2NrQ29sbGVjdGlvbnMgPSBmYWxzZTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICBpZiAoYWxsb3dCbG9ja0NvbGxlY3Rpb25zKSB7XG4gICAgYWxsb3dCbG9ja0NvbGxlY3Rpb25zID0gYXROZXdMaW5lIHx8IGFsbG93Q29tcGFjdDtcbiAgfVxuXG4gIGlmIChpbmRlbnRTdGF0dXMgPT09IDEgfHwgQ09OVEVYVF9CTE9DS19PVVQgPT09IG5vZGVDb250ZXh0KSB7XG4gICAgY29uc3QgY29uZCA9IENPTlRFWFRfRkxPV19JTiA9PT0gbm9kZUNvbnRleHQgfHxcbiAgICAgIENPTlRFWFRfRkxPV19PVVQgPT09IG5vZGVDb250ZXh0O1xuICAgIGZsb3dJbmRlbnQgPSBjb25kID8gcGFyZW50SW5kZW50IDogcGFyZW50SW5kZW50ICsgMTtcblxuICAgIGJsb2NrSW5kZW50ID0gc3RhdGUucG9zaXRpb24gLSBzdGF0ZS5saW5lU3RhcnQ7XG5cbiAgICBpZiAoaW5kZW50U3RhdHVzID09PSAxKSB7XG4gICAgICBpZiAoXG4gICAgICAgIChhbGxvd0Jsb2NrQ29sbGVjdGlvbnMgJiZcbiAgICAgICAgICAocmVhZEJsb2NrU2VxdWVuY2Uoc3RhdGUsIGJsb2NrSW5kZW50KSB8fFxuICAgICAgICAgICAgcmVhZEJsb2NrTWFwcGluZyhzdGF0ZSwgYmxvY2tJbmRlbnQsIGZsb3dJbmRlbnQpKSkgfHxcbiAgICAgICAgcmVhZEZsb3dDb2xsZWN0aW9uKHN0YXRlLCBmbG93SW5kZW50KVxuICAgICAgKSB7XG4gICAgICAgIGhhc0NvbnRlbnQgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKFxuICAgICAgICAgIChhbGxvd0Jsb2NrU2NhbGFycyAmJiByZWFkQmxvY2tTY2FsYXIoc3RhdGUsIGZsb3dJbmRlbnQpKSB8fFxuICAgICAgICAgIHJlYWRTaW5nbGVRdW90ZWRTY2FsYXIoc3RhdGUsIGZsb3dJbmRlbnQpIHx8XG4gICAgICAgICAgcmVhZERvdWJsZVF1b3RlZFNjYWxhcihzdGF0ZSwgZmxvd0luZGVudClcbiAgICAgICAgKSB7XG4gICAgICAgICAgaGFzQ29udGVudCA9IHRydWU7XG4gICAgICAgIH0gZWxzZSBpZiAocmVhZEFsaWFzKHN0YXRlKSkge1xuICAgICAgICAgIGhhc0NvbnRlbnQgPSB0cnVlO1xuXG4gICAgICAgICAgaWYgKHN0YXRlLnRhZyAhPT0gbnVsbCB8fCBzdGF0ZS5hbmNob3IgIT09IG51bGwpIHtcbiAgICAgICAgICAgIHJldHVybiB0aHJvd0Vycm9yKFxuICAgICAgICAgICAgICBzdGF0ZSxcbiAgICAgICAgICAgICAgXCJhbGlhcyBub2RlIHNob3VsZCBub3QgaGF2ZSBBbnkgcHJvcGVydGllc1wiLFxuICAgICAgICAgICAgKTtcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoXG4gICAgICAgICAgcmVhZFBsYWluU2NhbGFyKHN0YXRlLCBmbG93SW5kZW50LCBDT05URVhUX0ZMT1dfSU4gPT09IG5vZGVDb250ZXh0KVxuICAgICAgICApIHtcbiAgICAgICAgICBoYXNDb250ZW50ID0gdHJ1ZTtcblxuICAgICAgICAgIGlmIChzdGF0ZS50YWcgPT09IG51bGwpIHtcbiAgICAgICAgICAgIHN0YXRlLnRhZyA9IFwiP1wiO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIGlmIChzdGF0ZS5hbmNob3IgIT09IG51bGwgJiYgdHlwZW9mIHN0YXRlLmFuY2hvck1hcCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgIHN0YXRlLmFuY2hvck1hcFtzdGF0ZS5hbmNob3JdID0gc3RhdGUucmVzdWx0O1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpbmRlbnRTdGF0dXMgPT09IDApIHtcbiAgICAgIC8vIFNwZWNpYWwgY2FzZTogYmxvY2sgc2VxdWVuY2VzIGFyZSBhbGxvd2VkIHRvIGhhdmUgc2FtZSBpbmRlbnRhdGlvbiBsZXZlbCBhcyB0aGUgcGFyZW50LlxuICAgICAgLy8gaHR0cDovL3d3dy55YW1sLm9yZy9zcGVjLzEuMi9zcGVjLmh0bWwjaWQyNzk5Nzg0XG4gICAgICBoYXNDb250ZW50ID0gYWxsb3dCbG9ja0NvbGxlY3Rpb25zICYmXG4gICAgICAgIHJlYWRCbG9ja1NlcXVlbmNlKHN0YXRlLCBibG9ja0luZGVudCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKHN0YXRlLnRhZyAhPT0gbnVsbCAmJiBzdGF0ZS50YWcgIT09IFwiIVwiKSB7XG4gICAgaWYgKHN0YXRlLnRhZyA9PT0gXCI/XCIpIHtcbiAgICAgIGZvciAoXG4gICAgICAgIGxldCB0eXBlSW5kZXggPSAwLCB0eXBlUXVhbnRpdHkgPSBzdGF0ZS5pbXBsaWNpdFR5cGVzLmxlbmd0aDtcbiAgICAgICAgdHlwZUluZGV4IDwgdHlwZVF1YW50aXR5O1xuICAgICAgICB0eXBlSW5kZXgrK1xuICAgICAgKSB7XG4gICAgICAgIHR5cGUgPSBzdGF0ZS5pbXBsaWNpdFR5cGVzW3R5cGVJbmRleF07XG5cbiAgICAgICAgLy8gSW1wbGljaXQgcmVzb2x2aW5nIGlzIG5vdCBhbGxvd2VkIGZvciBub24tc2NhbGFyIHR5cGVzLCBhbmQgJz8nXG4gICAgICAgIC8vIG5vbi1zcGVjaWZpYyB0YWcgaXMgb25seSBhc3NpZ25lZCB0byBwbGFpbiBzY2FsYXJzLiBTbywgaXQgaXNuJ3RcbiAgICAgICAgLy8gbmVlZGVkIHRvIGNoZWNrIGZvciAna2luZCcgY29uZm9ybWl0eS5cblxuICAgICAgICBpZiAodHlwZS5yZXNvbHZlKHN0YXRlLnJlc3VsdCkpIHtcbiAgICAgICAgICAvLyBgc3RhdGUucmVzdWx0YCB1cGRhdGVkIGluIHJlc29sdmVyIGlmIG1hdGNoZWRcbiAgICAgICAgICBzdGF0ZS5yZXN1bHQgPSB0eXBlLmNvbnN0cnVjdChzdGF0ZS5yZXN1bHQpO1xuICAgICAgICAgIHN0YXRlLnRhZyA9IHR5cGUudGFnO1xuICAgICAgICAgIGlmIChzdGF0ZS5hbmNob3IgIT09IG51bGwgJiYgdHlwZW9mIHN0YXRlLmFuY2hvck1hcCAhPT0gXCJ1bmRlZmluZWRcIikge1xuICAgICAgICAgICAgc3RhdGUuYW5jaG9yTWFwW3N0YXRlLmFuY2hvcl0gPSBzdGF0ZS5yZXN1bHQ7XG4gICAgICAgICAgfVxuICAgICAgICAgIGJyZWFrO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChcbiAgICAgIF9oYXNPd25Qcm9wZXJ0eS5jYWxsKHN0YXRlLnR5cGVNYXBbc3RhdGUua2luZCB8fCBcImZhbGxiYWNrXCJdLCBzdGF0ZS50YWcpXG4gICAgKSB7XG4gICAgICB0eXBlID0gc3RhdGUudHlwZU1hcFtzdGF0ZS5raW5kIHx8IFwiZmFsbGJhY2tcIl1bc3RhdGUudGFnXTtcblxuICAgICAgaWYgKHN0YXRlLnJlc3VsdCAhPT0gbnVsbCAmJiB0eXBlLmtpbmQgIT09IHN0YXRlLmtpbmQpIHtcbiAgICAgICAgcmV0dXJuIHRocm93RXJyb3IoXG4gICAgICAgICAgc3RhdGUsXG4gICAgICAgICAgYHVuYWNjZXB0YWJsZSBub2RlIGtpbmQgZm9yICE8JHtzdGF0ZS50YWd9PiB0YWc7IGl0IHNob3VsZCBiZSBcIiR7dHlwZS5raW5kfVwiLCBub3QgXCIke3N0YXRlLmtpbmR9XCJgLFxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBpZiAoIXR5cGUucmVzb2x2ZShzdGF0ZS5yZXN1bHQpKSB7XG4gICAgICAgIC8vIGBzdGF0ZS5yZXN1bHRgIHVwZGF0ZWQgaW4gcmVzb2x2ZXIgaWYgbWF0Y2hlZFxuICAgICAgICByZXR1cm4gdGhyb3dFcnJvcihcbiAgICAgICAgICBzdGF0ZSxcbiAgICAgICAgICBgY2Fubm90IHJlc29sdmUgYSBub2RlIHdpdGggITwke3N0YXRlLnRhZ30+IGV4cGxpY2l0IHRhZ2AsXG4gICAgICAgICk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdGF0ZS5yZXN1bHQgPSB0eXBlLmNvbnN0cnVjdChzdGF0ZS5yZXN1bHQpO1xuICAgICAgICBpZiAoc3RhdGUuYW5jaG9yICE9PSBudWxsICYmIHR5cGVvZiBzdGF0ZS5hbmNob3JNYXAgIT09IFwidW5kZWZpbmVkXCIpIHtcbiAgICAgICAgICBzdGF0ZS5hbmNob3JNYXBbc3RhdGUuYW5jaG9yXSA9IHN0YXRlLnJlc3VsdDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSB7XG4gICAgICByZXR1cm4gdGhyb3dFcnJvcihzdGF0ZSwgYHVua25vd24gdGFnICE8JHtzdGF0ZS50YWd9PmApO1xuICAgIH1cbiAgfVxuXG4gIGlmIChzdGF0ZS5saXN0ZW5lciAmJiBzdGF0ZS5saXN0ZW5lciAhPT0gbnVsbCkge1xuICAgIHN0YXRlLmxpc3RlbmVyKFwiY2xvc2VcIiwgc3RhdGUpO1xuICB9XG4gIHJldHVybiBzdGF0ZS50YWcgIT09IG51bGwgfHwgc3RhdGUuYW5jaG9yICE9PSBudWxsIHx8IGhhc0NvbnRlbnQ7XG59XG5cbmZ1bmN0aW9uIHJlYWREb2N1bWVudChzdGF0ZTogTG9hZGVyU3RhdGUpOiB2b2lkIHtcbiAgY29uc3QgZG9jdW1lbnRTdGFydCA9IHN0YXRlLnBvc2l0aW9uO1xuICBsZXQgcG9zaXRpb246IG51bWJlcixcbiAgICBkaXJlY3RpdmVOYW1lOiBzdHJpbmcsXG4gICAgZGlyZWN0aXZlQXJnczogc3RyaW5nW10sXG4gICAgaGFzRGlyZWN0aXZlcyA9IGZhbHNlLFxuICAgIGNoOiBudW1iZXI7XG5cbiAgc3RhdGUudmVyc2lvbiA9IG51bGw7XG4gIHN0YXRlLmNoZWNrTGluZUJyZWFrcyA9IHN0YXRlLmxlZ2FjeTtcbiAgc3RhdGUudGFnTWFwID0ge307XG4gIHN0YXRlLmFuY2hvck1hcCA9IHt9O1xuXG4gIHdoaWxlICgoY2ggPSBzdGF0ZS5pbnB1dC5jaGFyQ29kZUF0KHN0YXRlLnBvc2l0aW9uKSkgIT09IDApIHtcbiAgICBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCAtMSk7XG5cbiAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24pO1xuXG4gICAgaWYgKHN0YXRlLmxpbmVJbmRlbnQgPiAwIHx8IGNoICE9PSAweDI1IC8qICUgKi8pIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIGhhc0RpcmVjdGl2ZXMgPSB0cnVlO1xuICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgICBwb3NpdGlvbiA9IHN0YXRlLnBvc2l0aW9uO1xuXG4gICAgd2hpbGUgKGNoICE9PSAwICYmICFpc1dzT3JFb2woY2gpKSB7XG4gICAgICBjaCA9IHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoKytzdGF0ZS5wb3NpdGlvbik7XG4gICAgfVxuXG4gICAgZGlyZWN0aXZlTmFtZSA9IHN0YXRlLmlucHV0LnNsaWNlKHBvc2l0aW9uLCBzdGF0ZS5wb3NpdGlvbik7XG4gICAgZGlyZWN0aXZlQXJncyA9IFtdO1xuXG4gICAgaWYgKGRpcmVjdGl2ZU5hbWUubGVuZ3RoIDwgMSkge1xuICAgICAgcmV0dXJuIHRocm93RXJyb3IoXG4gICAgICAgIHN0YXRlLFxuICAgICAgICBcImRpcmVjdGl2ZSBuYW1lIG11c3Qgbm90IGJlIGxlc3MgdGhhbiBvbmUgY2hhcmFjdGVyIGluIGxlbmd0aFwiLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICB3aGlsZSAoY2ggIT09IDApIHtcbiAgICAgIHdoaWxlIChpc1doaXRlU3BhY2UoY2gpKSB7XG4gICAgICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGNoID09PSAweDIzIC8qICMgKi8pIHtcbiAgICAgICAgZG8ge1xuICAgICAgICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgICAgICAgfSB3aGlsZSAoY2ggIT09IDAgJiYgIWlzRU9MKGNoKSk7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICBpZiAoaXNFT0woY2gpKSBicmVhaztcblxuICAgICAgcG9zaXRpb24gPSBzdGF0ZS5wb3NpdGlvbjtcblxuICAgICAgd2hpbGUgKGNoICE9PSAwICYmICFpc1dzT3JFb2woY2gpKSB7XG4gICAgICAgIGNoID0gc3RhdGUuaW5wdXQuY2hhckNvZGVBdCgrK3N0YXRlLnBvc2l0aW9uKTtcbiAgICAgIH1cblxuICAgICAgZGlyZWN0aXZlQXJncy5wdXNoKHN0YXRlLmlucHV0LnNsaWNlKHBvc2l0aW9uLCBzdGF0ZS5wb3NpdGlvbikpO1xuICAgIH1cblxuICAgIGlmIChjaCAhPT0gMCkgcmVhZExpbmVCcmVhayhzdGF0ZSk7XG5cbiAgICBpZiAoX2hhc093blByb3BlcnR5LmNhbGwoZGlyZWN0aXZlSGFuZGxlcnMsIGRpcmVjdGl2ZU5hbWUpKSB7XG4gICAgICBkaXJlY3RpdmVIYW5kbGVyc1tkaXJlY3RpdmVOYW1lXShzdGF0ZSwgZGlyZWN0aXZlTmFtZSwgLi4uZGlyZWN0aXZlQXJncyk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHRocm93V2FybmluZyhzdGF0ZSwgYHVua25vd24gZG9jdW1lbnQgZGlyZWN0aXZlIFwiJHtkaXJlY3RpdmVOYW1lfVwiYCk7XG4gICAgfVxuICB9XG5cbiAgc2tpcFNlcGFyYXRpb25TcGFjZShzdGF0ZSwgdHJ1ZSwgLTEpO1xuXG4gIGlmIChcbiAgICBzdGF0ZS5saW5lSW5kZW50ID09PSAwICYmXG4gICAgc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbikgPT09IDB4MmQgLyogLSAqLyAmJlxuICAgIHN0YXRlLmlucHV0LmNoYXJDb2RlQXQoc3RhdGUucG9zaXRpb24gKyAxKSA9PT0gMHgyZCAvKiAtICovICYmXG4gICAgc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbiArIDIpID09PSAweDJkIC8qIC0gKi9cbiAgKSB7XG4gICAgc3RhdGUucG9zaXRpb24gKz0gMztcbiAgICBza2lwU2VwYXJhdGlvblNwYWNlKHN0YXRlLCB0cnVlLCAtMSk7XG4gIH0gZWxzZSBpZiAoaGFzRGlyZWN0aXZlcykge1xuICAgIHJldHVybiB0aHJvd0Vycm9yKHN0YXRlLCBcImRpcmVjdGl2ZXMgZW5kIG1hcmsgaXMgZXhwZWN0ZWRcIik7XG4gIH1cblxuICBjb21wb3NlTm9kZShzdGF0ZSwgc3RhdGUubGluZUluZGVudCAtIDEsIENPTlRFWFRfQkxPQ0tfT1VULCBmYWxzZSwgdHJ1ZSk7XG4gIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIHRydWUsIC0xKTtcblxuICBpZiAoXG4gICAgc3RhdGUuY2hlY2tMaW5lQnJlYWtzICYmXG4gICAgUEFUVEVSTl9OT05fQVNDSUlfTElORV9CUkVBS1MudGVzdChcbiAgICAgIHN0YXRlLmlucHV0LnNsaWNlKGRvY3VtZW50U3RhcnQsIHN0YXRlLnBvc2l0aW9uKSxcbiAgICApXG4gICkge1xuICAgIHRocm93V2FybmluZyhzdGF0ZSwgXCJub24tQVNDSUkgbGluZSBicmVha3MgYXJlIGludGVycHJldGVkIGFzIGNvbnRlbnRcIik7XG4gIH1cblxuICBzdGF0ZS5kb2N1bWVudHMucHVzaChzdGF0ZS5yZXN1bHQpO1xuXG4gIGlmIChzdGF0ZS5wb3NpdGlvbiA9PT0gc3RhdGUubGluZVN0YXJ0ICYmIHRlc3REb2N1bWVudFNlcGFyYXRvcihzdGF0ZSkpIHtcbiAgICBpZiAoc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbikgPT09IDB4MmUgLyogLiAqLykge1xuICAgICAgc3RhdGUucG9zaXRpb24gKz0gMztcbiAgICAgIHNraXBTZXBhcmF0aW9uU3BhY2Uoc3RhdGUsIHRydWUsIC0xKTtcbiAgICB9XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgaWYgKHN0YXRlLnBvc2l0aW9uIDwgc3RhdGUubGVuZ3RoIC0gMSkge1xuICAgIHJldHVybiB0aHJvd0Vycm9yKFxuICAgICAgc3RhdGUsXG4gICAgICBcImVuZCBvZiB0aGUgc3RyZWFtIG9yIGEgZG9jdW1lbnQgc2VwYXJhdG9yIGlzIGV4cGVjdGVkXCIsXG4gICAgKTtcbiAgfSBlbHNlIHtcbiAgICByZXR1cm47XG4gIH1cbn1cblxuZnVuY3Rpb24gbG9hZERvY3VtZW50cyhpbnB1dDogc3RyaW5nLCBvcHRpb25zPzogTG9hZGVyU3RhdGVPcHRpb25zKTogdW5rbm93bltdIHtcbiAgaW5wdXQgPSBTdHJpbmcoaW5wdXQpO1xuICBvcHRpb25zID0gb3B0aW9ucyB8fCB7fTtcblxuICBpZiAoaW5wdXQubGVuZ3RoICE9PSAwKSB7XG4gICAgLy8gQWRkIHRhaWxpbmcgYFxcbmAgaWYgbm90IGV4aXN0c1xuICAgIGlmIChcbiAgICAgIGlucHV0LmNoYXJDb2RlQXQoaW5wdXQubGVuZ3RoIC0gMSkgIT09IDB4MGEgLyogTEYgKi8gJiZcbiAgICAgIGlucHV0LmNoYXJDb2RlQXQoaW5wdXQubGVuZ3RoIC0gMSkgIT09IDB4MGQgLyogQ1IgKi9cbiAgICApIHtcbiAgICAgIGlucHV0ICs9IFwiXFxuXCI7XG4gICAgfVxuXG4gICAgLy8gU3RyaXAgQk9NXG4gICAgaWYgKGlucHV0LmNoYXJDb2RlQXQoMCkgPT09IDB4ZmVmZikge1xuICAgICAgaW5wdXQgPSBpbnB1dC5zbGljZSgxKTtcbiAgICB9XG4gIH1cblxuICBjb25zdCBzdGF0ZSA9IG5ldyBMb2FkZXJTdGF0ZShpbnB1dCwgb3B0aW9ucyk7XG5cbiAgLy8gVXNlIDAgYXMgc3RyaW5nIHRlcm1pbmF0b3IuIFRoYXQgc2lnbmlmaWNhbnRseSBzaW1wbGlmaWVzIGJvdW5kcyBjaGVjay5cbiAgc3RhdGUuaW5wdXQgKz0gXCJcXDBcIjtcblxuICB3aGlsZSAoc3RhdGUuaW5wdXQuY2hhckNvZGVBdChzdGF0ZS5wb3NpdGlvbikgPT09IDB4MjAgLyogU3BhY2UgKi8pIHtcbiAgICBzdGF0ZS5saW5lSW5kZW50ICs9IDE7XG4gICAgc3RhdGUucG9zaXRpb24gKz0gMTtcbiAgfVxuXG4gIHdoaWxlIChzdGF0ZS5wb3NpdGlvbiA8IHN0YXRlLmxlbmd0aCAtIDEpIHtcbiAgICByZWFkRG9jdW1lbnQoc3RhdGUpO1xuICB9XG5cbiAgcmV0dXJuIHN0YXRlLmRvY3VtZW50cztcbn1cblxuZXhwb3J0IHR5cGUgQ2JGdW5jdGlvbiA9IChkb2M6IHVua25vd24pID0+IHZvaWQ7XG5mdW5jdGlvbiBpc0NiRnVuY3Rpb24oZm46IHVua25vd24pOiBmbiBpcyBDYkZ1bmN0aW9uIHtcbiAgcmV0dXJuIHR5cGVvZiBmbiA9PT0gXCJmdW5jdGlvblwiO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbG9hZEFsbDxUIGV4dGVuZHMgQ2JGdW5jdGlvbiB8IExvYWRlclN0YXRlT3B0aW9ucz4oXG4gIGlucHV0OiBzdHJpbmcsXG4gIGl0ZXJhdG9yT3JPcHRpb24/OiBULFxuICBvcHRpb25zPzogTG9hZGVyU3RhdGVPcHRpb25zLFxuKTogVCBleHRlbmRzIENiRnVuY3Rpb24gPyB2b2lkIDogdW5rbm93bltdIHtcbiAgaWYgKCFpc0NiRnVuY3Rpb24oaXRlcmF0b3JPck9wdGlvbikpIHtcbiAgICByZXR1cm4gbG9hZERvY3VtZW50cyhpbnB1dCwgaXRlcmF0b3JPck9wdGlvbiBhcyBMb2FkZXJTdGF0ZU9wdGlvbnMpIGFzIEFueTtcbiAgfVxuXG4gIGNvbnN0IGRvY3VtZW50cyA9IGxvYWREb2N1bWVudHMoaW5wdXQsIG9wdGlvbnMpO1xuICBjb25zdCBpdGVyYXRvciA9IGl0ZXJhdG9yT3JPcHRpb247XG4gIGZvciAobGV0IGluZGV4ID0gMCwgbGVuZ3RoID0gZG9jdW1lbnRzLmxlbmd0aDsgaW5kZXggPCBsZW5ndGg7IGluZGV4KyspIHtcbiAgICBpdGVyYXRvcihkb2N1bWVudHNbaW5kZXhdKTtcbiAgfVxuXG4gIHJldHVybiB2b2lkIDAgYXMgQW55O1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbG9hZChpbnB1dDogc3RyaW5nLCBvcHRpb25zPzogTG9hZGVyU3RhdGVPcHRpb25zKTogdW5rbm93biB7XG4gIGNvbnN0IGRvY3VtZW50cyA9IGxvYWREb2N1bWVudHMoaW5wdXQsIG9wdGlvbnMpO1xuXG4gIGlmIChkb2N1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgcmV0dXJuO1xuICB9XG4gIGlmIChkb2N1bWVudHMubGVuZ3RoID09PSAxKSB7XG4gICAgcmV0dXJuIGRvY3VtZW50c1swXTtcbiAgfVxuICB0aHJvdyBuZXcgWUFNTEVycm9yKFxuICAgIFwiZXhwZWN0ZWQgYSBzaW5nbGUgZG9jdW1lbnQgaW4gdGhlIHN0cmVhbSwgYnV0IGZvdW5kIG1vcmVcIixcbiAgKTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUErQixBQUEvQiw2QkFBK0I7QUFDL0IsRUFBb0YsQUFBcEYsa0ZBQW9GO0FBQ3BGLEVBQTBFLEFBQTFFLHdFQUEwRTtBQUMxRSxFQUEwRSxBQUExRSx3RUFBMEU7QUFFMUUsTUFBTSxHQUFHLFNBQVMsUUFBUSxDQUFhO0FBQ3ZD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