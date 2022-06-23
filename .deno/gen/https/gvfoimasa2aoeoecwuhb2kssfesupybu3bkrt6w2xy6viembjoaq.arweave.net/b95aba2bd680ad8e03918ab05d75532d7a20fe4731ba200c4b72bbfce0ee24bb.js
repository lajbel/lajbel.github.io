import { CHAR_BACKWARD_SLASH, CHAR_COLON, CHAR_DOT, CHAR_QUESTION_MARK } from "./_constants.ts";
import { _format, assertPath, encodeWhitespace, isPathSeparator, isWindowsDeviceRoot, normalizeString } from "./_util.ts";
import { assert } from "../_util/assert.ts";
export const sep = "\\";
export const delimiter = ";";
/**
 * Resolves path segments into a `path`
 * @param pathSegments to process to path
 */ export function resolve(...pathSegments) {
    let resolvedDevice = "";
    let resolvedTail = "";
    let resolvedAbsolute = false;
    for(let i = pathSegments.length - 1; i >= -1; i--){
        let path;
        if (i >= 0) {
            path = pathSegments[i];
        } else if (!resolvedDevice) {
            if (globalThis.Deno == null) {
                throw new TypeError("Resolved a drive-letter-less path without a CWD.");
            }
            path = Deno.cwd();
        } else {
            if (globalThis.Deno == null) {
                throw new TypeError("Resolved a relative path without a CWD.");
            }
            // Windows has the concept of drive-specific current working
            // directories. If we've resolved a drive letter but not yet an
            // absolute path, get cwd for that drive, or the process cwd if
            // the drive cwd is not available. We're sure the device is not
            // a UNC path at this points, because UNC paths are always absolute.
            path = Deno.env.get(`=${resolvedDevice}`) || Deno.cwd();
            // Verify that a cwd was found and that it actually points
            // to our drive. If not, default to the drive's root.
            if (path === undefined || path.slice(0, 3).toLowerCase() !== `${resolvedDevice.toLowerCase()}\\`) {
                path = `${resolvedDevice}\\`;
            }
        }
        assertPath(path);
        const len = path.length;
        // Skip empty entries
        if (len === 0) continue;
        let rootEnd = 0;
        let device = "";
        let isAbsolute = false;
        const code = path.charCodeAt(0);
        // Try to match a root
        if (len > 1) {
            if (isPathSeparator(code)) {
                // Possible UNC root
                // If we started with a separator, we know we at least have an
                // absolute path of some kind (UNC or otherwise)
                isAbsolute = true;
                if (isPathSeparator(path.charCodeAt(1))) {
                    // Matched double path separator at beginning
                    let j = 2;
                    let last = j;
                    // Match 1 or more non-path separators
                    for(; j < len; ++j){
                        if (isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        const firstPart = path.slice(last, j);
                        // Matched!
                        last = j;
                        // Match 1 or more path separators
                        for(; j < len; ++j){
                            if (!isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j < len && j !== last) {
                            // Matched!
                            last = j;
                            // Match 1 or more non-path separators
                            for(; j < len; ++j){
                                if (isPathSeparator(path.charCodeAt(j))) break;
                            }
                            if (j === len) {
                                // We matched a UNC root only
                                device = `\\\\${firstPart}\\${path.slice(last)}`;
                                rootEnd = j;
                            } else if (j !== last) {
                                // We matched a UNC root with leftovers
                                device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                                rootEnd = j;
                            }
                        }
                    }
                } else {
                    rootEnd = 1;
                }
            } else if (isWindowsDeviceRoot(code)) {
                // Possible device root
                if (path.charCodeAt(1) === CHAR_COLON) {
                    device = path.slice(0, 2);
                    rootEnd = 2;
                    if (len > 2) {
                        if (isPathSeparator(path.charCodeAt(2))) {
                            // Treat separator following drive name as an absolute path
                            // indicator
                            isAbsolute = true;
                            rootEnd = 3;
                        }
                    }
                }
            }
        } else if (isPathSeparator(code)) {
            // `path` contains just a path separator
            rootEnd = 1;
            isAbsolute = true;
        }
        if (device.length > 0 && resolvedDevice.length > 0 && device.toLowerCase() !== resolvedDevice.toLowerCase()) {
            continue;
        }
        if (resolvedDevice.length === 0 && device.length > 0) {
            resolvedDevice = device;
        }
        if (!resolvedAbsolute) {
            resolvedTail = `${path.slice(rootEnd)}\\${resolvedTail}`;
            resolvedAbsolute = isAbsolute;
        }
        if (resolvedAbsolute && resolvedDevice.length > 0) break;
    }
    // At this point the path should be resolved to a full absolute path,
    // but handle relative paths to be safe (might happen when process.cwd()
    // fails)
    // Normalize the tail path
    resolvedTail = normalizeString(resolvedTail, !resolvedAbsolute, "\\", isPathSeparator);
    return resolvedDevice + (resolvedAbsolute ? "\\" : "") + resolvedTail || ".";
}
/**
 * Normalizes a `path`
 * @param path to normalize
 */ export function normalize(path) {
    assertPath(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = 0;
    let device;
    let isAbsolute = false;
    const code = path.charCodeAt(0);
    // Try to match a root
    if (len > 1) {
        if (isPathSeparator(code)) {
            // Possible UNC root
            // If we started with a separator, we know we at least have an absolute
            // path of some kind (UNC or otherwise)
            isAbsolute = true;
            if (isPathSeparator(path.charCodeAt(1))) {
                // Matched double path separator at beginning
                let j = 2;
                let last = j;
                // Match 1 or more non-path separators
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    const firstPart = path.slice(last, j);
                    // Matched!
                    last = j;
                    // Match 1 or more path separators
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        // Matched!
                        last = j;
                        // Match 1 or more non-path separators
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            // We matched a UNC root only
                            // Return the normalized version of the UNC root since there
                            // is nothing left to process
                            return `\\\\${firstPart}\\${path.slice(last)}\\`;
                        } else if (j !== last) {
                            // We matched a UNC root with leftovers
                            device = `\\\\${firstPart}\\${path.slice(last, j)}`;
                            rootEnd = j;
                        }
                    }
                }
            } else {
                rootEnd = 1;
            }
        } else if (isWindowsDeviceRoot(code)) {
            // Possible device root
            if (path.charCodeAt(1) === CHAR_COLON) {
                device = path.slice(0, 2);
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) {
                        // Treat separator following drive name as an absolute path
                        // indicator
                        isAbsolute = true;
                        rootEnd = 3;
                    }
                }
            }
        }
    } else if (isPathSeparator(code)) {
        // `path` contains just a path separator, exit early to avoid unnecessary
        // work
        return "\\";
    }
    let tail;
    if (rootEnd < len) {
        tail = normalizeString(path.slice(rootEnd), !isAbsolute, "\\", isPathSeparator);
    } else {
        tail = "";
    }
    if (tail.length === 0 && !isAbsolute) tail = ".";
    if (tail.length > 0 && isPathSeparator(path.charCodeAt(len - 1))) {
        tail += "\\";
    }
    if (device === undefined) {
        if (isAbsolute) {
            if (tail.length > 0) return `\\${tail}`;
            else return "\\";
        } else if (tail.length > 0) {
            return tail;
        } else {
            return "";
        }
    } else if (isAbsolute) {
        if (tail.length > 0) return `${device}\\${tail}`;
        else return `${device}\\`;
    } else if (tail.length > 0) {
        return device + tail;
    } else {
        return device;
    }
}
/**
 * Verifies whether path is absolute
 * @param path to verify
 */ export function isAbsolute(path) {
    assertPath(path);
    const len = path.length;
    if (len === 0) return false;
    const code = path.charCodeAt(0);
    if (isPathSeparator(code)) {
        return true;
    } else if (isWindowsDeviceRoot(code)) {
        // Possible device root
        if (len > 2 && path.charCodeAt(1) === CHAR_COLON) {
            if (isPathSeparator(path.charCodeAt(2))) return true;
        }
    }
    return false;
}
/**
 * Join all given a sequence of `paths`,then normalizes the resulting path.
 * @param paths to be joined and normalized
 */ export function join(...paths) {
    const pathsCount = paths.length;
    if (pathsCount === 0) return ".";
    let joined;
    let firstPart = null;
    for(let i = 0; i < pathsCount; ++i){
        const path = paths[i];
        assertPath(path);
        if (path.length > 0) {
            if (joined === undefined) joined = firstPart = path;
            else joined += `\\${path}`;
        }
    }
    if (joined === undefined) return ".";
    // Make sure that the joined path doesn't start with two slashes, because
    // normalize() will mistake it for an UNC path then.
    //
    // This step is skipped when it is very clear that the user actually
    // intended to point at an UNC path. This is assumed when the first
    // non-empty string arguments starts with exactly two slashes followed by
    // at least one more non-slash character.
    //
    // Note that for normalize() to treat a path as an UNC path it needs to
    // have at least 2 components, so we don't filter for that here.
    // This means that the user can use join to construct UNC paths from
    // a server name and a share name; for example:
    //   path.join('//server', 'share') -> '\\\\server\\share\\')
    let needsReplace = true;
    let slashCount = 0;
    assert(firstPart != null);
    if (isPathSeparator(firstPart.charCodeAt(0))) {
        ++slashCount;
        const firstLen = firstPart.length;
        if (firstLen > 1) {
            if (isPathSeparator(firstPart.charCodeAt(1))) {
                ++slashCount;
                if (firstLen > 2) {
                    if (isPathSeparator(firstPart.charCodeAt(2))) ++slashCount;
                    else {
                        // We matched a UNC path in the first part
                        needsReplace = false;
                    }
                }
            }
        }
    }
    if (needsReplace) {
        // Find any more consecutive slashes we need to replace
        for(; slashCount < joined.length; ++slashCount){
            if (!isPathSeparator(joined.charCodeAt(slashCount))) break;
        }
        // Replace the slashes if needed
        if (slashCount >= 2) joined = `\\${joined.slice(slashCount)}`;
    }
    return normalize(joined);
}
/**
 * It will solve the relative path from `from` to `to`, for instance:
 *  from = 'C:\\orandea\\test\\aaa'
 *  to = 'C:\\orandea\\impl\\bbb'
 * The output of the function should be: '..\\..\\impl\\bbb'
 * @param from relative path
 * @param to relative path
 */ export function relative(from, to) {
    assertPath(from);
    assertPath(to);
    if (from === to) return "";
    const fromOrig = resolve(from);
    const toOrig = resolve(to);
    if (fromOrig === toOrig) return "";
    from = fromOrig.toLowerCase();
    to = toOrig.toLowerCase();
    if (from === to) return "";
    // Trim any leading backslashes
    let fromStart = 0;
    let fromEnd = from.length;
    for(; fromStart < fromEnd; ++fromStart){
        if (from.charCodeAt(fromStart) !== CHAR_BACKWARD_SLASH) break;
    }
    // Trim trailing backslashes (applicable to UNC paths only)
    for(; fromEnd - 1 > fromStart; --fromEnd){
        if (from.charCodeAt(fromEnd - 1) !== CHAR_BACKWARD_SLASH) break;
    }
    const fromLen = fromEnd - fromStart;
    // Trim any leading backslashes
    let toStart = 0;
    let toEnd = to.length;
    for(; toStart < toEnd; ++toStart){
        if (to.charCodeAt(toStart) !== CHAR_BACKWARD_SLASH) break;
    }
    // Trim trailing backslashes (applicable to UNC paths only)
    for(; toEnd - 1 > toStart; --toEnd){
        if (to.charCodeAt(toEnd - 1) !== CHAR_BACKWARD_SLASH) break;
    }
    const toLen = toEnd - toStart;
    // Compare paths to find the longest common path from root
    const length = fromLen < toLen ? fromLen : toLen;
    let lastCommonSep = -1;
    let i = 0;
    for(; i <= length; ++i){
        if (i === length) {
            if (toLen > length) {
                if (to.charCodeAt(toStart + i) === CHAR_BACKWARD_SLASH) {
                    // We get here if `from` is the exact base path for `to`.
                    // For example: from='C:\\foo\\bar'; to='C:\\foo\\bar\\baz'
                    return toOrig.slice(toStart + i + 1);
                } else if (i === 2) {
                    // We get here if `from` is the device root.
                    // For example: from='C:\\'; to='C:\\foo'
                    return toOrig.slice(toStart + i);
                }
            }
            if (fromLen > length) {
                if (from.charCodeAt(fromStart + i) === CHAR_BACKWARD_SLASH) {
                    // We get here if `to` is the exact base path for `from`.
                    // For example: from='C:\\foo\\bar'; to='C:\\foo'
                    lastCommonSep = i;
                } else if (i === 2) {
                    // We get here if `to` is the device root.
                    // For example: from='C:\\foo\\bar'; to='C:\\'
                    lastCommonSep = 3;
                }
            }
            break;
        }
        const fromCode = from.charCodeAt(fromStart + i);
        const toCode = to.charCodeAt(toStart + i);
        if (fromCode !== toCode) break;
        else if (fromCode === CHAR_BACKWARD_SLASH) lastCommonSep = i;
    }
    // We found a mismatch before the first common path separator was seen, so
    // return the original `to`.
    if (i !== length && lastCommonSep === -1) {
        return toOrig;
    }
    let out = "";
    if (lastCommonSep === -1) lastCommonSep = 0;
    // Generate the relative path based on the path difference between `to` and
    // `from`
    for(i = fromStart + lastCommonSep + 1; i <= fromEnd; ++i){
        if (i === fromEnd || from.charCodeAt(i) === CHAR_BACKWARD_SLASH) {
            if (out.length === 0) out += "..";
            else out += "\\..";
        }
    }
    // Lastly, append the rest of the destination (`to`) path that comes after
    // the common path parts
    if (out.length > 0) {
        return out + toOrig.slice(toStart + lastCommonSep, toEnd);
    } else {
        toStart += lastCommonSep;
        if (toOrig.charCodeAt(toStart) === CHAR_BACKWARD_SLASH) ++toStart;
        return toOrig.slice(toStart, toEnd);
    }
}
/**
 * Resolves path to a namespace path
 * @param path to resolve to namespace
 */ export function toNamespacedPath(path) {
    // Note: this will *probably* throw somewhere.
    if (typeof path !== "string") return path;
    if (path.length === 0) return "";
    const resolvedPath = resolve(path);
    if (resolvedPath.length >= 3) {
        if (resolvedPath.charCodeAt(0) === CHAR_BACKWARD_SLASH) {
            // Possible UNC root
            if (resolvedPath.charCodeAt(1) === CHAR_BACKWARD_SLASH) {
                const code = resolvedPath.charCodeAt(2);
                if (code !== CHAR_QUESTION_MARK && code !== CHAR_DOT) {
                    // Matched non-long UNC root, convert the path to a long UNC path
                    return `\\\\?\\UNC\\${resolvedPath.slice(2)}`;
                }
            }
        } else if (isWindowsDeviceRoot(resolvedPath.charCodeAt(0))) {
            // Possible device root
            if (resolvedPath.charCodeAt(1) === CHAR_COLON && resolvedPath.charCodeAt(2) === CHAR_BACKWARD_SLASH) {
                // Matched device root, convert the path to a long UNC path
                return `\\\\?\\${resolvedPath}`;
            }
        }
    }
    return path;
}
/**
 * Return the directory name of a `path`.
 * @param path to determine name for
 */ export function dirname(path) {
    assertPath(path);
    const len = path.length;
    if (len === 0) return ".";
    let rootEnd = -1;
    let end = -1;
    let matchedSlash = true;
    let offset = 0;
    const code = path.charCodeAt(0);
    // Try to match a root
    if (len > 1) {
        if (isPathSeparator(code)) {
            // Possible UNC root
            rootEnd = offset = 1;
            if (isPathSeparator(path.charCodeAt(1))) {
                // Matched double path separator at beginning
                let j = 2;
                let last = j;
                // Match 1 or more non-path separators
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    // Matched!
                    last = j;
                    // Match 1 or more path separators
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        // Matched!
                        last = j;
                        // Match 1 or more non-path separators
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            // We matched a UNC root only
                            return path;
                        }
                        if (j !== last) {
                            // We matched a UNC root with leftovers
                            // Offset by 1 to include the separator after the UNC root to
                            // treat it as a "normal root" on top of a (UNC) root
                            rootEnd = offset = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot(code)) {
            // Possible device root
            if (path.charCodeAt(1) === CHAR_COLON) {
                rootEnd = offset = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) rootEnd = offset = 3;
                }
            }
        }
    } else if (isPathSeparator(code)) {
        // `path` contains just a path separator, exit early to avoid
        // unnecessary work
        return path;
    }
    for(let i = len - 1; i >= offset; --i){
        if (isPathSeparator(path.charCodeAt(i))) {
            if (!matchedSlash) {
                end = i;
                break;
            }
        } else {
            // We saw the first non-path separator
            matchedSlash = false;
        }
    }
    if (end === -1) {
        if (rootEnd === -1) return ".";
        else end = rootEnd;
    }
    return path.slice(0, end);
}
/**
 * Return the last portion of a `path`. Trailing directory separators are ignored.
 * @param path to process
 * @param ext of path directory
 */ export function basename(path, ext = "") {
    if (ext !== undefined && typeof ext !== "string") {
        throw new TypeError('"ext" argument must be a string');
    }
    assertPath(path);
    let start = 0;
    let end = -1;
    let matchedSlash = true;
    let i;
    // Check for a drive letter prefix so as not to mistake the following
    // path separator as an extra separator at the end of the path that can be
    // disregarded
    if (path.length >= 2) {
        const drive = path.charCodeAt(0);
        if (isWindowsDeviceRoot(drive)) {
            if (path.charCodeAt(1) === CHAR_COLON) start = 2;
        }
    }
    if (ext !== undefined && ext.length > 0 && ext.length <= path.length) {
        if (ext.length === path.length && ext === path) return "";
        let extIdx = ext.length - 1;
        let firstNonSlashEnd = -1;
        for(i = path.length - 1; i >= start; --i){
            const code = path.charCodeAt(i);
            if (isPathSeparator(code)) {
                // If we reached a path separator that was not part of a set of path
                // separators at the end of the string, stop now
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else {
                if (firstNonSlashEnd === -1) {
                    // We saw the first non-path separator, remember this index in case
                    // we need it if the extension ends up not matching
                    matchedSlash = false;
                    firstNonSlashEnd = i + 1;
                }
                if (extIdx >= 0) {
                    // Try to match the explicit extension
                    if (code === ext.charCodeAt(extIdx)) {
                        if (--extIdx === -1) {
                            // We matched the extension, so mark this as the end of our path
                            // component
                            end = i;
                        }
                    } else {
                        // Extension does not match, so our result is the entire path
                        // component
                        extIdx = -1;
                        end = firstNonSlashEnd;
                    }
                }
            }
        }
        if (start === end) end = firstNonSlashEnd;
        else if (end === -1) end = path.length;
        return path.slice(start, end);
    } else {
        for(i = path.length - 1; i >= start; --i){
            if (isPathSeparator(path.charCodeAt(i))) {
                // If we reached a path separator that was not part of a set of path
                // separators at the end of the string, stop now
                if (!matchedSlash) {
                    start = i + 1;
                    break;
                }
            } else if (end === -1) {
                // We saw the first non-path separator, mark this as the end of our
                // path component
                matchedSlash = false;
                end = i + 1;
            }
        }
        if (end === -1) return "";
        return path.slice(start, end);
    }
}
/**
 * Return the extension of the `path`.
 * @param path with extension
 */ export function extname(path) {
    assertPath(path);
    let start = 0;
    let startDot = -1;
    let startPart = 0;
    let end = -1;
    let matchedSlash = true;
    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    let preDotState = 0;
    // Check for a drive letter prefix so as not to mistake the following
    // path separator as an extra separator at the end of the path that can be
    // disregarded
    if (path.length >= 2 && path.charCodeAt(1) === CHAR_COLON && isWindowsDeviceRoot(path.charCodeAt(0))) {
        start = startPart = 2;
    }
    for(let i = path.length - 1; i >= start; --i){
        const code = path.charCodeAt(i);
        if (isPathSeparator(code)) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            // We saw the first non-path separator, mark this as the end of our
            // extension
            matchedSlash = false;
            end = i + 1;
        }
        if (code === CHAR_DOT) {
            // If this is our first dot, mark it as the start of our extension
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            // We saw a non-dot and non-path separator before our dot, so we should
            // have a good chance at having a non-empty extension
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || // We saw a non-dot character immediately before the dot
    preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
    (preDotState === 1 && startDot === end - 1 && startDot === startPart + 1)) {
        return "";
    }
    return path.slice(startDot, end);
}
/**
 * Generate a path from `FormatInputPathObject` object.
 * @param pathObject with path
 */ export function format(pathObject) {
    if (pathObject === null || typeof pathObject !== "object") {
        throw new TypeError(`The "pathObject" argument must be of type Object. Received type ${typeof pathObject}`);
    }
    return _format("\\", pathObject);
}
/**
 * Return a `ParsedPath` object of the `path`.
 * @param path to process
 */ export function parse(path) {
    assertPath(path);
    const ret = {
        root: "",
        dir: "",
        base: "",
        ext: "",
        name: ""
    };
    const len = path.length;
    if (len === 0) return ret;
    let rootEnd = 0;
    let code = path.charCodeAt(0);
    // Try to match a root
    if (len > 1) {
        if (isPathSeparator(code)) {
            // Possible UNC root
            rootEnd = 1;
            if (isPathSeparator(path.charCodeAt(1))) {
                // Matched double path separator at beginning
                let j = 2;
                let last = j;
                // Match 1 or more non-path separators
                for(; j < len; ++j){
                    if (isPathSeparator(path.charCodeAt(j))) break;
                }
                if (j < len && j !== last) {
                    // Matched!
                    last = j;
                    // Match 1 or more path separators
                    for(; j < len; ++j){
                        if (!isPathSeparator(path.charCodeAt(j))) break;
                    }
                    if (j < len && j !== last) {
                        // Matched!
                        last = j;
                        // Match 1 or more non-path separators
                        for(; j < len; ++j){
                            if (isPathSeparator(path.charCodeAt(j))) break;
                        }
                        if (j === len) {
                            // We matched a UNC root only
                            rootEnd = j;
                        } else if (j !== last) {
                            // We matched a UNC root with leftovers
                            rootEnd = j + 1;
                        }
                    }
                }
            }
        } else if (isWindowsDeviceRoot(code)) {
            // Possible device root
            if (path.charCodeAt(1) === CHAR_COLON) {
                rootEnd = 2;
                if (len > 2) {
                    if (isPathSeparator(path.charCodeAt(2))) {
                        if (len === 3) {
                            // `path` contains just a drive root, exit early to avoid
                            // unnecessary work
                            ret.root = ret.dir = path;
                            return ret;
                        }
                        rootEnd = 3;
                    }
                } else {
                    // `path` contains just a drive root, exit early to avoid
                    // unnecessary work
                    ret.root = ret.dir = path;
                    return ret;
                }
            }
        }
    } else if (isPathSeparator(code)) {
        // `path` contains just a path separator, exit early to avoid
        // unnecessary work
        ret.root = ret.dir = path;
        return ret;
    }
    if (rootEnd > 0) ret.root = path.slice(0, rootEnd);
    let startDot = -1;
    let startPart = rootEnd;
    let end = -1;
    let matchedSlash = true;
    let i = path.length - 1;
    // Track the state of characters (if any) we see before our first dot and
    // after any path separator we find
    let preDotState = 0;
    // Get non-dir info
    for(; i >= rootEnd; --i){
        code = path.charCodeAt(i);
        if (isPathSeparator(code)) {
            // If we reached a path separator that was not part of a set of path
            // separators at the end of the string, stop now
            if (!matchedSlash) {
                startPart = i + 1;
                break;
            }
            continue;
        }
        if (end === -1) {
            // We saw the first non-path separator, mark this as the end of our
            // extension
            matchedSlash = false;
            end = i + 1;
        }
        if (code === CHAR_DOT) {
            // If this is our first dot, mark it as the start of our extension
            if (startDot === -1) startDot = i;
            else if (preDotState !== 1) preDotState = 1;
        } else if (startDot !== -1) {
            // We saw a non-dot and non-path separator before our dot, so we should
            // have a good chance at having a non-empty extension
            preDotState = -1;
        }
    }
    if (startDot === -1 || end === -1 || // We saw a non-dot character immediately before the dot
    preDotState === 0 || // The (right-most) trimmed path component is exactly '..'
    (preDotState === 1 && startDot === end - 1 && startDot === startPart + 1)) {
        if (end !== -1) {
            ret.base = ret.name = path.slice(startPart, end);
        }
    } else {
        ret.name = path.slice(startPart, startDot);
        ret.base = path.slice(startPart, end);
        ret.ext = path.slice(startDot, end);
    }
    // If the directory is the root, use the entire root as the `dir` including
    // the trailing slash if any (`C:\abc` -> `C:\`). Otherwise, strip out the
    // trailing slash (`C:\abc\def` -> `C:\abc`).
    if (startPart > 0 && startPart !== rootEnd) {
        ret.dir = path.slice(0, startPart - 1);
    } else ret.dir = ret.root;
    return ret;
}
/**
 * Converts a file URL to a path string.
 *
 *      fromFileUrl("file:///home/foo"); // "\\home\\foo"
 *      fromFileUrl("file:///C:/Users/foo"); // "C:\\Users\\foo"
 *      fromFileUrl("file://localhost/home/foo"); // "\\\\localhost\\home\\foo"
 * @param url of a file URL
 */ export function fromFileUrl(url) {
    url = url instanceof URL ? url : new URL(url);
    if (url.protocol != "file:") {
        throw new TypeError("Must be a file URL.");
    }
    let path = decodeURIComponent(url.pathname.replace(/\//g, "\\").replace(/%(?![0-9A-Fa-f]{2})/g, "%25")).replace(/^\\*([A-Za-z]:)(\\|$)/, "$1\\");
    if (url.hostname != "") {
        // Note: The `URL` implementation guarantees that the drive letter and
        // hostname are mutually exclusive. Otherwise it would not have been valid
        // to append the hostname and path like this.
        path = `\\\\${url.hostname}${path}`;
    }
    return path;
}
/**
 * Converts a path string to a file URL.
 *
 *      toFileUrl("\\home\\foo"); // new URL("file:///home/foo")
 *      toFileUrl("C:\\Users\\foo"); // new URL("file:///C:/Users/foo")
 *      toFileUrl("\\\\127.0.0.1\\home\\foo"); // new URL("file://127.0.0.1/home/foo")
 * @param path to convert to file URL
 */ export function toFileUrl(path) {
    if (!isAbsolute(path)) {
        throw new TypeError("Must be an absolute path.");
    }
    const [, hostname, pathname] = path.match(/^(?:[/\\]{2}([^/\\]+)(?=[/\\](?:[^/\\]|$)))?(.*)/);
    const url = new URL("file:///");
    url.pathname = encodeWhitespace(pathname.replace(/%/g, "%25"));
    if (hostname != null && hostname != "localhost") {
        url.hostname = hostname;
        if (!url.hostname) {
            throw new TypeError("Invalid hostname.");
        }
    }
    return url;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZ3Zmb2ltYXNhMmFvZW9lY3d1aGIya3NzZmVzdXB5YnUzYmtydDZ3Mnh5NnZpZW1iam9hcS5hcndlYXZlLm5ldC9OVXJrTUJJR2dPSTRnclVPSFNwU0tTVkg0RFRZVlJuNjJyNDlWQkdCUzRFL3BhdGgvd2luMzIudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IHRoZSBCcm93c2VyaWZ5IGF1dGhvcnMuIE1JVCBMaWNlbnNlLlxuLy8gUG9ydGVkIGZyb20gaHR0cHM6Ly9naXRodWIuY29tL2Jyb3dzZXJpZnkvcGF0aC1icm93c2VyaWZ5L1xuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbXBvcnQgdHlwZSB7IEZvcm1hdElucHV0UGF0aE9iamVjdCwgUGFyc2VkUGF0aCB9IGZyb20gXCIuL19pbnRlcmZhY2UudHNcIjtcbmltcG9ydCB7XG4gIENIQVJfQkFDS1dBUkRfU0xBU0gsXG4gIENIQVJfQ09MT04sXG4gIENIQVJfRE9ULFxuICBDSEFSX1FVRVNUSU9OX01BUkssXG59IGZyb20gXCIuL19jb25zdGFudHMudHNcIjtcblxuaW1wb3J0IHtcbiAgX2Zvcm1hdCxcbiAgYXNzZXJ0UGF0aCxcbiAgZW5jb2RlV2hpdGVzcGFjZSxcbiAgaXNQYXRoU2VwYXJhdG9yLFxuICBpc1dpbmRvd3NEZXZpY2VSb290LFxuICBub3JtYWxpemVTdHJpbmcsXG59IGZyb20gXCIuL191dGlsLnRzXCI7XG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi4vX3V0aWwvYXNzZXJ0LnRzXCI7XG5cbmV4cG9ydCBjb25zdCBzZXAgPSBcIlxcXFxcIjtcbmV4cG9ydCBjb25zdCBkZWxpbWl0ZXIgPSBcIjtcIjtcblxuLyoqXG4gKiBSZXNvbHZlcyBwYXRoIHNlZ21lbnRzIGludG8gYSBgcGF0aGBcbiAqIEBwYXJhbSBwYXRoU2VnbWVudHMgdG8gcHJvY2VzcyB0byBwYXRoXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZXNvbHZlKC4uLnBhdGhTZWdtZW50czogc3RyaW5nW10pOiBzdHJpbmcge1xuICBsZXQgcmVzb2x2ZWREZXZpY2UgPSBcIlwiO1xuICBsZXQgcmVzb2x2ZWRUYWlsID0gXCJcIjtcbiAgbGV0IHJlc29sdmVkQWJzb2x1dGUgPSBmYWxzZTtcblxuICBmb3IgKGxldCBpID0gcGF0aFNlZ21lbnRzLmxlbmd0aCAtIDE7IGkgPj0gLTE7IGktLSkge1xuICAgIGxldCBwYXRoOiBzdHJpbmc7XG4gICAgaWYgKGkgPj0gMCkge1xuICAgICAgcGF0aCA9IHBhdGhTZWdtZW50c1tpXTtcbiAgICB9IGVsc2UgaWYgKCFyZXNvbHZlZERldmljZSkge1xuICAgICAgaWYgKGdsb2JhbFRoaXMuRGVubyA9PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJSZXNvbHZlZCBhIGRyaXZlLWxldHRlci1sZXNzIHBhdGggd2l0aG91dCBhIENXRC5cIik7XG4gICAgICB9XG4gICAgICBwYXRoID0gRGVuby5jd2QoKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGdsb2JhbFRoaXMuRGVubyA9PSBudWxsKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJSZXNvbHZlZCBhIHJlbGF0aXZlIHBhdGggd2l0aG91dCBhIENXRC5cIik7XG4gICAgICB9XG4gICAgICAvLyBXaW5kb3dzIGhhcyB0aGUgY29uY2VwdCBvZiBkcml2ZS1zcGVjaWZpYyBjdXJyZW50IHdvcmtpbmdcbiAgICAgIC8vIGRpcmVjdG9yaWVzLiBJZiB3ZSd2ZSByZXNvbHZlZCBhIGRyaXZlIGxldHRlciBidXQgbm90IHlldCBhblxuICAgICAgLy8gYWJzb2x1dGUgcGF0aCwgZ2V0IGN3ZCBmb3IgdGhhdCBkcml2ZSwgb3IgdGhlIHByb2Nlc3MgY3dkIGlmXG4gICAgICAvLyB0aGUgZHJpdmUgY3dkIGlzIG5vdCBhdmFpbGFibGUuIFdlJ3JlIHN1cmUgdGhlIGRldmljZSBpcyBub3RcbiAgICAgIC8vIGEgVU5DIHBhdGggYXQgdGhpcyBwb2ludHMsIGJlY2F1c2UgVU5DIHBhdGhzIGFyZSBhbHdheXMgYWJzb2x1dGUuXG4gICAgICBwYXRoID0gRGVuby5lbnYuZ2V0KGA9JHtyZXNvbHZlZERldmljZX1gKSB8fCBEZW5vLmN3ZCgpO1xuXG4gICAgICAvLyBWZXJpZnkgdGhhdCBhIGN3ZCB3YXMgZm91bmQgYW5kIHRoYXQgaXQgYWN0dWFsbHkgcG9pbnRzXG4gICAgICAvLyB0byBvdXIgZHJpdmUuIElmIG5vdCwgZGVmYXVsdCB0byB0aGUgZHJpdmUncyByb290LlxuICAgICAgaWYgKFxuICAgICAgICBwYXRoID09PSB1bmRlZmluZWQgfHxcbiAgICAgICAgcGF0aC5zbGljZSgwLCAzKS50b0xvd2VyQ2FzZSgpICE9PSBgJHtyZXNvbHZlZERldmljZS50b0xvd2VyQ2FzZSgpfVxcXFxgXG4gICAgICApIHtcbiAgICAgICAgcGF0aCA9IGAke3Jlc29sdmVkRGV2aWNlfVxcXFxgO1xuICAgICAgfVxuICAgIH1cblxuICAgIGFzc2VydFBhdGgocGF0aCk7XG5cbiAgICBjb25zdCBsZW4gPSBwYXRoLmxlbmd0aDtcblxuICAgIC8vIFNraXAgZW1wdHkgZW50cmllc1xuICAgIGlmIChsZW4gPT09IDApIGNvbnRpbnVlO1xuXG4gICAgbGV0IHJvb3RFbmQgPSAwO1xuICAgIGxldCBkZXZpY2UgPSBcIlwiO1xuICAgIGxldCBpc0Fic29sdXRlID0gZmFsc2U7XG4gICAgY29uc3QgY29kZSA9IHBhdGguY2hhckNvZGVBdCgwKTtcblxuICAgIC8vIFRyeSB0byBtYXRjaCBhIHJvb3RcbiAgICBpZiAobGVuID4gMSkge1xuICAgICAgaWYgKGlzUGF0aFNlcGFyYXRvcihjb2RlKSkge1xuICAgICAgICAvLyBQb3NzaWJsZSBVTkMgcm9vdFxuXG4gICAgICAgIC8vIElmIHdlIHN0YXJ0ZWQgd2l0aCBhIHNlcGFyYXRvciwgd2Uga25vdyB3ZSBhdCBsZWFzdCBoYXZlIGFuXG4gICAgICAgIC8vIGFic29sdXRlIHBhdGggb2Ygc29tZSBraW5kIChVTkMgb3Igb3RoZXJ3aXNlKVxuICAgICAgICBpc0Fic29sdXRlID0gdHJ1ZTtcblxuICAgICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdCgxKSkpIHtcbiAgICAgICAgICAvLyBNYXRjaGVkIGRvdWJsZSBwYXRoIHNlcGFyYXRvciBhdCBiZWdpbm5pbmdcbiAgICAgICAgICBsZXQgaiA9IDI7XG4gICAgICAgICAgbGV0IGxhc3QgPSBqO1xuICAgICAgICAgIC8vIE1hdGNoIDEgb3IgbW9yZSBub24tcGF0aCBzZXBhcmF0b3JzXG4gICAgICAgICAgZm9yICg7IGogPCBsZW47ICsraikge1xuICAgICAgICAgICAgaWYgKGlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoaikpKSBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGogPCBsZW4gJiYgaiAhPT0gbGFzdCkge1xuICAgICAgICAgICAgY29uc3QgZmlyc3RQYXJ0ID0gcGF0aC5zbGljZShsYXN0LCBqKTtcbiAgICAgICAgICAgIC8vIE1hdGNoZWQhXG4gICAgICAgICAgICBsYXN0ID0gajtcbiAgICAgICAgICAgIC8vIE1hdGNoIDEgb3IgbW9yZSBwYXRoIHNlcGFyYXRvcnNcbiAgICAgICAgICAgIGZvciAoOyBqIDwgbGVuOyArK2opIHtcbiAgICAgICAgICAgICAgaWYgKCFpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KGopKSkgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaiA8IGxlbiAmJiBqICE9PSBsYXN0KSB7XG4gICAgICAgICAgICAgIC8vIE1hdGNoZWQhXG4gICAgICAgICAgICAgIGxhc3QgPSBqO1xuICAgICAgICAgICAgICAvLyBNYXRjaCAxIG9yIG1vcmUgbm9uLXBhdGggc2VwYXJhdG9yc1xuICAgICAgICAgICAgICBmb3IgKDsgaiA8IGxlbjsgKytqKSB7XG4gICAgICAgICAgICAgICAgaWYgKGlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoaikpKSBicmVhaztcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBpZiAoaiA9PT0gbGVuKSB7XG4gICAgICAgICAgICAgICAgLy8gV2UgbWF0Y2hlZCBhIFVOQyByb290IG9ubHlcbiAgICAgICAgICAgICAgICBkZXZpY2UgPSBgXFxcXFxcXFwke2ZpcnN0UGFydH1cXFxcJHtwYXRoLnNsaWNlKGxhc3QpfWA7XG4gICAgICAgICAgICAgICAgcm9vdEVuZCA9IGo7XG4gICAgICAgICAgICAgIH0gZWxzZSBpZiAoaiAhPT0gbGFzdCkge1xuICAgICAgICAgICAgICAgIC8vIFdlIG1hdGNoZWQgYSBVTkMgcm9vdCB3aXRoIGxlZnRvdmVyc1xuXG4gICAgICAgICAgICAgICAgZGV2aWNlID0gYFxcXFxcXFxcJHtmaXJzdFBhcnR9XFxcXCR7cGF0aC5zbGljZShsYXN0LCBqKX1gO1xuICAgICAgICAgICAgICAgIHJvb3RFbmQgPSBqO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHJvb3RFbmQgPSAxO1xuICAgICAgICB9XG4gICAgICB9IGVsc2UgaWYgKGlzV2luZG93c0RldmljZVJvb3QoY29kZSkpIHtcbiAgICAgICAgLy8gUG9zc2libGUgZGV2aWNlIHJvb3RcblxuICAgICAgICBpZiAocGF0aC5jaGFyQ29kZUF0KDEpID09PSBDSEFSX0NPTE9OKSB7XG4gICAgICAgICAgZGV2aWNlID0gcGF0aC5zbGljZSgwLCAyKTtcbiAgICAgICAgICByb290RW5kID0gMjtcbiAgICAgICAgICBpZiAobGVuID4gMikge1xuICAgICAgICAgICAgaWYgKGlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoMikpKSB7XG4gICAgICAgICAgICAgIC8vIFRyZWF0IHNlcGFyYXRvciBmb2xsb3dpbmcgZHJpdmUgbmFtZSBhcyBhbiBhYnNvbHV0ZSBwYXRoXG4gICAgICAgICAgICAgIC8vIGluZGljYXRvclxuICAgICAgICAgICAgICBpc0Fic29sdXRlID0gdHJ1ZTtcbiAgICAgICAgICAgICAgcm9vdEVuZCA9IDM7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpc1BhdGhTZXBhcmF0b3IoY29kZSkpIHtcbiAgICAgIC8vIGBwYXRoYCBjb250YWlucyBqdXN0IGEgcGF0aCBzZXBhcmF0b3JcbiAgICAgIHJvb3RFbmQgPSAxO1xuICAgICAgaXNBYnNvbHV0ZSA9IHRydWU7XG4gICAgfVxuXG4gICAgaWYgKFxuICAgICAgZGV2aWNlLmxlbmd0aCA+IDAgJiZcbiAgICAgIHJlc29sdmVkRGV2aWNlLmxlbmd0aCA+IDAgJiZcbiAgICAgIGRldmljZS50b0xvd2VyQ2FzZSgpICE9PSByZXNvbHZlZERldmljZS50b0xvd2VyQ2FzZSgpXG4gICAgKSB7XG4gICAgICAvLyBUaGlzIHBhdGggcG9pbnRzIHRvIGFub3RoZXIgZGV2aWNlIHNvIGl0IGlzIG5vdCBhcHBsaWNhYmxlXG4gICAgICBjb250aW51ZTtcbiAgICB9XG5cbiAgICBpZiAocmVzb2x2ZWREZXZpY2UubGVuZ3RoID09PSAwICYmIGRldmljZS5sZW5ndGggPiAwKSB7XG4gICAgICByZXNvbHZlZERldmljZSA9IGRldmljZTtcbiAgICB9XG4gICAgaWYgKCFyZXNvbHZlZEFic29sdXRlKSB7XG4gICAgICByZXNvbHZlZFRhaWwgPSBgJHtwYXRoLnNsaWNlKHJvb3RFbmQpfVxcXFwke3Jlc29sdmVkVGFpbH1gO1xuICAgICAgcmVzb2x2ZWRBYnNvbHV0ZSA9IGlzQWJzb2x1dGU7XG4gICAgfVxuXG4gICAgaWYgKHJlc29sdmVkQWJzb2x1dGUgJiYgcmVzb2x2ZWREZXZpY2UubGVuZ3RoID4gMCkgYnJlYWs7XG4gIH1cblxuICAvLyBBdCB0aGlzIHBvaW50IHRoZSBwYXRoIHNob3VsZCBiZSByZXNvbHZlZCB0byBhIGZ1bGwgYWJzb2x1dGUgcGF0aCxcbiAgLy8gYnV0IGhhbmRsZSByZWxhdGl2ZSBwYXRocyB0byBiZSBzYWZlIChtaWdodCBoYXBwZW4gd2hlbiBwcm9jZXNzLmN3ZCgpXG4gIC8vIGZhaWxzKVxuXG4gIC8vIE5vcm1hbGl6ZSB0aGUgdGFpbCBwYXRoXG4gIHJlc29sdmVkVGFpbCA9IG5vcm1hbGl6ZVN0cmluZyhcbiAgICByZXNvbHZlZFRhaWwsXG4gICAgIXJlc29sdmVkQWJzb2x1dGUsXG4gICAgXCJcXFxcXCIsXG4gICAgaXNQYXRoU2VwYXJhdG9yLFxuICApO1xuXG4gIHJldHVybiByZXNvbHZlZERldmljZSArIChyZXNvbHZlZEFic29sdXRlID8gXCJcXFxcXCIgOiBcIlwiKSArIHJlc29sdmVkVGFpbCB8fCBcIi5cIjtcbn1cblxuLyoqXG4gKiBOb3JtYWxpemVzIGEgYHBhdGhgXG4gKiBAcGFyYW0gcGF0aCB0byBub3JtYWxpemVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIG5vcm1hbGl6ZShwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBhc3NlcnRQYXRoKHBhdGgpO1xuICBjb25zdCBsZW4gPSBwYXRoLmxlbmd0aDtcbiAgaWYgKGxlbiA9PT0gMCkgcmV0dXJuIFwiLlwiO1xuICBsZXQgcm9vdEVuZCA9IDA7XG4gIGxldCBkZXZpY2U6IHN0cmluZyB8IHVuZGVmaW5lZDtcbiAgbGV0IGlzQWJzb2x1dGUgPSBmYWxzZTtcbiAgY29uc3QgY29kZSA9IHBhdGguY2hhckNvZGVBdCgwKTtcblxuICAvLyBUcnkgdG8gbWF0Y2ggYSByb290XG4gIGlmIChsZW4gPiAxKSB7XG4gICAgaWYgKGlzUGF0aFNlcGFyYXRvcihjb2RlKSkge1xuICAgICAgLy8gUG9zc2libGUgVU5DIHJvb3RcblxuICAgICAgLy8gSWYgd2Ugc3RhcnRlZCB3aXRoIGEgc2VwYXJhdG9yLCB3ZSBrbm93IHdlIGF0IGxlYXN0IGhhdmUgYW4gYWJzb2x1dGVcbiAgICAgIC8vIHBhdGggb2Ygc29tZSBraW5kIChVTkMgb3Igb3RoZXJ3aXNlKVxuICAgICAgaXNBYnNvbHV0ZSA9IHRydWU7XG5cbiAgICAgIGlmIChpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KDEpKSkge1xuICAgICAgICAvLyBNYXRjaGVkIGRvdWJsZSBwYXRoIHNlcGFyYXRvciBhdCBiZWdpbm5pbmdcbiAgICAgICAgbGV0IGogPSAyO1xuICAgICAgICBsZXQgbGFzdCA9IGo7XG4gICAgICAgIC8vIE1hdGNoIDEgb3IgbW9yZSBub24tcGF0aCBzZXBhcmF0b3JzXG4gICAgICAgIGZvciAoOyBqIDwgbGVuOyArK2opIHtcbiAgICAgICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdChqKSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChqIDwgbGVuICYmIGogIT09IGxhc3QpIHtcbiAgICAgICAgICBjb25zdCBmaXJzdFBhcnQgPSBwYXRoLnNsaWNlKGxhc3QsIGopO1xuICAgICAgICAgIC8vIE1hdGNoZWQhXG4gICAgICAgICAgbGFzdCA9IGo7XG4gICAgICAgICAgLy8gTWF0Y2ggMSBvciBtb3JlIHBhdGggc2VwYXJhdG9yc1xuICAgICAgICAgIGZvciAoOyBqIDwgbGVuOyArK2opIHtcbiAgICAgICAgICAgIGlmICghaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdChqKSkpIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaiA8IGxlbiAmJiBqICE9PSBsYXN0KSB7XG4gICAgICAgICAgICAvLyBNYXRjaGVkIVxuICAgICAgICAgICAgbGFzdCA9IGo7XG4gICAgICAgICAgICAvLyBNYXRjaCAxIG9yIG1vcmUgbm9uLXBhdGggc2VwYXJhdG9yc1xuICAgICAgICAgICAgZm9yICg7IGogPCBsZW47ICsraikge1xuICAgICAgICAgICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdChqKSkpIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGogPT09IGxlbikge1xuICAgICAgICAgICAgICAvLyBXZSBtYXRjaGVkIGEgVU5DIHJvb3Qgb25seVxuICAgICAgICAgICAgICAvLyBSZXR1cm4gdGhlIG5vcm1hbGl6ZWQgdmVyc2lvbiBvZiB0aGUgVU5DIHJvb3Qgc2luY2UgdGhlcmVcbiAgICAgICAgICAgICAgLy8gaXMgbm90aGluZyBsZWZ0IHRvIHByb2Nlc3NcblxuICAgICAgICAgICAgICByZXR1cm4gYFxcXFxcXFxcJHtmaXJzdFBhcnR9XFxcXCR7cGF0aC5zbGljZShsYXN0KX1cXFxcYDtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoaiAhPT0gbGFzdCkge1xuICAgICAgICAgICAgICAvLyBXZSBtYXRjaGVkIGEgVU5DIHJvb3Qgd2l0aCBsZWZ0b3ZlcnNcblxuICAgICAgICAgICAgICBkZXZpY2UgPSBgXFxcXFxcXFwke2ZpcnN0UGFydH1cXFxcJHtwYXRoLnNsaWNlKGxhc3QsIGopfWA7XG4gICAgICAgICAgICAgIHJvb3RFbmQgPSBqO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcm9vdEVuZCA9IDE7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpc1dpbmRvd3NEZXZpY2VSb290KGNvZGUpKSB7XG4gICAgICAvLyBQb3NzaWJsZSBkZXZpY2Ugcm9vdFxuXG4gICAgICBpZiAocGF0aC5jaGFyQ29kZUF0KDEpID09PSBDSEFSX0NPTE9OKSB7XG4gICAgICAgIGRldmljZSA9IHBhdGguc2xpY2UoMCwgMik7XG4gICAgICAgIHJvb3RFbmQgPSAyO1xuICAgICAgICBpZiAobGVuID4gMikge1xuICAgICAgICAgIGlmIChpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KDIpKSkge1xuICAgICAgICAgICAgLy8gVHJlYXQgc2VwYXJhdG9yIGZvbGxvd2luZyBkcml2ZSBuYW1lIGFzIGFuIGFic29sdXRlIHBhdGhcbiAgICAgICAgICAgIC8vIGluZGljYXRvclxuICAgICAgICAgICAgaXNBYnNvbHV0ZSA9IHRydWU7XG4gICAgICAgICAgICByb290RW5kID0gMztcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNQYXRoU2VwYXJhdG9yKGNvZGUpKSB7XG4gICAgLy8gYHBhdGhgIGNvbnRhaW5zIGp1c3QgYSBwYXRoIHNlcGFyYXRvciwgZXhpdCBlYXJseSB0byBhdm9pZCB1bm5lY2Vzc2FyeVxuICAgIC8vIHdvcmtcbiAgICByZXR1cm4gXCJcXFxcXCI7XG4gIH1cblxuICBsZXQgdGFpbDogc3RyaW5nO1xuICBpZiAocm9vdEVuZCA8IGxlbikge1xuICAgIHRhaWwgPSBub3JtYWxpemVTdHJpbmcoXG4gICAgICBwYXRoLnNsaWNlKHJvb3RFbmQpLFxuICAgICAgIWlzQWJzb2x1dGUsXG4gICAgICBcIlxcXFxcIixcbiAgICAgIGlzUGF0aFNlcGFyYXRvcixcbiAgICApO1xuICB9IGVsc2Uge1xuICAgIHRhaWwgPSBcIlwiO1xuICB9XG4gIGlmICh0YWlsLmxlbmd0aCA9PT0gMCAmJiAhaXNBYnNvbHV0ZSkgdGFpbCA9IFwiLlwiO1xuICBpZiAodGFpbC5sZW5ndGggPiAwICYmIGlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQobGVuIC0gMSkpKSB7XG4gICAgdGFpbCArPSBcIlxcXFxcIjtcbiAgfVxuICBpZiAoZGV2aWNlID09PSB1bmRlZmluZWQpIHtcbiAgICBpZiAoaXNBYnNvbHV0ZSkge1xuICAgICAgaWYgKHRhaWwubGVuZ3RoID4gMCkgcmV0dXJuIGBcXFxcJHt0YWlsfWA7XG4gICAgICBlbHNlIHJldHVybiBcIlxcXFxcIjtcbiAgICB9IGVsc2UgaWYgKHRhaWwubGVuZ3RoID4gMCkge1xuICAgICAgcmV0dXJuIHRhaWw7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBcIlwiO1xuICAgIH1cbiAgfSBlbHNlIGlmIChpc0Fic29sdXRlKSB7XG4gICAgaWYgKHRhaWwubGVuZ3RoID4gMCkgcmV0dXJuIGAke2RldmljZX1cXFxcJHt0YWlsfWA7XG4gICAgZWxzZSByZXR1cm4gYCR7ZGV2aWNlfVxcXFxgO1xuICB9IGVsc2UgaWYgKHRhaWwubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBkZXZpY2UgKyB0YWlsO1xuICB9IGVsc2Uge1xuICAgIHJldHVybiBkZXZpY2U7XG4gIH1cbn1cblxuLyoqXG4gKiBWZXJpZmllcyB3aGV0aGVyIHBhdGggaXMgYWJzb2x1dGVcbiAqIEBwYXJhbSBwYXRoIHRvIHZlcmlmeVxuICovXG5leHBvcnQgZnVuY3Rpb24gaXNBYnNvbHV0ZShwYXRoOiBzdHJpbmcpOiBib29sZWFuIHtcbiAgYXNzZXJ0UGF0aChwYXRoKTtcbiAgY29uc3QgbGVuID0gcGF0aC5sZW5ndGg7XG4gIGlmIChsZW4gPT09IDApIHJldHVybiBmYWxzZTtcblxuICBjb25zdCBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KDApO1xuICBpZiAoaXNQYXRoU2VwYXJhdG9yKGNvZGUpKSB7XG4gICAgcmV0dXJuIHRydWU7XG4gIH0gZWxzZSBpZiAoaXNXaW5kb3dzRGV2aWNlUm9vdChjb2RlKSkge1xuICAgIC8vIFBvc3NpYmxlIGRldmljZSByb290XG5cbiAgICBpZiAobGVuID4gMiAmJiBwYXRoLmNoYXJDb2RlQXQoMSkgPT09IENIQVJfQ09MT04pIHtcbiAgICAgIGlmIChpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KDIpKSkgcmV0dXJuIHRydWU7XG4gICAgfVxuICB9XG4gIHJldHVybiBmYWxzZTtcbn1cblxuLyoqXG4gKiBKb2luIGFsbCBnaXZlbiBhIHNlcXVlbmNlIG9mIGBwYXRoc2AsdGhlbiBub3JtYWxpemVzIHRoZSByZXN1bHRpbmcgcGF0aC5cbiAqIEBwYXJhbSBwYXRocyB0byBiZSBqb2luZWQgYW5kIG5vcm1hbGl6ZWRcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGpvaW4oLi4ucGF0aHM6IHN0cmluZ1tdKTogc3RyaW5nIHtcbiAgY29uc3QgcGF0aHNDb3VudCA9IHBhdGhzLmxlbmd0aDtcbiAgaWYgKHBhdGhzQ291bnQgPT09IDApIHJldHVybiBcIi5cIjtcblxuICBsZXQgam9pbmVkOiBzdHJpbmcgfCB1bmRlZmluZWQ7XG4gIGxldCBmaXJzdFBhcnQ6IHN0cmluZyB8IG51bGwgPSBudWxsO1xuICBmb3IgKGxldCBpID0gMDsgaSA8IHBhdGhzQ291bnQ7ICsraSkge1xuICAgIGNvbnN0IHBhdGggPSBwYXRoc1tpXTtcbiAgICBhc3NlcnRQYXRoKHBhdGgpO1xuICAgIGlmIChwYXRoLmxlbmd0aCA+IDApIHtcbiAgICAgIGlmIChqb2luZWQgPT09IHVuZGVmaW5lZCkgam9pbmVkID0gZmlyc3RQYXJ0ID0gcGF0aDtcbiAgICAgIGVsc2Ugam9pbmVkICs9IGBcXFxcJHtwYXRofWA7XG4gICAgfVxuICB9XG5cbiAgaWYgKGpvaW5lZCA9PT0gdW5kZWZpbmVkKSByZXR1cm4gXCIuXCI7XG5cbiAgLy8gTWFrZSBzdXJlIHRoYXQgdGhlIGpvaW5lZCBwYXRoIGRvZXNuJ3Qgc3RhcnQgd2l0aCB0d28gc2xhc2hlcywgYmVjYXVzZVxuICAvLyBub3JtYWxpemUoKSB3aWxsIG1pc3Rha2UgaXQgZm9yIGFuIFVOQyBwYXRoIHRoZW4uXG4gIC8vXG4gIC8vIFRoaXMgc3RlcCBpcyBza2lwcGVkIHdoZW4gaXQgaXMgdmVyeSBjbGVhciB0aGF0IHRoZSB1c2VyIGFjdHVhbGx5XG4gIC8vIGludGVuZGVkIHRvIHBvaW50IGF0IGFuIFVOQyBwYXRoLiBUaGlzIGlzIGFzc3VtZWQgd2hlbiB0aGUgZmlyc3RcbiAgLy8gbm9uLWVtcHR5IHN0cmluZyBhcmd1bWVudHMgc3RhcnRzIHdpdGggZXhhY3RseSB0d28gc2xhc2hlcyBmb2xsb3dlZCBieVxuICAvLyBhdCBsZWFzdCBvbmUgbW9yZSBub24tc2xhc2ggY2hhcmFjdGVyLlxuICAvL1xuICAvLyBOb3RlIHRoYXQgZm9yIG5vcm1hbGl6ZSgpIHRvIHRyZWF0IGEgcGF0aCBhcyBhbiBVTkMgcGF0aCBpdCBuZWVkcyB0b1xuICAvLyBoYXZlIGF0IGxlYXN0IDIgY29tcG9uZW50cywgc28gd2UgZG9uJ3QgZmlsdGVyIGZvciB0aGF0IGhlcmUuXG4gIC8vIFRoaXMgbWVhbnMgdGhhdCB0aGUgdXNlciBjYW4gdXNlIGpvaW4gdG8gY29uc3RydWN0IFVOQyBwYXRocyBmcm9tXG4gIC8vIGEgc2VydmVyIG5hbWUgYW5kIGEgc2hhcmUgbmFtZTsgZm9yIGV4YW1wbGU6XG4gIC8vICAgcGF0aC5qb2luKCcvL3NlcnZlcicsICdzaGFyZScpIC0+ICdcXFxcXFxcXHNlcnZlclxcXFxzaGFyZVxcXFwnKVxuICBsZXQgbmVlZHNSZXBsYWNlID0gdHJ1ZTtcbiAgbGV0IHNsYXNoQ291bnQgPSAwO1xuICBhc3NlcnQoZmlyc3RQYXJ0ICE9IG51bGwpO1xuICBpZiAoaXNQYXRoU2VwYXJhdG9yKGZpcnN0UGFydC5jaGFyQ29kZUF0KDApKSkge1xuICAgICsrc2xhc2hDb3VudDtcbiAgICBjb25zdCBmaXJzdExlbiA9IGZpcnN0UGFydC5sZW5ndGg7XG4gICAgaWYgKGZpcnN0TGVuID4gMSkge1xuICAgICAgaWYgKGlzUGF0aFNlcGFyYXRvcihmaXJzdFBhcnQuY2hhckNvZGVBdCgxKSkpIHtcbiAgICAgICAgKytzbGFzaENvdW50O1xuICAgICAgICBpZiAoZmlyc3RMZW4gPiAyKSB7XG4gICAgICAgICAgaWYgKGlzUGF0aFNlcGFyYXRvcihmaXJzdFBhcnQuY2hhckNvZGVBdCgyKSkpICsrc2xhc2hDb3VudDtcbiAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgIC8vIFdlIG1hdGNoZWQgYSBVTkMgcGF0aCBpbiB0aGUgZmlyc3QgcGFydFxuICAgICAgICAgICAgbmVlZHNSZXBsYWNlID0gZmFsc2U7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG4gIGlmIChuZWVkc1JlcGxhY2UpIHtcbiAgICAvLyBGaW5kIGFueSBtb3JlIGNvbnNlY3V0aXZlIHNsYXNoZXMgd2UgbmVlZCB0byByZXBsYWNlXG4gICAgZm9yICg7IHNsYXNoQ291bnQgPCBqb2luZWQubGVuZ3RoOyArK3NsYXNoQ291bnQpIHtcbiAgICAgIGlmICghaXNQYXRoU2VwYXJhdG9yKGpvaW5lZC5jaGFyQ29kZUF0KHNsYXNoQ291bnQpKSkgYnJlYWs7XG4gICAgfVxuXG4gICAgLy8gUmVwbGFjZSB0aGUgc2xhc2hlcyBpZiBuZWVkZWRcbiAgICBpZiAoc2xhc2hDb3VudCA+PSAyKSBqb2luZWQgPSBgXFxcXCR7am9pbmVkLnNsaWNlKHNsYXNoQ291bnQpfWA7XG4gIH1cblxuICByZXR1cm4gbm9ybWFsaXplKGpvaW5lZCk7XG59XG5cbi8qKlxuICogSXQgd2lsbCBzb2x2ZSB0aGUgcmVsYXRpdmUgcGF0aCBmcm9tIGBmcm9tYCB0byBgdG9gLCBmb3IgaW5zdGFuY2U6XG4gKiAgZnJvbSA9ICdDOlxcXFxvcmFuZGVhXFxcXHRlc3RcXFxcYWFhJ1xuICogIHRvID0gJ0M6XFxcXG9yYW5kZWFcXFxcaW1wbFxcXFxiYmInXG4gKiBUaGUgb3V0cHV0IG9mIHRoZSBmdW5jdGlvbiBzaG91bGQgYmU6ICcuLlxcXFwuLlxcXFxpbXBsXFxcXGJiYidcbiAqIEBwYXJhbSBmcm9tIHJlbGF0aXZlIHBhdGhcbiAqIEBwYXJhbSB0byByZWxhdGl2ZSBwYXRoXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWxhdGl2ZShmcm9tOiBzdHJpbmcsIHRvOiBzdHJpbmcpOiBzdHJpbmcge1xuICBhc3NlcnRQYXRoKGZyb20pO1xuICBhc3NlcnRQYXRoKHRvKTtcblxuICBpZiAoZnJvbSA9PT0gdG8pIHJldHVybiBcIlwiO1xuXG4gIGNvbnN0IGZyb21PcmlnID0gcmVzb2x2ZShmcm9tKTtcbiAgY29uc3QgdG9PcmlnID0gcmVzb2x2ZSh0byk7XG5cbiAgaWYgKGZyb21PcmlnID09PSB0b09yaWcpIHJldHVybiBcIlwiO1xuXG4gIGZyb20gPSBmcm9tT3JpZy50b0xvd2VyQ2FzZSgpO1xuICB0byA9IHRvT3JpZy50b0xvd2VyQ2FzZSgpO1xuXG4gIGlmIChmcm9tID09PSB0bykgcmV0dXJuIFwiXCI7XG5cbiAgLy8gVHJpbSBhbnkgbGVhZGluZyBiYWNrc2xhc2hlc1xuICBsZXQgZnJvbVN0YXJ0ID0gMDtcbiAgbGV0IGZyb21FbmQgPSBmcm9tLmxlbmd0aDtcbiAgZm9yICg7IGZyb21TdGFydCA8IGZyb21FbmQ7ICsrZnJvbVN0YXJ0KSB7XG4gICAgaWYgKGZyb20uY2hhckNvZGVBdChmcm9tU3RhcnQpICE9PSBDSEFSX0JBQ0tXQVJEX1NMQVNIKSBicmVhaztcbiAgfVxuICAvLyBUcmltIHRyYWlsaW5nIGJhY2tzbGFzaGVzIChhcHBsaWNhYmxlIHRvIFVOQyBwYXRocyBvbmx5KVxuICBmb3IgKDsgZnJvbUVuZCAtIDEgPiBmcm9tU3RhcnQ7IC0tZnJvbUVuZCkge1xuICAgIGlmIChmcm9tLmNoYXJDb2RlQXQoZnJvbUVuZCAtIDEpICE9PSBDSEFSX0JBQ0tXQVJEX1NMQVNIKSBicmVhaztcbiAgfVxuICBjb25zdCBmcm9tTGVuID0gZnJvbUVuZCAtIGZyb21TdGFydDtcblxuICAvLyBUcmltIGFueSBsZWFkaW5nIGJhY2tzbGFzaGVzXG4gIGxldCB0b1N0YXJ0ID0gMDtcbiAgbGV0IHRvRW5kID0gdG8ubGVuZ3RoO1xuICBmb3IgKDsgdG9TdGFydCA8IHRvRW5kOyArK3RvU3RhcnQpIHtcbiAgICBpZiAodG8uY2hhckNvZGVBdCh0b1N0YXJ0KSAhPT0gQ0hBUl9CQUNLV0FSRF9TTEFTSCkgYnJlYWs7XG4gIH1cbiAgLy8gVHJpbSB0cmFpbGluZyBiYWNrc2xhc2hlcyAoYXBwbGljYWJsZSB0byBVTkMgcGF0aHMgb25seSlcbiAgZm9yICg7IHRvRW5kIC0gMSA+IHRvU3RhcnQ7IC0tdG9FbmQpIHtcbiAgICBpZiAodG8uY2hhckNvZGVBdCh0b0VuZCAtIDEpICE9PSBDSEFSX0JBQ0tXQVJEX1NMQVNIKSBicmVhaztcbiAgfVxuICBjb25zdCB0b0xlbiA9IHRvRW5kIC0gdG9TdGFydDtcblxuICAvLyBDb21wYXJlIHBhdGhzIHRvIGZpbmQgdGhlIGxvbmdlc3QgY29tbW9uIHBhdGggZnJvbSByb290XG4gIGNvbnN0IGxlbmd0aCA9IGZyb21MZW4gPCB0b0xlbiA/IGZyb21MZW4gOiB0b0xlbjtcbiAgbGV0IGxhc3RDb21tb25TZXAgPSAtMTtcbiAgbGV0IGkgPSAwO1xuICBmb3IgKDsgaSA8PSBsZW5ndGg7ICsraSkge1xuICAgIGlmIChpID09PSBsZW5ndGgpIHtcbiAgICAgIGlmICh0b0xlbiA+IGxlbmd0aCkge1xuICAgICAgICBpZiAodG8uY2hhckNvZGVBdCh0b1N0YXJ0ICsgaSkgPT09IENIQVJfQkFDS1dBUkRfU0xBU0gpIHtcbiAgICAgICAgICAvLyBXZSBnZXQgaGVyZSBpZiBgZnJvbWAgaXMgdGhlIGV4YWN0IGJhc2UgcGF0aCBmb3IgYHRvYC5cbiAgICAgICAgICAvLyBGb3IgZXhhbXBsZTogZnJvbT0nQzpcXFxcZm9vXFxcXGJhcic7IHRvPSdDOlxcXFxmb29cXFxcYmFyXFxcXGJheidcbiAgICAgICAgICByZXR1cm4gdG9PcmlnLnNsaWNlKHRvU3RhcnQgKyBpICsgMSk7XG4gICAgICAgIH0gZWxzZSBpZiAoaSA9PT0gMikge1xuICAgICAgICAgIC8vIFdlIGdldCBoZXJlIGlmIGBmcm9tYCBpcyB0aGUgZGV2aWNlIHJvb3QuXG4gICAgICAgICAgLy8gRm9yIGV4YW1wbGU6IGZyb209J0M6XFxcXCc7IHRvPSdDOlxcXFxmb28nXG4gICAgICAgICAgcmV0dXJuIHRvT3JpZy5zbGljZSh0b1N0YXJ0ICsgaSk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIGlmIChmcm9tTGVuID4gbGVuZ3RoKSB7XG4gICAgICAgIGlmIChmcm9tLmNoYXJDb2RlQXQoZnJvbVN0YXJ0ICsgaSkgPT09IENIQVJfQkFDS1dBUkRfU0xBU0gpIHtcbiAgICAgICAgICAvLyBXZSBnZXQgaGVyZSBpZiBgdG9gIGlzIHRoZSBleGFjdCBiYXNlIHBhdGggZm9yIGBmcm9tYC5cbiAgICAgICAgICAvLyBGb3IgZXhhbXBsZTogZnJvbT0nQzpcXFxcZm9vXFxcXGJhcic7IHRvPSdDOlxcXFxmb28nXG4gICAgICAgICAgbGFzdENvbW1vblNlcCA9IGk7XG4gICAgICAgIH0gZWxzZSBpZiAoaSA9PT0gMikge1xuICAgICAgICAgIC8vIFdlIGdldCBoZXJlIGlmIGB0b2AgaXMgdGhlIGRldmljZSByb290LlxuICAgICAgICAgIC8vIEZvciBleGFtcGxlOiBmcm9tPSdDOlxcXFxmb29cXFxcYmFyJzsgdG89J0M6XFxcXCdcbiAgICAgICAgICBsYXN0Q29tbW9uU2VwID0gMztcbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNvbnN0IGZyb21Db2RlID0gZnJvbS5jaGFyQ29kZUF0KGZyb21TdGFydCArIGkpO1xuICAgIGNvbnN0IHRvQ29kZSA9IHRvLmNoYXJDb2RlQXQodG9TdGFydCArIGkpO1xuICAgIGlmIChmcm9tQ29kZSAhPT0gdG9Db2RlKSBicmVhaztcbiAgICBlbHNlIGlmIChmcm9tQ29kZSA9PT0gQ0hBUl9CQUNLV0FSRF9TTEFTSCkgbGFzdENvbW1vblNlcCA9IGk7XG4gIH1cblxuICAvLyBXZSBmb3VuZCBhIG1pc21hdGNoIGJlZm9yZSB0aGUgZmlyc3QgY29tbW9uIHBhdGggc2VwYXJhdG9yIHdhcyBzZWVuLCBzb1xuICAvLyByZXR1cm4gdGhlIG9yaWdpbmFsIGB0b2AuXG4gIGlmIChpICE9PSBsZW5ndGggJiYgbGFzdENvbW1vblNlcCA9PT0gLTEpIHtcbiAgICByZXR1cm4gdG9PcmlnO1xuICB9XG5cbiAgbGV0IG91dCA9IFwiXCI7XG4gIGlmIChsYXN0Q29tbW9uU2VwID09PSAtMSkgbGFzdENvbW1vblNlcCA9IDA7XG4gIC8vIEdlbmVyYXRlIHRoZSByZWxhdGl2ZSBwYXRoIGJhc2VkIG9uIHRoZSBwYXRoIGRpZmZlcmVuY2UgYmV0d2VlbiBgdG9gIGFuZFxuICAvLyBgZnJvbWBcbiAgZm9yIChpID0gZnJvbVN0YXJ0ICsgbGFzdENvbW1vblNlcCArIDE7IGkgPD0gZnJvbUVuZDsgKytpKSB7XG4gICAgaWYgKGkgPT09IGZyb21FbmQgfHwgZnJvbS5jaGFyQ29kZUF0KGkpID09PSBDSEFSX0JBQ0tXQVJEX1NMQVNIKSB7XG4gICAgICBpZiAob3V0Lmxlbmd0aCA9PT0gMCkgb3V0ICs9IFwiLi5cIjtcbiAgICAgIGVsc2Ugb3V0ICs9IFwiXFxcXC4uXCI7XG4gICAgfVxuICB9XG5cbiAgLy8gTGFzdGx5LCBhcHBlbmQgdGhlIHJlc3Qgb2YgdGhlIGRlc3RpbmF0aW9uIChgdG9gKSBwYXRoIHRoYXQgY29tZXMgYWZ0ZXJcbiAgLy8gdGhlIGNvbW1vbiBwYXRoIHBhcnRzXG4gIGlmIChvdXQubGVuZ3RoID4gMCkge1xuICAgIHJldHVybiBvdXQgKyB0b09yaWcuc2xpY2UodG9TdGFydCArIGxhc3RDb21tb25TZXAsIHRvRW5kKTtcbiAgfSBlbHNlIHtcbiAgICB0b1N0YXJ0ICs9IGxhc3RDb21tb25TZXA7XG4gICAgaWYgKHRvT3JpZy5jaGFyQ29kZUF0KHRvU3RhcnQpID09PSBDSEFSX0JBQ0tXQVJEX1NMQVNIKSArK3RvU3RhcnQ7XG4gICAgcmV0dXJuIHRvT3JpZy5zbGljZSh0b1N0YXJ0LCB0b0VuZCk7XG4gIH1cbn1cblxuLyoqXG4gKiBSZXNvbHZlcyBwYXRoIHRvIGEgbmFtZXNwYWNlIHBhdGhcbiAqIEBwYXJhbSBwYXRoIHRvIHJlc29sdmUgdG8gbmFtZXNwYWNlXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB0b05hbWVzcGFjZWRQYXRoKHBhdGg6IHN0cmluZyk6IHN0cmluZyB7XG4gIC8vIE5vdGU6IHRoaXMgd2lsbCAqcHJvYmFibHkqIHRocm93IHNvbWV3aGVyZS5cbiAgaWYgKHR5cGVvZiBwYXRoICE9PSBcInN0cmluZ1wiKSByZXR1cm4gcGF0aDtcbiAgaWYgKHBhdGgubGVuZ3RoID09PSAwKSByZXR1cm4gXCJcIjtcblxuICBjb25zdCByZXNvbHZlZFBhdGggPSByZXNvbHZlKHBhdGgpO1xuXG4gIGlmIChyZXNvbHZlZFBhdGgubGVuZ3RoID49IDMpIHtcbiAgICBpZiAocmVzb2x2ZWRQYXRoLmNoYXJDb2RlQXQoMCkgPT09IENIQVJfQkFDS1dBUkRfU0xBU0gpIHtcbiAgICAgIC8vIFBvc3NpYmxlIFVOQyByb290XG5cbiAgICAgIGlmIChyZXNvbHZlZFBhdGguY2hhckNvZGVBdCgxKSA9PT0gQ0hBUl9CQUNLV0FSRF9TTEFTSCkge1xuICAgICAgICBjb25zdCBjb2RlID0gcmVzb2x2ZWRQYXRoLmNoYXJDb2RlQXQoMik7XG4gICAgICAgIGlmIChjb2RlICE9PSBDSEFSX1FVRVNUSU9OX01BUksgJiYgY29kZSAhPT0gQ0hBUl9ET1QpIHtcbiAgICAgICAgICAvLyBNYXRjaGVkIG5vbi1sb25nIFVOQyByb290LCBjb252ZXJ0IHRoZSBwYXRoIHRvIGEgbG9uZyBVTkMgcGF0aFxuICAgICAgICAgIHJldHVybiBgXFxcXFxcXFw/XFxcXFVOQ1xcXFwke3Jlc29sdmVkUGF0aC5zbGljZSgyKX1gO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChpc1dpbmRvd3NEZXZpY2VSb290KHJlc29sdmVkUGF0aC5jaGFyQ29kZUF0KDApKSkge1xuICAgICAgLy8gUG9zc2libGUgZGV2aWNlIHJvb3RcblxuICAgICAgaWYgKFxuICAgICAgICByZXNvbHZlZFBhdGguY2hhckNvZGVBdCgxKSA9PT0gQ0hBUl9DT0xPTiAmJlxuICAgICAgICByZXNvbHZlZFBhdGguY2hhckNvZGVBdCgyKSA9PT0gQ0hBUl9CQUNLV0FSRF9TTEFTSFxuICAgICAgKSB7XG4gICAgICAgIC8vIE1hdGNoZWQgZGV2aWNlIHJvb3QsIGNvbnZlcnQgdGhlIHBhdGggdG8gYSBsb25nIFVOQyBwYXRoXG4gICAgICAgIHJldHVybiBgXFxcXFxcXFw/XFxcXCR7cmVzb2x2ZWRQYXRofWA7XG4gICAgICB9XG4gICAgfVxuICB9XG5cbiAgcmV0dXJuIHBhdGg7XG59XG5cbi8qKlxuICogUmV0dXJuIHRoZSBkaXJlY3RvcnkgbmFtZSBvZiBhIGBwYXRoYC5cbiAqIEBwYXJhbSBwYXRoIHRvIGRldGVybWluZSBuYW1lIGZvclxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlybmFtZShwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBhc3NlcnRQYXRoKHBhdGgpO1xuICBjb25zdCBsZW4gPSBwYXRoLmxlbmd0aDtcbiAgaWYgKGxlbiA9PT0gMCkgcmV0dXJuIFwiLlwiO1xuICBsZXQgcm9vdEVuZCA9IC0xO1xuICBsZXQgZW5kID0gLTE7XG4gIGxldCBtYXRjaGVkU2xhc2ggPSB0cnVlO1xuICBsZXQgb2Zmc2V0ID0gMDtcbiAgY29uc3QgY29kZSA9IHBhdGguY2hhckNvZGVBdCgwKTtcblxuICAvLyBUcnkgdG8gbWF0Y2ggYSByb290XG4gIGlmIChsZW4gPiAxKSB7XG4gICAgaWYgKGlzUGF0aFNlcGFyYXRvcihjb2RlKSkge1xuICAgICAgLy8gUG9zc2libGUgVU5DIHJvb3RcblxuICAgICAgcm9vdEVuZCA9IG9mZnNldCA9IDE7XG5cbiAgICAgIGlmIChpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KDEpKSkge1xuICAgICAgICAvLyBNYXRjaGVkIGRvdWJsZSBwYXRoIHNlcGFyYXRvciBhdCBiZWdpbm5pbmdcbiAgICAgICAgbGV0IGogPSAyO1xuICAgICAgICBsZXQgbGFzdCA9IGo7XG4gICAgICAgIC8vIE1hdGNoIDEgb3IgbW9yZSBub24tcGF0aCBzZXBhcmF0b3JzXG4gICAgICAgIGZvciAoOyBqIDwgbGVuOyArK2opIHtcbiAgICAgICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdChqKSkpIGJyZWFrO1xuICAgICAgICB9XG4gICAgICAgIGlmIChqIDwgbGVuICYmIGogIT09IGxhc3QpIHtcbiAgICAgICAgICAvLyBNYXRjaGVkIVxuICAgICAgICAgIGxhc3QgPSBqO1xuICAgICAgICAgIC8vIE1hdGNoIDEgb3IgbW9yZSBwYXRoIHNlcGFyYXRvcnNcbiAgICAgICAgICBmb3IgKDsgaiA8IGxlbjsgKytqKSB7XG4gICAgICAgICAgICBpZiAoIWlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoaikpKSBicmVhaztcbiAgICAgICAgICB9XG4gICAgICAgICAgaWYgKGogPCBsZW4gJiYgaiAhPT0gbGFzdCkge1xuICAgICAgICAgICAgLy8gTWF0Y2hlZCFcbiAgICAgICAgICAgIGxhc3QgPSBqO1xuICAgICAgICAgICAgLy8gTWF0Y2ggMSBvciBtb3JlIG5vbi1wYXRoIHNlcGFyYXRvcnNcbiAgICAgICAgICAgIGZvciAoOyBqIDwgbGVuOyArK2opIHtcbiAgICAgICAgICAgICAgaWYgKGlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoaikpKSBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChqID09PSBsZW4pIHtcbiAgICAgICAgICAgICAgLy8gV2UgbWF0Y2hlZCBhIFVOQyByb290IG9ubHlcbiAgICAgICAgICAgICAgcmV0dXJuIHBhdGg7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoaiAhPT0gbGFzdCkge1xuICAgICAgICAgICAgICAvLyBXZSBtYXRjaGVkIGEgVU5DIHJvb3Qgd2l0aCBsZWZ0b3ZlcnNcblxuICAgICAgICAgICAgICAvLyBPZmZzZXQgYnkgMSB0byBpbmNsdWRlIHRoZSBzZXBhcmF0b3IgYWZ0ZXIgdGhlIFVOQyByb290IHRvXG4gICAgICAgICAgICAgIC8vIHRyZWF0IGl0IGFzIGEgXCJub3JtYWwgcm9vdFwiIG9uIHRvcCBvZiBhIChVTkMpIHJvb3RcbiAgICAgICAgICAgICAgcm9vdEVuZCA9IG9mZnNldCA9IGogKyAxO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoaXNXaW5kb3dzRGV2aWNlUm9vdChjb2RlKSkge1xuICAgICAgLy8gUG9zc2libGUgZGV2aWNlIHJvb3RcblxuICAgICAgaWYgKHBhdGguY2hhckNvZGVBdCgxKSA9PT0gQ0hBUl9DT0xPTikge1xuICAgICAgICByb290RW5kID0gb2Zmc2V0ID0gMjtcbiAgICAgICAgaWYgKGxlbiA+IDIpIHtcbiAgICAgICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdCgyKSkpIHJvb3RFbmQgPSBvZmZzZXQgPSAzO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9IGVsc2UgaWYgKGlzUGF0aFNlcGFyYXRvcihjb2RlKSkge1xuICAgIC8vIGBwYXRoYCBjb250YWlucyBqdXN0IGEgcGF0aCBzZXBhcmF0b3IsIGV4aXQgZWFybHkgdG8gYXZvaWRcbiAgICAvLyB1bm5lY2Vzc2FyeSB3b3JrXG4gICAgcmV0dXJuIHBhdGg7XG4gIH1cblxuICBmb3IgKGxldCBpID0gbGVuIC0gMTsgaSA+PSBvZmZzZXQ7IC0taSkge1xuICAgIGlmIChpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KGkpKSkge1xuICAgICAgaWYgKCFtYXRjaGVkU2xhc2gpIHtcbiAgICAgICAgZW5kID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIFdlIHNhdyB0aGUgZmlyc3Qgbm9uLXBhdGggc2VwYXJhdG9yXG4gICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICB9XG4gIH1cblxuICBpZiAoZW5kID09PSAtMSkge1xuICAgIGlmIChyb290RW5kID09PSAtMSkgcmV0dXJuIFwiLlwiO1xuICAgIGVsc2UgZW5kID0gcm9vdEVuZDtcbiAgfVxuICByZXR1cm4gcGF0aC5zbGljZSgwLCBlbmQpO1xufVxuXG4vKipcbiAqIFJldHVybiB0aGUgbGFzdCBwb3J0aW9uIG9mIGEgYHBhdGhgLiBUcmFpbGluZyBkaXJlY3Rvcnkgc2VwYXJhdG9ycyBhcmUgaWdub3JlZC5cbiAqIEBwYXJhbSBwYXRoIHRvIHByb2Nlc3NcbiAqIEBwYXJhbSBleHQgb2YgcGF0aCBkaXJlY3RvcnlcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGJhc2VuYW1lKHBhdGg6IHN0cmluZywgZXh0ID0gXCJcIik6IHN0cmluZyB7XG4gIGlmIChleHQgIT09IHVuZGVmaW5lZCAmJiB0eXBlb2YgZXh0ICE9PSBcInN0cmluZ1wiKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcignXCJleHRcIiBhcmd1bWVudCBtdXN0IGJlIGEgc3RyaW5nJyk7XG4gIH1cblxuICBhc3NlcnRQYXRoKHBhdGgpO1xuXG4gIGxldCBzdGFydCA9IDA7XG4gIGxldCBlbmQgPSAtMTtcbiAgbGV0IG1hdGNoZWRTbGFzaCA9IHRydWU7XG4gIGxldCBpOiBudW1iZXI7XG5cbiAgLy8gQ2hlY2sgZm9yIGEgZHJpdmUgbGV0dGVyIHByZWZpeCBzbyBhcyBub3QgdG8gbWlzdGFrZSB0aGUgZm9sbG93aW5nXG4gIC8vIHBhdGggc2VwYXJhdG9yIGFzIGFuIGV4dHJhIHNlcGFyYXRvciBhdCB0aGUgZW5kIG9mIHRoZSBwYXRoIHRoYXQgY2FuIGJlXG4gIC8vIGRpc3JlZ2FyZGVkXG4gIGlmIChwYXRoLmxlbmd0aCA+PSAyKSB7XG4gICAgY29uc3QgZHJpdmUgPSBwYXRoLmNoYXJDb2RlQXQoMCk7XG4gICAgaWYgKGlzV2luZG93c0RldmljZVJvb3QoZHJpdmUpKSB7XG4gICAgICBpZiAocGF0aC5jaGFyQ29kZUF0KDEpID09PSBDSEFSX0NPTE9OKSBzdGFydCA9IDI7XG4gICAgfVxuICB9XG5cbiAgaWYgKGV4dCAhPT0gdW5kZWZpbmVkICYmIGV4dC5sZW5ndGggPiAwICYmIGV4dC5sZW5ndGggPD0gcGF0aC5sZW5ndGgpIHtcbiAgICBpZiAoZXh0Lmxlbmd0aCA9PT0gcGF0aC5sZW5ndGggJiYgZXh0ID09PSBwYXRoKSByZXR1cm4gXCJcIjtcbiAgICBsZXQgZXh0SWR4ID0gZXh0Lmxlbmd0aCAtIDE7XG4gICAgbGV0IGZpcnN0Tm9uU2xhc2hFbmQgPSAtMTtcbiAgICBmb3IgKGkgPSBwYXRoLmxlbmd0aCAtIDE7IGkgPj0gc3RhcnQ7IC0taSkge1xuICAgICAgY29uc3QgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICAgIGlmIChpc1BhdGhTZXBhcmF0b3IoY29kZSkpIHtcbiAgICAgICAgLy8gSWYgd2UgcmVhY2hlZCBhIHBhdGggc2VwYXJhdG9yIHRoYXQgd2FzIG5vdCBwYXJ0IG9mIGEgc2V0IG9mIHBhdGhcbiAgICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XG4gICAgICAgIGlmICghbWF0Y2hlZFNsYXNoKSB7XG4gICAgICAgICAgc3RhcnQgPSBpICsgMTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIHtcbiAgICAgICAgaWYgKGZpcnN0Tm9uU2xhc2hFbmQgPT09IC0xKSB7XG4gICAgICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3IsIHJlbWVtYmVyIHRoaXMgaW5kZXggaW4gY2FzZVxuICAgICAgICAgIC8vIHdlIG5lZWQgaXQgaWYgdGhlIGV4dGVuc2lvbiBlbmRzIHVwIG5vdCBtYXRjaGluZ1xuICAgICAgICAgIG1hdGNoZWRTbGFzaCA9IGZhbHNlO1xuICAgICAgICAgIGZpcnN0Tm9uU2xhc2hFbmQgPSBpICsgMTtcbiAgICAgICAgfVxuICAgICAgICBpZiAoZXh0SWR4ID49IDApIHtcbiAgICAgICAgICAvLyBUcnkgdG8gbWF0Y2ggdGhlIGV4cGxpY2l0IGV4dGVuc2lvblxuICAgICAgICAgIGlmIChjb2RlID09PSBleHQuY2hhckNvZGVBdChleHRJZHgpKSB7XG4gICAgICAgICAgICBpZiAoLS1leHRJZHggPT09IC0xKSB7XG4gICAgICAgICAgICAgIC8vIFdlIG1hdGNoZWQgdGhlIGV4dGVuc2lvbiwgc28gbWFyayB0aGlzIGFzIHRoZSBlbmQgb2Ygb3VyIHBhdGhcbiAgICAgICAgICAgICAgLy8gY29tcG9uZW50XG4gICAgICAgICAgICAgIGVuZCA9IGk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIEV4dGVuc2lvbiBkb2VzIG5vdCBtYXRjaCwgc28gb3VyIHJlc3VsdCBpcyB0aGUgZW50aXJlIHBhdGhcbiAgICAgICAgICAgIC8vIGNvbXBvbmVudFxuICAgICAgICAgICAgZXh0SWR4ID0gLTE7XG4gICAgICAgICAgICBlbmQgPSBmaXJzdE5vblNsYXNoRW5kO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChzdGFydCA9PT0gZW5kKSBlbmQgPSBmaXJzdE5vblNsYXNoRW5kO1xuICAgIGVsc2UgaWYgKGVuZCA9PT0gLTEpIGVuZCA9IHBhdGgubGVuZ3RoO1xuICAgIHJldHVybiBwYXRoLnNsaWNlKHN0YXJ0LCBlbmQpO1xuICB9IGVsc2Uge1xuICAgIGZvciAoaSA9IHBhdGgubGVuZ3RoIC0gMTsgaSA+PSBzdGFydDsgLS1pKSB7XG4gICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdChpKSkpIHtcbiAgICAgICAgLy8gSWYgd2UgcmVhY2hlZCBhIHBhdGggc2VwYXJhdG9yIHRoYXQgd2FzIG5vdCBwYXJ0IG9mIGEgc2V0IG9mIHBhdGhcbiAgICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XG4gICAgICAgIGlmICghbWF0Y2hlZFNsYXNoKSB7XG4gICAgICAgICAgc3RhcnQgPSBpICsgMTtcbiAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuICAgICAgfSBlbHNlIGlmIChlbmQgPT09IC0xKSB7XG4gICAgICAgIC8vIFdlIHNhdyB0aGUgZmlyc3Qgbm9uLXBhdGggc2VwYXJhdG9yLCBtYXJrIHRoaXMgYXMgdGhlIGVuZCBvZiBvdXJcbiAgICAgICAgLy8gcGF0aCBjb21wb25lbnRcbiAgICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XG4gICAgICAgIGVuZCA9IGkgKyAxO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlbmQgPT09IC0xKSByZXR1cm4gXCJcIjtcbiAgICByZXR1cm4gcGF0aC5zbGljZShzdGFydCwgZW5kKTtcbiAgfVxufVxuXG4vKipcbiAqIFJldHVybiB0aGUgZXh0ZW5zaW9uIG9mIHRoZSBgcGF0aGAuXG4gKiBAcGFyYW0gcGF0aCB3aXRoIGV4dGVuc2lvblxuICovXG5leHBvcnQgZnVuY3Rpb24gZXh0bmFtZShwYXRoOiBzdHJpbmcpOiBzdHJpbmcge1xuICBhc3NlcnRQYXRoKHBhdGgpO1xuICBsZXQgc3RhcnQgPSAwO1xuICBsZXQgc3RhcnREb3QgPSAtMTtcbiAgbGV0IHN0YXJ0UGFydCA9IDA7XG4gIGxldCBlbmQgPSAtMTtcbiAgbGV0IG1hdGNoZWRTbGFzaCA9IHRydWU7XG4gIC8vIFRyYWNrIHRoZSBzdGF0ZSBvZiBjaGFyYWN0ZXJzIChpZiBhbnkpIHdlIHNlZSBiZWZvcmUgb3VyIGZpcnN0IGRvdCBhbmRcbiAgLy8gYWZ0ZXIgYW55IHBhdGggc2VwYXJhdG9yIHdlIGZpbmRcbiAgbGV0IHByZURvdFN0YXRlID0gMDtcblxuICAvLyBDaGVjayBmb3IgYSBkcml2ZSBsZXR0ZXIgcHJlZml4IHNvIGFzIG5vdCB0byBtaXN0YWtlIHRoZSBmb2xsb3dpbmdcbiAgLy8gcGF0aCBzZXBhcmF0b3IgYXMgYW4gZXh0cmEgc2VwYXJhdG9yIGF0IHRoZSBlbmQgb2YgdGhlIHBhdGggdGhhdCBjYW4gYmVcbiAgLy8gZGlzcmVnYXJkZWRcblxuICBpZiAoXG4gICAgcGF0aC5sZW5ndGggPj0gMiAmJlxuICAgIHBhdGguY2hhckNvZGVBdCgxKSA9PT0gQ0hBUl9DT0xPTiAmJlxuICAgIGlzV2luZG93c0RldmljZVJvb3QocGF0aC5jaGFyQ29kZUF0KDApKVxuICApIHtcbiAgICBzdGFydCA9IHN0YXJ0UGFydCA9IDI7XG4gIH1cblxuICBmb3IgKGxldCBpID0gcGF0aC5sZW5ndGggLSAxOyBpID49IHN0YXJ0OyAtLWkpIHtcbiAgICBjb25zdCBjb2RlID0gcGF0aC5jaGFyQ29kZUF0KGkpO1xuICAgIGlmIChpc1BhdGhTZXBhcmF0b3IoY29kZSkpIHtcbiAgICAgIC8vIElmIHdlIHJlYWNoZWQgYSBwYXRoIHNlcGFyYXRvciB0aGF0IHdhcyBub3QgcGFydCBvZiBhIHNldCBvZiBwYXRoXG4gICAgICAvLyBzZXBhcmF0b3JzIGF0IHRoZSBlbmQgb2YgdGhlIHN0cmluZywgc3RvcCBub3dcbiAgICAgIGlmICghbWF0Y2hlZFNsYXNoKSB7XG4gICAgICAgIHN0YXJ0UGFydCA9IGkgKyAxO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cbiAgICAgIGNvbnRpbnVlO1xuICAgIH1cbiAgICBpZiAoZW5kID09PSAtMSkge1xuICAgICAgLy8gV2Ugc2F3IHRoZSBmaXJzdCBub24tcGF0aCBzZXBhcmF0b3IsIG1hcmsgdGhpcyBhcyB0aGUgZW5kIG9mIG91clxuICAgICAgLy8gZXh0ZW5zaW9uXG4gICAgICBtYXRjaGVkU2xhc2ggPSBmYWxzZTtcbiAgICAgIGVuZCA9IGkgKyAxO1xuICAgIH1cbiAgICBpZiAoY29kZSA9PT0gQ0hBUl9ET1QpIHtcbiAgICAgIC8vIElmIHRoaXMgaXMgb3VyIGZpcnN0IGRvdCwgbWFyayBpdCBhcyB0aGUgc3RhcnQgb2Ygb3VyIGV4dGVuc2lvblxuICAgICAgaWYgKHN0YXJ0RG90ID09PSAtMSkgc3RhcnREb3QgPSBpO1xuICAgICAgZWxzZSBpZiAocHJlRG90U3RhdGUgIT09IDEpIHByZURvdFN0YXRlID0gMTtcbiAgICB9IGVsc2UgaWYgKHN0YXJ0RG90ICE9PSAtMSkge1xuICAgICAgLy8gV2Ugc2F3IGEgbm9uLWRvdCBhbmQgbm9uLXBhdGggc2VwYXJhdG9yIGJlZm9yZSBvdXIgZG90LCBzbyB3ZSBzaG91bGRcbiAgICAgIC8vIGhhdmUgYSBnb29kIGNoYW5jZSBhdCBoYXZpbmcgYSBub24tZW1wdHkgZXh0ZW5zaW9uXG4gICAgICBwcmVEb3RTdGF0ZSA9IC0xO1xuICAgIH1cbiAgfVxuXG4gIGlmIChcbiAgICBzdGFydERvdCA9PT0gLTEgfHxcbiAgICBlbmQgPT09IC0xIHx8XG4gICAgLy8gV2Ugc2F3IGEgbm9uLWRvdCBjaGFyYWN0ZXIgaW1tZWRpYXRlbHkgYmVmb3JlIHRoZSBkb3RcbiAgICBwcmVEb3RTdGF0ZSA9PT0gMCB8fFxuICAgIC8vIFRoZSAocmlnaHQtbW9zdCkgdHJpbW1lZCBwYXRoIGNvbXBvbmVudCBpcyBleGFjdGx5ICcuLidcbiAgICAocHJlRG90U3RhdGUgPT09IDEgJiYgc3RhcnREb3QgPT09IGVuZCAtIDEgJiYgc3RhcnREb3QgPT09IHN0YXJ0UGFydCArIDEpXG4gICkge1xuICAgIHJldHVybiBcIlwiO1xuICB9XG4gIHJldHVybiBwYXRoLnNsaWNlKHN0YXJ0RG90LCBlbmQpO1xufVxuXG4vKipcbiAqIEdlbmVyYXRlIGEgcGF0aCBmcm9tIGBGb3JtYXRJbnB1dFBhdGhPYmplY3RgIG9iamVjdC5cbiAqIEBwYXJhbSBwYXRoT2JqZWN0IHdpdGggcGF0aFxuICovXG5leHBvcnQgZnVuY3Rpb24gZm9ybWF0KHBhdGhPYmplY3Q6IEZvcm1hdElucHV0UGF0aE9iamVjdCk6IHN0cmluZyB7XG4gIGlmIChwYXRoT2JqZWN0ID09PSBudWxsIHx8IHR5cGVvZiBwYXRoT2JqZWN0ICE9PSBcIm9iamVjdFwiKSB7XG4gICAgdGhyb3cgbmV3IFR5cGVFcnJvcihcbiAgICAgIGBUaGUgXCJwYXRoT2JqZWN0XCIgYXJndW1lbnQgbXVzdCBiZSBvZiB0eXBlIE9iamVjdC4gUmVjZWl2ZWQgdHlwZSAke3R5cGVvZiBwYXRoT2JqZWN0fWAsXG4gICAgKTtcbiAgfVxuICByZXR1cm4gX2Zvcm1hdChcIlxcXFxcIiwgcGF0aE9iamVjdCk7XG59XG5cbi8qKlxuICogUmV0dXJuIGEgYFBhcnNlZFBhdGhgIG9iamVjdCBvZiB0aGUgYHBhdGhgLlxuICogQHBhcmFtIHBhdGggdG8gcHJvY2Vzc1xuICovXG5leHBvcnQgZnVuY3Rpb24gcGFyc2UocGF0aDogc3RyaW5nKTogUGFyc2VkUGF0aCB7XG4gIGFzc2VydFBhdGgocGF0aCk7XG5cbiAgY29uc3QgcmV0OiBQYXJzZWRQYXRoID0geyByb290OiBcIlwiLCBkaXI6IFwiXCIsIGJhc2U6IFwiXCIsIGV4dDogXCJcIiwgbmFtZTogXCJcIiB9O1xuXG4gIGNvbnN0IGxlbiA9IHBhdGgubGVuZ3RoO1xuICBpZiAobGVuID09PSAwKSByZXR1cm4gcmV0O1xuXG4gIGxldCByb290RW5kID0gMDtcbiAgbGV0IGNvZGUgPSBwYXRoLmNoYXJDb2RlQXQoMCk7XG5cbiAgLy8gVHJ5IHRvIG1hdGNoIGEgcm9vdFxuICBpZiAobGVuID4gMSkge1xuICAgIGlmIChpc1BhdGhTZXBhcmF0b3IoY29kZSkpIHtcbiAgICAgIC8vIFBvc3NpYmxlIFVOQyByb290XG5cbiAgICAgIHJvb3RFbmQgPSAxO1xuICAgICAgaWYgKGlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoMSkpKSB7XG4gICAgICAgIC8vIE1hdGNoZWQgZG91YmxlIHBhdGggc2VwYXJhdG9yIGF0IGJlZ2lubmluZ1xuICAgICAgICBsZXQgaiA9IDI7XG4gICAgICAgIGxldCBsYXN0ID0gajtcbiAgICAgICAgLy8gTWF0Y2ggMSBvciBtb3JlIG5vbi1wYXRoIHNlcGFyYXRvcnNcbiAgICAgICAgZm9yICg7IGogPCBsZW47ICsraikge1xuICAgICAgICAgIGlmIChpc1BhdGhTZXBhcmF0b3IocGF0aC5jaGFyQ29kZUF0KGopKSkgYnJlYWs7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKGogPCBsZW4gJiYgaiAhPT0gbGFzdCkge1xuICAgICAgICAgIC8vIE1hdGNoZWQhXG4gICAgICAgICAgbGFzdCA9IGo7XG4gICAgICAgICAgLy8gTWF0Y2ggMSBvciBtb3JlIHBhdGggc2VwYXJhdG9yc1xuICAgICAgICAgIGZvciAoOyBqIDwgbGVuOyArK2opIHtcbiAgICAgICAgICAgIGlmICghaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdChqKSkpIGJyZWFrO1xuICAgICAgICAgIH1cbiAgICAgICAgICBpZiAoaiA8IGxlbiAmJiBqICE9PSBsYXN0KSB7XG4gICAgICAgICAgICAvLyBNYXRjaGVkIVxuICAgICAgICAgICAgbGFzdCA9IGo7XG4gICAgICAgICAgICAvLyBNYXRjaCAxIG9yIG1vcmUgbm9uLXBhdGggc2VwYXJhdG9yc1xuICAgICAgICAgICAgZm9yICg7IGogPCBsZW47ICsraikge1xuICAgICAgICAgICAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKHBhdGguY2hhckNvZGVBdChqKSkpIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKGogPT09IGxlbikge1xuICAgICAgICAgICAgICAvLyBXZSBtYXRjaGVkIGEgVU5DIHJvb3Qgb25seVxuXG4gICAgICAgICAgICAgIHJvb3RFbmQgPSBqO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChqICE9PSBsYXN0KSB7XG4gICAgICAgICAgICAgIC8vIFdlIG1hdGNoZWQgYSBVTkMgcm9vdCB3aXRoIGxlZnRvdmVyc1xuXG4gICAgICAgICAgICAgIHJvb3RFbmQgPSBqICsgMTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGlzV2luZG93c0RldmljZVJvb3QoY29kZSkpIHtcbiAgICAgIC8vIFBvc3NpYmxlIGRldmljZSByb290XG5cbiAgICAgIGlmIChwYXRoLmNoYXJDb2RlQXQoMSkgPT09IENIQVJfQ09MT04pIHtcbiAgICAgICAgcm9vdEVuZCA9IDI7XG4gICAgICAgIGlmIChsZW4gPiAyKSB7XG4gICAgICAgICAgaWYgKGlzUGF0aFNlcGFyYXRvcihwYXRoLmNoYXJDb2RlQXQoMikpKSB7XG4gICAgICAgICAgICBpZiAobGVuID09PSAzKSB7XG4gICAgICAgICAgICAgIC8vIGBwYXRoYCBjb250YWlucyBqdXN0IGEgZHJpdmUgcm9vdCwgZXhpdCBlYXJseSB0byBhdm9pZFxuICAgICAgICAgICAgICAvLyB1bm5lY2Vzc2FyeSB3b3JrXG4gICAgICAgICAgICAgIHJldC5yb290ID0gcmV0LmRpciA9IHBhdGg7XG4gICAgICAgICAgICAgIHJldHVybiByZXQ7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByb290RW5kID0gMztcbiAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgLy8gYHBhdGhgIGNvbnRhaW5zIGp1c3QgYSBkcml2ZSByb290LCBleGl0IGVhcmx5IHRvIGF2b2lkXG4gICAgICAgICAgLy8gdW5uZWNlc3Nhcnkgd29ya1xuICAgICAgICAgIHJldC5yb290ID0gcmV0LmRpciA9IHBhdGg7XG4gICAgICAgICAgcmV0dXJuIHJldDtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH1cbiAgfSBlbHNlIGlmIChpc1BhdGhTZXBhcmF0b3IoY29kZSkpIHtcbiAgICAvLyBgcGF0aGAgY29udGFpbnMganVzdCBhIHBhdGggc2VwYXJhdG9yLCBleGl0IGVhcmx5IHRvIGF2b2lkXG4gICAgLy8gdW5uZWNlc3Nhcnkgd29ya1xuICAgIHJldC5yb290ID0gcmV0LmRpciA9IHBhdGg7XG4gICAgcmV0dXJuIHJldDtcbiAgfVxuXG4gIGlmIChyb290RW5kID4gMCkgcmV0LnJvb3QgPSBwYXRoLnNsaWNlKDAsIHJvb3RFbmQpO1xuXG4gIGxldCBzdGFydERvdCA9IC0xO1xuICBsZXQgc3RhcnRQYXJ0ID0gcm9vdEVuZDtcbiAgbGV0IGVuZCA9IC0xO1xuICBsZXQgbWF0Y2hlZFNsYXNoID0gdHJ1ZTtcbiAgbGV0IGkgPSBwYXRoLmxlbmd0aCAtIDE7XG5cbiAgLy8gVHJhY2sgdGhlIHN0YXRlIG9mIGNoYXJhY3RlcnMgKGlmIGFueSkgd2Ugc2VlIGJlZm9yZSBvdXIgZmlyc3QgZG90IGFuZFxuICAvLyBhZnRlciBhbnkgcGF0aCBzZXBhcmF0b3Igd2UgZmluZFxuICBsZXQgcHJlRG90U3RhdGUgPSAwO1xuXG4gIC8vIEdldCBub24tZGlyIGluZm9cbiAgZm9yICg7IGkgPj0gcm9vdEVuZDsgLS1pKSB7XG4gICAgY29kZSA9IHBhdGguY2hhckNvZGVBdChpKTtcbiAgICBpZiAoaXNQYXRoU2VwYXJhdG9yKGNvZGUpKSB7XG4gICAgICAvLyBJZiB3ZSByZWFjaGVkIGEgcGF0aCBzZXBhcmF0b3IgdGhhdCB3YXMgbm90IHBhcnQgb2YgYSBzZXQgb2YgcGF0aFxuICAgICAgLy8gc2VwYXJhdG9ycyBhdCB0aGUgZW5kIG9mIHRoZSBzdHJpbmcsIHN0b3Agbm93XG4gICAgICBpZiAoIW1hdGNoZWRTbGFzaCkge1xuICAgICAgICBzdGFydFBhcnQgPSBpICsgMTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgICBjb250aW51ZTtcbiAgICB9XG4gICAgaWYgKGVuZCA9PT0gLTEpIHtcbiAgICAgIC8vIFdlIHNhdyB0aGUgZmlyc3Qgbm9uLXBhdGggc2VwYXJhdG9yLCBtYXJrIHRoaXMgYXMgdGhlIGVuZCBvZiBvdXJcbiAgICAgIC8vIGV4dGVuc2lvblxuICAgICAgbWF0Y2hlZFNsYXNoID0gZmFsc2U7XG4gICAgICBlbmQgPSBpICsgMTtcbiAgICB9XG4gICAgaWYgKGNvZGUgPT09IENIQVJfRE9UKSB7XG4gICAgICAvLyBJZiB0aGlzIGlzIG91ciBmaXJzdCBkb3QsIG1hcmsgaXQgYXMgdGhlIHN0YXJ0IG9mIG91ciBleHRlbnNpb25cbiAgICAgIGlmIChzdGFydERvdCA9PT0gLTEpIHN0YXJ0RG90ID0gaTtcbiAgICAgIGVsc2UgaWYgKHByZURvdFN0YXRlICE9PSAxKSBwcmVEb3RTdGF0ZSA9IDE7XG4gICAgfSBlbHNlIGlmIChzdGFydERvdCAhPT0gLTEpIHtcbiAgICAgIC8vIFdlIHNhdyBhIG5vbi1kb3QgYW5kIG5vbi1wYXRoIHNlcGFyYXRvciBiZWZvcmUgb3VyIGRvdCwgc28gd2Ugc2hvdWxkXG4gICAgICAvLyBoYXZlIGEgZ29vZCBjaGFuY2UgYXQgaGF2aW5nIGEgbm9uLWVtcHR5IGV4dGVuc2lvblxuICAgICAgcHJlRG90U3RhdGUgPSAtMTtcbiAgICB9XG4gIH1cblxuICBpZiAoXG4gICAgc3RhcnREb3QgPT09IC0xIHx8XG4gICAgZW5kID09PSAtMSB8fFxuICAgIC8vIFdlIHNhdyBhIG5vbi1kb3QgY2hhcmFjdGVyIGltbWVkaWF0ZWx5IGJlZm9yZSB0aGUgZG90XG4gICAgcHJlRG90U3RhdGUgPT09IDAgfHxcbiAgICAvLyBUaGUgKHJpZ2h0LW1vc3QpIHRyaW1tZWQgcGF0aCBjb21wb25lbnQgaXMgZXhhY3RseSAnLi4nXG4gICAgKHByZURvdFN0YXRlID09PSAxICYmIHN0YXJ0RG90ID09PSBlbmQgLSAxICYmIHN0YXJ0RG90ID09PSBzdGFydFBhcnQgKyAxKVxuICApIHtcbiAgICBpZiAoZW5kICE9PSAtMSkge1xuICAgICAgcmV0LmJhc2UgPSByZXQubmFtZSA9IHBhdGguc2xpY2Uoc3RhcnRQYXJ0LCBlbmQpO1xuICAgIH1cbiAgfSBlbHNlIHtcbiAgICByZXQubmFtZSA9IHBhdGguc2xpY2Uoc3RhcnRQYXJ0LCBzdGFydERvdCk7XG4gICAgcmV0LmJhc2UgPSBwYXRoLnNsaWNlKHN0YXJ0UGFydCwgZW5kKTtcbiAgICByZXQuZXh0ID0gcGF0aC5zbGljZShzdGFydERvdCwgZW5kKTtcbiAgfVxuXG4gIC8vIElmIHRoZSBkaXJlY3RvcnkgaXMgdGhlIHJvb3QsIHVzZSB0aGUgZW50aXJlIHJvb3QgYXMgdGhlIGBkaXJgIGluY2x1ZGluZ1xuICAvLyB0aGUgdHJhaWxpbmcgc2xhc2ggaWYgYW55IChgQzpcXGFiY2AgLT4gYEM6XFxgKS4gT3RoZXJ3aXNlLCBzdHJpcCBvdXQgdGhlXG4gIC8vIHRyYWlsaW5nIHNsYXNoIChgQzpcXGFiY1xcZGVmYCAtPiBgQzpcXGFiY2ApLlxuICBpZiAoc3RhcnRQYXJ0ID4gMCAmJiBzdGFydFBhcnQgIT09IHJvb3RFbmQpIHtcbiAgICByZXQuZGlyID0gcGF0aC5zbGljZSgwLCBzdGFydFBhcnQgLSAxKTtcbiAgfSBlbHNlIHJldC5kaXIgPSByZXQucm9vdDtcblxuICByZXR1cm4gcmV0O1xufVxuXG4vKipcbiAqIENvbnZlcnRzIGEgZmlsZSBVUkwgdG8gYSBwYXRoIHN0cmluZy5cbiAqXG4gKiAgICAgIGZyb21GaWxlVXJsKFwiZmlsZTovLy9ob21lL2Zvb1wiKTsgLy8gXCJcXFxcaG9tZVxcXFxmb29cIlxuICogICAgICBmcm9tRmlsZVVybChcImZpbGU6Ly8vQzovVXNlcnMvZm9vXCIpOyAvLyBcIkM6XFxcXFVzZXJzXFxcXGZvb1wiXG4gKiAgICAgIGZyb21GaWxlVXJsKFwiZmlsZTovL2xvY2FsaG9zdC9ob21lL2Zvb1wiKTsgLy8gXCJcXFxcXFxcXGxvY2FsaG9zdFxcXFxob21lXFxcXGZvb1wiXG4gKiBAcGFyYW0gdXJsIG9mIGEgZmlsZSBVUkxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGZyb21GaWxlVXJsKHVybDogc3RyaW5nIHwgVVJMKTogc3RyaW5nIHtcbiAgdXJsID0gdXJsIGluc3RhbmNlb2YgVVJMID8gdXJsIDogbmV3IFVSTCh1cmwpO1xuICBpZiAodXJsLnByb3RvY29sICE9IFwiZmlsZTpcIikge1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJNdXN0IGJlIGEgZmlsZSBVUkwuXCIpO1xuICB9XG4gIGxldCBwYXRoID0gZGVjb2RlVVJJQ29tcG9uZW50KFxuICAgIHVybC5wYXRobmFtZS5yZXBsYWNlKC9cXC8vZywgXCJcXFxcXCIpLnJlcGxhY2UoLyUoPyFbMC05QS1GYS1mXXsyfSkvZywgXCIlMjVcIiksXG4gICkucmVwbGFjZSgvXlxcXFwqKFtBLVphLXpdOikoXFxcXHwkKS8sIFwiJDFcXFxcXCIpO1xuICBpZiAodXJsLmhvc3RuYW1lICE9IFwiXCIpIHtcbiAgICAvLyBOb3RlOiBUaGUgYFVSTGAgaW1wbGVtZW50YXRpb24gZ3VhcmFudGVlcyB0aGF0IHRoZSBkcml2ZSBsZXR0ZXIgYW5kXG4gICAgLy8gaG9zdG5hbWUgYXJlIG11dHVhbGx5IGV4Y2x1c2l2ZS4gT3RoZXJ3aXNlIGl0IHdvdWxkIG5vdCBoYXZlIGJlZW4gdmFsaWRcbiAgICAvLyB0byBhcHBlbmQgdGhlIGhvc3RuYW1lIGFuZCBwYXRoIGxpa2UgdGhpcy5cbiAgICBwYXRoID0gYFxcXFxcXFxcJHt1cmwuaG9zdG5hbWV9JHtwYXRofWA7XG4gIH1cbiAgcmV0dXJuIHBhdGg7XG59XG5cbi8qKlxuICogQ29udmVydHMgYSBwYXRoIHN0cmluZyB0byBhIGZpbGUgVVJMLlxuICpcbiAqICAgICAgdG9GaWxlVXJsKFwiXFxcXGhvbWVcXFxcZm9vXCIpOyAvLyBuZXcgVVJMKFwiZmlsZTovLy9ob21lL2Zvb1wiKVxuICogICAgICB0b0ZpbGVVcmwoXCJDOlxcXFxVc2Vyc1xcXFxmb29cIik7IC8vIG5ldyBVUkwoXCJmaWxlOi8vL0M6L1VzZXJzL2Zvb1wiKVxuICogICAgICB0b0ZpbGVVcmwoXCJcXFxcXFxcXDEyNy4wLjAuMVxcXFxob21lXFxcXGZvb1wiKTsgLy8gbmV3IFVSTChcImZpbGU6Ly8xMjcuMC4wLjEvaG9tZS9mb29cIilcbiAqIEBwYXJhbSBwYXRoIHRvIGNvbnZlcnQgdG8gZmlsZSBVUkxcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHRvRmlsZVVybChwYXRoOiBzdHJpbmcpOiBVUkwge1xuICBpZiAoIWlzQWJzb2x1dGUocGF0aCkpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFwiTXVzdCBiZSBhbiBhYnNvbHV0ZSBwYXRoLlwiKTtcbiAgfVxuICBjb25zdCBbLCBob3N0bmFtZSwgcGF0aG5hbWVdID0gcGF0aC5tYXRjaChcbiAgICAvXig/OlsvXFxcXF17Mn0oW14vXFxcXF0rKSg/PVsvXFxcXF0oPzpbXi9cXFxcXXwkKSkpPyguKikvLFxuICApITtcbiAgY29uc3QgdXJsID0gbmV3IFVSTChcImZpbGU6Ly8vXCIpO1xuICB1cmwucGF0aG5hbWUgPSBlbmNvZGVXaGl0ZXNwYWNlKHBhdGhuYW1lLnJlcGxhY2UoLyUvZywgXCIlMjVcIikpO1xuICBpZiAoaG9zdG5hbWUgIT0gbnVsbCAmJiBob3N0bmFtZSAhPSBcImxvY2FsaG9zdFwiKSB7XG4gICAgdXJsLmhvc3RuYW1lID0gaG9zdG5hbWU7XG4gICAgaWYgKCF1cmwuaG9zdG5hbWUpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXCJJbnZhbGlkIGhvc3RuYW1lLlwiKTtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIHVybDtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFLQSxNQUFNLEdBQ0osbUJBQW1CLEVBQ25CLFVBQVUsRUFDVixRQUFRLEVBQ1Isa0JBQWtCLFFBQ2IsQ0FBaUI7QUFFeEIsTUFBTSxHQUNKLE9BQU8sRUFDUCxVQUFVLEVBQ1YsZ0JBQWdCLEVBQ2hCLGVBQWUsRUFDZixtQkFBbUIs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