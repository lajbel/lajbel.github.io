// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { notImplemented } from "../_utils.ts";
export function isFileOptions(fileOptions) {
    if (!fileOptions) return false;
    return fileOptions.encoding != undefined || fileOptions.flag != undefined || fileOptions.mode != undefined;
}
export function getEncoding(optOrCallback) {
    if (!optOrCallback || typeof optOrCallback === "function") {
        return null;
    }
    const encoding = typeof optOrCallback === "string" ? optOrCallback : optOrCallback.encoding;
    if (!encoding) return null;
    return encoding;
}
export function checkEncoding(encoding) {
    if (!encoding) return null;
    encoding = encoding.toLowerCase();
    if ([
        "utf8",
        "hex",
        "base64"
    ].includes(encoding)) return encoding;
    if (encoding === "utf-8") {
        return "utf8";
    }
    if (encoding === "binary") {
        return "binary";
    // before this was buffer, however buffer is not used in Node
    // node -e "require('fs').readFile('../world.txt', 'buffer', console.log)"
    }
    const notImplementedEncodings = [
        "utf16le",
        "latin1",
        "ascii",
        "ucs2"
    ];
    if (notImplementedEncodings.includes(encoding)) {
        notImplemented(`"${encoding}" encoding`);
    }
    throw new Error(`The value "${encoding}" is invalid for option "encoding"`);
}
export function getOpenOptions(flag) {
    if (!flag) {
        return {
            create: true,
            append: true
        };
    }
    let openOptions;
    switch(flag){
        case "a":
            {
                // 'a': Open file for appending. The file is created if it does not exist.
                openOptions = {
                    create: true,
                    append: true
                };
                break;
            }
        case "ax":
            {
                // 'ax': Like 'a' but fails if the path exists.
                openOptions = {
                    createNew: true,
                    write: true,
                    append: true
                };
                break;
            }
        case "a+":
            {
                // 'a+': Open file for reading and appending. The file is created if it does not exist.
                openOptions = {
                    read: true,
                    create: true,
                    append: true
                };
                break;
            }
        case "ax+":
            {
                // 'ax+': Like 'a+' but fails if the path exists.
                openOptions = {
                    read: true,
                    createNew: true,
                    append: true
                };
                break;
            }
        case "r":
            {
                // 'r': Open file for reading. An exception occurs if the file does not exist.
                openOptions = {
                    read: true
                };
                break;
            }
        case "r+":
            {
                // 'r+': Open file for reading and writing. An exception occurs if the file does not exist.
                openOptions = {
                    read: true,
                    write: true
                };
                break;
            }
        case "w":
            {
                // 'w': Open file for writing. The file is created (if it does not exist) or truncated (if it exists).
                openOptions = {
                    create: true,
                    write: true,
                    truncate: true
                };
                break;
            }
        case "wx":
            {
                // 'wx': Like 'w' but fails if the path exists.
                openOptions = {
                    createNew: true,
                    write: true
                };
                break;
            }
        case "w+":
            {
                // 'w+': Open file for reading and writing. The file is created (if it does not exist) or truncated (if it exists).
                openOptions = {
                    create: true,
                    write: true,
                    truncate: true,
                    read: true
                };
                break;
            }
        case "wx+":
            {
                // 'wx+': Like 'w+' but fails if the path exists.
                openOptions = {
                    createNew: true,
                    write: true,
                    read: true
                };
                break;
            }
        case "as":
            {
                // 'as': Open file for appending in synchronous mode. The file is created if it does not exist.
                openOptions = {
                    create: true,
                    append: true
                };
                break;
            }
        case "as+":
            {
                // 'as+': Open file for reading and appending in synchronous mode. The file is created if it does not exist.
                openOptions = {
                    create: true,
                    read: true,
                    append: true
                };
                break;
            }
        case "rs+":
            {
                // 'rs+': Open file for reading and writing in synchronous mode. Instructs the operating system to bypass the local file system cache.
                openOptions = {
                    create: true,
                    read: true,
                    write: true
                };
                break;
            }
        default:
            {
                throw new Error(`Unrecognized file system flag: ${flag}`);
            }
    }
    return openOptions;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjk4LjAvbm9kZS9fZnMvX2ZzX2NvbW1vbi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0IHtcbiAgQmluYXJ5RW5jb2RpbmdzLFxuICBFbmNvZGluZ3MsXG4gIG5vdEltcGxlbWVudGVkLFxuICBUZXh0RW5jb2RpbmdzLFxufSBmcm9tIFwiLi4vX3V0aWxzLnRzXCI7XG5cbmV4cG9ydCB0eXBlIENhbGxiYWNrV2l0aEVycm9yID0gKGVycjogRXJyb3IgfCBudWxsKSA9PiB2b2lkO1xuXG5leHBvcnQgaW50ZXJmYWNlIEZpbGVPcHRpb25zIHtcbiAgZW5jb2Rpbmc/OiBFbmNvZGluZ3M7XG4gIGZsYWc/OiBzdHJpbmc7XG59XG5cbmV4cG9ydCB0eXBlIFRleHRPcHRpb25zQXJndW1lbnQgPVxuICB8IFRleHRFbmNvZGluZ3NcbiAgfCAoeyBlbmNvZGluZzogVGV4dEVuY29kaW5ncyB9ICYgRmlsZU9wdGlvbnMpO1xuZXhwb3J0IHR5cGUgQmluYXJ5T3B0aW9uc0FyZ3VtZW50ID1cbiAgfCBCaW5hcnlFbmNvZGluZ3NcbiAgfCAoeyBlbmNvZGluZzogQmluYXJ5RW5jb2RpbmdzIH0gJiBGaWxlT3B0aW9ucyk7XG5leHBvcnQgdHlwZSBGaWxlT3B0aW9uc0FyZ3VtZW50ID0gRW5jb2RpbmdzIHwgRmlsZU9wdGlvbnM7XG5cbmV4cG9ydCBpbnRlcmZhY2UgV3JpdGVGaWxlT3B0aW9ucyBleHRlbmRzIEZpbGVPcHRpb25zIHtcbiAgbW9kZT86IG51bWJlcjtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGlzRmlsZU9wdGlvbnMoXG4gIGZpbGVPcHRpb25zOiBzdHJpbmcgfCBXcml0ZUZpbGVPcHRpb25zIHwgdW5kZWZpbmVkLFxuKTogZmlsZU9wdGlvbnMgaXMgRmlsZU9wdGlvbnMge1xuICBpZiAoIWZpbGVPcHRpb25zKSByZXR1cm4gZmFsc2U7XG5cbiAgcmV0dXJuIChcbiAgICAoZmlsZU9wdGlvbnMgYXMgRmlsZU9wdGlvbnMpLmVuY29kaW5nICE9IHVuZGVmaW5lZCB8fFxuICAgIChmaWxlT3B0aW9ucyBhcyBGaWxlT3B0aW9ucykuZmxhZyAhPSB1bmRlZmluZWQgfHxcbiAgICAoZmlsZU9wdGlvbnMgYXMgV3JpdGVGaWxlT3B0aW9ucykubW9kZSAhPSB1bmRlZmluZWRcbiAgKTtcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGdldEVuY29kaW5nKFxuICBvcHRPckNhbGxiYWNrPzpcbiAgICB8IEZpbGVPcHRpb25zXG4gICAgfCBXcml0ZUZpbGVPcHRpb25zXG4gICAgLy8gZGVuby1saW50LWlnbm9yZSBuby1leHBsaWNpdC1hbnlcbiAgICB8ICgoLi4uYXJnczogYW55W10pID0+IGFueSlcbiAgICB8IEVuY29kaW5nc1xuICAgIHwgbnVsbCxcbik6IEVuY29kaW5ncyB8IG51bGwge1xuICBpZiAoIW9wdE9yQ2FsbGJhY2sgfHwgdHlwZW9mIG9wdE9yQ2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIikge1xuICAgIHJldHVybiBudWxsO1xuICB9XG5cbiAgY29uc3QgZW5jb2RpbmcgPSB0eXBlb2Ygb3B0T3JDYWxsYmFjayA9PT0gXCJzdHJpbmdcIlxuICAgID8gb3B0T3JDYWxsYmFja1xuICAgIDogb3B0T3JDYWxsYmFjay5lbmNvZGluZztcbiAgaWYgKCFlbmNvZGluZykgcmV0dXJuIG51bGw7XG4gIHJldHVybiBlbmNvZGluZztcbn1cblxuZXhwb3J0IGZ1bmN0aW9uIGNoZWNrRW5jb2RpbmcoZW5jb2Rpbmc6IEVuY29kaW5ncyB8IG51bGwpOiBFbmNvZGluZ3MgfCBudWxsIHtcbiAgaWYgKCFlbmNvZGluZykgcmV0dXJuIG51bGw7XG5cbiAgZW5jb2RpbmcgPSBlbmNvZGluZy50b0xvd2VyQ2FzZSgpIGFzIEVuY29kaW5ncztcbiAgaWYgKFtcInV0ZjhcIiwgXCJoZXhcIiwgXCJiYXNlNjRcIl0uaW5jbHVkZXMoZW5jb2RpbmcpKSByZXR1cm4gZW5jb2Rpbmc7XG5cbiAgaWYgKGVuY29kaW5nID09PSBcInV0Zi04XCIpIHtcbiAgICByZXR1cm4gXCJ1dGY4XCI7XG4gIH1cbiAgaWYgKGVuY29kaW5nID09PSBcImJpbmFyeVwiKSB7XG4gICAgcmV0dXJuIFwiYmluYXJ5XCI7XG4gICAgLy8gYmVmb3JlIHRoaXMgd2FzIGJ1ZmZlciwgaG93ZXZlciBidWZmZXIgaXMgbm90IHVzZWQgaW4gTm9kZVxuICAgIC8vIG5vZGUgLWUgXCJyZXF1aXJlKCdmcycpLnJlYWRGaWxlKCcuLi93b3JsZC50eHQnLCAnYnVmZmVyJywgY29uc29sZS5sb2cpXCJcbiAgfVxuXG4gIGNvbnN0IG5vdEltcGxlbWVudGVkRW5jb2RpbmdzID0gW1widXRmMTZsZVwiLCBcImxhdGluMVwiLCBcImFzY2lpXCIsIFwidWNzMlwiXTtcblxuICBpZiAobm90SW1wbGVtZW50ZWRFbmNvZGluZ3MuaW5jbHVkZXMoZW5jb2RpbmcgYXMgc3RyaW5nKSkge1xuICAgIG5vdEltcGxlbWVudGVkKGBcIiR7ZW5jb2Rpbmd9XCIgZW5jb2RpbmdgKTtcbiAgfVxuXG4gIHRocm93IG5ldyBFcnJvcihgVGhlIHZhbHVlIFwiJHtlbmNvZGluZ31cIiBpcyBpbnZhbGlkIGZvciBvcHRpb24gXCJlbmNvZGluZ1wiYCk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRPcGVuT3B0aW9ucyhmbGFnOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBEZW5vLk9wZW5PcHRpb25zIHtcbiAgaWYgKCFmbGFnKSB7XG4gICAgcmV0dXJuIHsgY3JlYXRlOiB0cnVlLCBhcHBlbmQ6IHRydWUgfTtcbiAgfVxuXG4gIGxldCBvcGVuT3B0aW9uczogRGVuby5PcGVuT3B0aW9ucztcbiAgc3dpdGNoIChmbGFnKSB7XG4gICAgY2FzZSBcImFcIjoge1xuICAgICAgLy8gJ2EnOiBPcGVuIGZpbGUgZm9yIGFwcGVuZGluZy4gVGhlIGZpbGUgaXMgY3JlYXRlZCBpZiBpdCBkb2VzIG5vdCBleGlzdC5cbiAgICAgIG9wZW5PcHRpb25zID0geyBjcmVhdGU6IHRydWUsIGFwcGVuZDogdHJ1ZSB9O1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgXCJheFwiOiB7XG4gICAgICAvLyAnYXgnOiBMaWtlICdhJyBidXQgZmFpbHMgaWYgdGhlIHBhdGggZXhpc3RzLlxuICAgICAgb3Blbk9wdGlvbnMgPSB7IGNyZWF0ZU5ldzogdHJ1ZSwgd3JpdGU6IHRydWUsIGFwcGVuZDogdHJ1ZSB9O1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgXCJhK1wiOiB7XG4gICAgICAvLyAnYSsnOiBPcGVuIGZpbGUgZm9yIHJlYWRpbmcgYW5kIGFwcGVuZGluZy4gVGhlIGZpbGUgaXMgY3JlYXRlZCBpZiBpdCBkb2VzIG5vdCBleGlzdC5cbiAgICAgIG9wZW5PcHRpb25zID0geyByZWFkOiB0cnVlLCBjcmVhdGU6IHRydWUsIGFwcGVuZDogdHJ1ZSB9O1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgXCJheCtcIjoge1xuICAgICAgLy8gJ2F4Kyc6IExpa2UgJ2ErJyBidXQgZmFpbHMgaWYgdGhlIHBhdGggZXhpc3RzLlxuICAgICAgb3Blbk9wdGlvbnMgPSB7IHJlYWQ6IHRydWUsIGNyZWF0ZU5ldzogdHJ1ZSwgYXBwZW5kOiB0cnVlIH07XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSBcInJcIjoge1xuICAgICAgLy8gJ3InOiBPcGVuIGZpbGUgZm9yIHJlYWRpbmcuIEFuIGV4Y2VwdGlvbiBvY2N1cnMgaWYgdGhlIGZpbGUgZG9lcyBub3QgZXhpc3QuXG4gICAgICBvcGVuT3B0aW9ucyA9IHsgcmVhZDogdHJ1ZSB9O1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgXCJyK1wiOiB7XG4gICAgICAvLyAncisnOiBPcGVuIGZpbGUgZm9yIHJlYWRpbmcgYW5kIHdyaXRpbmcuIEFuIGV4Y2VwdGlvbiBvY2N1cnMgaWYgdGhlIGZpbGUgZG9lcyBub3QgZXhpc3QuXG4gICAgICBvcGVuT3B0aW9ucyA9IHsgcmVhZDogdHJ1ZSwgd3JpdGU6IHRydWUgfTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlIFwid1wiOiB7XG4gICAgICAvLyAndyc6IE9wZW4gZmlsZSBmb3Igd3JpdGluZy4gVGhlIGZpbGUgaXMgY3JlYXRlZCAoaWYgaXQgZG9lcyBub3QgZXhpc3QpIG9yIHRydW5jYXRlZCAoaWYgaXQgZXhpc3RzKS5cbiAgICAgIG9wZW5PcHRpb25zID0geyBjcmVhdGU6IHRydWUsIHdyaXRlOiB0cnVlLCB0cnVuY2F0ZTogdHJ1ZSB9O1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgXCJ3eFwiOiB7XG4gICAgICAvLyAnd3gnOiBMaWtlICd3JyBidXQgZmFpbHMgaWYgdGhlIHBhdGggZXhpc3RzLlxuICAgICAgb3Blbk9wdGlvbnMgPSB7IGNyZWF0ZU5ldzogdHJ1ZSwgd3JpdGU6IHRydWUgfTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlIFwidytcIjoge1xuICAgICAgLy8gJ3crJzogT3BlbiBmaWxlIGZvciByZWFkaW5nIGFuZCB3cml0aW5nLiBUaGUgZmlsZSBpcyBjcmVhdGVkIChpZiBpdCBkb2VzIG5vdCBleGlzdCkgb3IgdHJ1bmNhdGVkIChpZiBpdCBleGlzdHMpLlxuICAgICAgb3Blbk9wdGlvbnMgPSB7IGNyZWF0ZTogdHJ1ZSwgd3JpdGU6IHRydWUsIHRydW5jYXRlOiB0cnVlLCByZWFkOiB0cnVlIH07XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSBcInd4K1wiOiB7XG4gICAgICAvLyAnd3grJzogTGlrZSAndysnIGJ1dCBmYWlscyBpZiB0aGUgcGF0aCBleGlzdHMuXG4gICAgICBvcGVuT3B0aW9ucyA9IHsgY3JlYXRlTmV3OiB0cnVlLCB3cml0ZTogdHJ1ZSwgcmVhZDogdHJ1ZSB9O1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgXCJhc1wiOiB7XG4gICAgICAvLyAnYXMnOiBPcGVuIGZpbGUgZm9yIGFwcGVuZGluZyBpbiBzeW5jaHJvbm91cyBtb2RlLiBUaGUgZmlsZSBpcyBjcmVhdGVkIGlmIGl0IGRvZXMgbm90IGV4aXN0LlxuICAgICAgb3Blbk9wdGlvbnMgPSB7IGNyZWF0ZTogdHJ1ZSwgYXBwZW5kOiB0cnVlIH07XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSBcImFzK1wiOiB7XG4gICAgICAvLyAnYXMrJzogT3BlbiBmaWxlIGZvciByZWFkaW5nIGFuZCBhcHBlbmRpbmcgaW4gc3luY2hyb25vdXMgbW9kZS4gVGhlIGZpbGUgaXMgY3JlYXRlZCBpZiBpdCBkb2VzIG5vdCBleGlzdC5cbiAgICAgIG9wZW5PcHRpb25zID0geyBjcmVhdGU6IHRydWUsIHJlYWQ6IHRydWUsIGFwcGVuZDogdHJ1ZSB9O1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgXCJycytcIjoge1xuICAgICAgLy8gJ3JzKyc6IE9wZW4gZmlsZSBmb3IgcmVhZGluZyBhbmQgd3JpdGluZyBpbiBzeW5jaHJvbm91cyBtb2RlLiBJbnN0cnVjdHMgdGhlIG9wZXJhdGluZyBzeXN0ZW0gdG8gYnlwYXNzIHRoZSBsb2NhbCBmaWxlIHN5c3RlbSBjYWNoZS5cbiAgICAgIG9wZW5PcHRpb25zID0geyBjcmVhdGU6IHRydWUsIHJlYWQ6IHRydWUsIHdyaXRlOiB0cnVlIH07XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgZGVmYXVsdDoge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKGBVbnJlY29nbml6ZWQgZmlsZSBzeXN0ZW0gZmxhZzogJHtmbGFnfWApO1xuICAgIH1cbiAgfVxuXG4gIHJldHVybiBvcGVuT3B0aW9ucztcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUEwRSxBQUExRSx3RUFBMEU7QUFDMUUsTUFBTSxHQUdKLGNBQWMsUUFFVCxDQUFjO0FBcUJyQixNQUFNLFVBQVUsYUFBYSxDQUMzQixXQUFrRCxFQUN0QixDQUFDO0lBQzdCLEVBQUUsR0FBRyxXQUFXLEVBQUUs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