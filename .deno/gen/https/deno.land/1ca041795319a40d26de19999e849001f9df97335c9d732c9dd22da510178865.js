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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEwOS4wL25vZGUvX2ZzL19mc19jb21tb24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMSB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbmltcG9ydCB7XG4gIEJpbmFyeUVuY29kaW5ncyxcbiAgRW5jb2RpbmdzLFxuICBub3RJbXBsZW1lbnRlZCxcbiAgVGV4dEVuY29kaW5ncyxcbn0gZnJvbSBcIi4uL191dGlscy50c1wiO1xuXG5leHBvcnQgdHlwZSBDYWxsYmFja1dpdGhFcnJvciA9IChlcnI6IEVycm9yIHwgbnVsbCkgPT4gdm9pZDtcblxuZXhwb3J0IGludGVyZmFjZSBGaWxlT3B0aW9ucyB7XG4gIGVuY29kaW5nPzogRW5jb2RpbmdzO1xuICBmbGFnPzogc3RyaW5nO1xufVxuXG5leHBvcnQgdHlwZSBUZXh0T3B0aW9uc0FyZ3VtZW50ID1cbiAgfCBUZXh0RW5jb2RpbmdzXG4gIHwgKHsgZW5jb2Rpbmc6IFRleHRFbmNvZGluZ3MgfSAmIEZpbGVPcHRpb25zKTtcbmV4cG9ydCB0eXBlIEJpbmFyeU9wdGlvbnNBcmd1bWVudCA9XG4gIHwgQmluYXJ5RW5jb2RpbmdzXG4gIHwgKHsgZW5jb2Rpbmc6IEJpbmFyeUVuY29kaW5ncyB9ICYgRmlsZU9wdGlvbnMpO1xuZXhwb3J0IHR5cGUgRmlsZU9wdGlvbnNBcmd1bWVudCA9IEVuY29kaW5ncyB8IEZpbGVPcHRpb25zO1xuXG5leHBvcnQgaW50ZXJmYWNlIFdyaXRlRmlsZU9wdGlvbnMgZXh0ZW5kcyBGaWxlT3B0aW9ucyB7XG4gIG1vZGU/OiBudW1iZXI7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBpc0ZpbGVPcHRpb25zKFxuICBmaWxlT3B0aW9uczogc3RyaW5nIHwgV3JpdGVGaWxlT3B0aW9ucyB8IHVuZGVmaW5lZCxcbik6IGZpbGVPcHRpb25zIGlzIEZpbGVPcHRpb25zIHtcbiAgaWYgKCFmaWxlT3B0aW9ucykgcmV0dXJuIGZhbHNlO1xuXG4gIHJldHVybiAoXG4gICAgKGZpbGVPcHRpb25zIGFzIEZpbGVPcHRpb25zKS5lbmNvZGluZyAhPSB1bmRlZmluZWQgfHxcbiAgICAoZmlsZU9wdGlvbnMgYXMgRmlsZU9wdGlvbnMpLmZsYWcgIT0gdW5kZWZpbmVkIHx8XG4gICAgKGZpbGVPcHRpb25zIGFzIFdyaXRlRmlsZU9wdGlvbnMpLm1vZGUgIT0gdW5kZWZpbmVkXG4gICk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBnZXRFbmNvZGluZyhcbiAgb3B0T3JDYWxsYmFjaz86XG4gICAgfCBGaWxlT3B0aW9uc1xuICAgIHwgV3JpdGVGaWxlT3B0aW9uc1xuICAgIC8vIGRlbm8tbGludC1pZ25vcmUgbm8tZXhwbGljaXQtYW55XG4gICAgfCAoKC4uLmFyZ3M6IGFueVtdKSA9PiBhbnkpXG4gICAgfCBFbmNvZGluZ3NcbiAgICB8IG51bGwsXG4pOiBFbmNvZGluZ3MgfCBudWxsIHtcbiAgaWYgKCFvcHRPckNhbGxiYWNrIHx8IHR5cGVvZiBvcHRPckNhbGxiYWNrID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICByZXR1cm4gbnVsbDtcbiAgfVxuXG4gIGNvbnN0IGVuY29kaW5nID0gdHlwZW9mIG9wdE9yQ2FsbGJhY2sgPT09IFwic3RyaW5nXCJcbiAgICA/IG9wdE9yQ2FsbGJhY2tcbiAgICA6IG9wdE9yQ2FsbGJhY2suZW5jb2Rpbmc7XG4gIGlmICghZW5jb2RpbmcpIHJldHVybiBudWxsO1xuICByZXR1cm4gZW5jb2Rpbmc7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBjaGVja0VuY29kaW5nKGVuY29kaW5nOiBFbmNvZGluZ3MgfCBudWxsKTogRW5jb2RpbmdzIHwgbnVsbCB7XG4gIGlmICghZW5jb2RpbmcpIHJldHVybiBudWxsO1xuXG4gIGVuY29kaW5nID0gZW5jb2RpbmcudG9Mb3dlckNhc2UoKSBhcyBFbmNvZGluZ3M7XG4gIGlmIChbXCJ1dGY4XCIsIFwiaGV4XCIsIFwiYmFzZTY0XCJdLmluY2x1ZGVzKGVuY29kaW5nKSkgcmV0dXJuIGVuY29kaW5nO1xuXG4gIGlmIChlbmNvZGluZyA9PT0gXCJ1dGYtOFwiKSB7XG4gICAgcmV0dXJuIFwidXRmOFwiO1xuICB9XG4gIGlmIChlbmNvZGluZyA9PT0gXCJiaW5hcnlcIikge1xuICAgIHJldHVybiBcImJpbmFyeVwiO1xuICAgIC8vIGJlZm9yZSB0aGlzIHdhcyBidWZmZXIsIGhvd2V2ZXIgYnVmZmVyIGlzIG5vdCB1c2VkIGluIE5vZGVcbiAgICAvLyBub2RlIC1lIFwicmVxdWlyZSgnZnMnKS5yZWFkRmlsZSgnLi4vd29ybGQudHh0JywgJ2J1ZmZlcicsIGNvbnNvbGUubG9nKVwiXG4gIH1cblxuICBjb25zdCBub3RJbXBsZW1lbnRlZEVuY29kaW5ncyA9IFtcInV0ZjE2bGVcIiwgXCJsYXRpbjFcIiwgXCJhc2NpaVwiLCBcInVjczJcIl07XG5cbiAgaWYgKG5vdEltcGxlbWVudGVkRW5jb2RpbmdzLmluY2x1ZGVzKGVuY29kaW5nIGFzIHN0cmluZykpIHtcbiAgICBub3RJbXBsZW1lbnRlZChgXCIke2VuY29kaW5nfVwiIGVuY29kaW5nYCk7XG4gIH1cblxuICB0aHJvdyBuZXcgRXJyb3IoYFRoZSB2YWx1ZSBcIiR7ZW5jb2Rpbmd9XCIgaXMgaW52YWxpZCBmb3Igb3B0aW9uIFwiZW5jb2RpbmdcImApO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gZ2V0T3Blbk9wdGlvbnMoZmxhZzogc3RyaW5nIHwgdW5kZWZpbmVkKTogRGVuby5PcGVuT3B0aW9ucyB7XG4gIGlmICghZmxhZykge1xuICAgIHJldHVybiB7IGNyZWF0ZTogdHJ1ZSwgYXBwZW5kOiB0cnVlIH07XG4gIH1cblxuICBsZXQgb3Blbk9wdGlvbnM6IERlbm8uT3Blbk9wdGlvbnM7XG4gIHN3aXRjaCAoZmxhZykge1xuICAgIGNhc2UgXCJhXCI6IHtcbiAgICAgIC8vICdhJzogT3BlbiBmaWxlIGZvciBhcHBlbmRpbmcuIFRoZSBmaWxlIGlzIGNyZWF0ZWQgaWYgaXQgZG9lcyBub3QgZXhpc3QuXG4gICAgICBvcGVuT3B0aW9ucyA9IHsgY3JlYXRlOiB0cnVlLCBhcHBlbmQ6IHRydWUgfTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlIFwiYXhcIjoge1xuICAgICAgLy8gJ2F4JzogTGlrZSAnYScgYnV0IGZhaWxzIGlmIHRoZSBwYXRoIGV4aXN0cy5cbiAgICAgIG9wZW5PcHRpb25zID0geyBjcmVhdGVOZXc6IHRydWUsIHdyaXRlOiB0cnVlLCBhcHBlbmQ6IHRydWUgfTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlIFwiYStcIjoge1xuICAgICAgLy8gJ2ErJzogT3BlbiBmaWxlIGZvciByZWFkaW5nIGFuZCBhcHBlbmRpbmcuIFRoZSBmaWxlIGlzIGNyZWF0ZWQgaWYgaXQgZG9lcyBub3QgZXhpc3QuXG4gICAgICBvcGVuT3B0aW9ucyA9IHsgcmVhZDogdHJ1ZSwgY3JlYXRlOiB0cnVlLCBhcHBlbmQ6IHRydWUgfTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlIFwiYXgrXCI6IHtcbiAgICAgIC8vICdheCsnOiBMaWtlICdhKycgYnV0IGZhaWxzIGlmIHRoZSBwYXRoIGV4aXN0cy5cbiAgICAgIG9wZW5PcHRpb25zID0geyByZWFkOiB0cnVlLCBjcmVhdGVOZXc6IHRydWUsIGFwcGVuZDogdHJ1ZSB9O1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgXCJyXCI6IHtcbiAgICAgIC8vICdyJzogT3BlbiBmaWxlIGZvciByZWFkaW5nLiBBbiBleGNlcHRpb24gb2NjdXJzIGlmIHRoZSBmaWxlIGRvZXMgbm90IGV4aXN0LlxuICAgICAgb3Blbk9wdGlvbnMgPSB7IHJlYWQ6IHRydWUgfTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlIFwicitcIjoge1xuICAgICAgLy8gJ3IrJzogT3BlbiBmaWxlIGZvciByZWFkaW5nIGFuZCB3cml0aW5nLiBBbiBleGNlcHRpb24gb2NjdXJzIGlmIHRoZSBmaWxlIGRvZXMgbm90IGV4aXN0LlxuICAgICAgb3Blbk9wdGlvbnMgPSB7IHJlYWQ6IHRydWUsIHdyaXRlOiB0cnVlIH07XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSBcIndcIjoge1xuICAgICAgLy8gJ3cnOiBPcGVuIGZpbGUgZm9yIHdyaXRpbmcuIFRoZSBmaWxlIGlzIGNyZWF0ZWQgKGlmIGl0IGRvZXMgbm90IGV4aXN0KSBvciB0cnVuY2F0ZWQgKGlmIGl0IGV4aXN0cykuXG4gICAgICBvcGVuT3B0aW9ucyA9IHsgY3JlYXRlOiB0cnVlLCB3cml0ZTogdHJ1ZSwgdHJ1bmNhdGU6IHRydWUgfTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlIFwid3hcIjoge1xuICAgICAgLy8gJ3d4JzogTGlrZSAndycgYnV0IGZhaWxzIGlmIHRoZSBwYXRoIGV4aXN0cy5cbiAgICAgIG9wZW5PcHRpb25zID0geyBjcmVhdGVOZXc6IHRydWUsIHdyaXRlOiB0cnVlIH07XG4gICAgICBicmVhaztcbiAgICB9XG4gICAgY2FzZSBcIncrXCI6IHtcbiAgICAgIC8vICd3Kyc6IE9wZW4gZmlsZSBmb3IgcmVhZGluZyBhbmQgd3JpdGluZy4gVGhlIGZpbGUgaXMgY3JlYXRlZCAoaWYgaXQgZG9lcyBub3QgZXhpc3QpIG9yIHRydW5jYXRlZCAoaWYgaXQgZXhpc3RzKS5cbiAgICAgIG9wZW5PcHRpb25zID0geyBjcmVhdGU6IHRydWUsIHdyaXRlOiB0cnVlLCB0cnVuY2F0ZTogdHJ1ZSwgcmVhZDogdHJ1ZSB9O1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgXCJ3eCtcIjoge1xuICAgICAgLy8gJ3d4Kyc6IExpa2UgJ3crJyBidXQgZmFpbHMgaWYgdGhlIHBhdGggZXhpc3RzLlxuICAgICAgb3Blbk9wdGlvbnMgPSB7IGNyZWF0ZU5ldzogdHJ1ZSwgd3JpdGU6IHRydWUsIHJlYWQ6IHRydWUgfTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlIFwiYXNcIjoge1xuICAgICAgLy8gJ2FzJzogT3BlbiBmaWxlIGZvciBhcHBlbmRpbmcgaW4gc3luY2hyb25vdXMgbW9kZS4gVGhlIGZpbGUgaXMgY3JlYXRlZCBpZiBpdCBkb2VzIG5vdCBleGlzdC5cbiAgICAgIG9wZW5PcHRpb25zID0geyBjcmVhdGU6IHRydWUsIGFwcGVuZDogdHJ1ZSB9O1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGNhc2UgXCJhcytcIjoge1xuICAgICAgLy8gJ2FzKyc6IE9wZW4gZmlsZSBmb3IgcmVhZGluZyBhbmQgYXBwZW5kaW5nIGluIHN5bmNocm9ub3VzIG1vZGUuIFRoZSBmaWxlIGlzIGNyZWF0ZWQgaWYgaXQgZG9lcyBub3QgZXhpc3QuXG4gICAgICBvcGVuT3B0aW9ucyA9IHsgY3JlYXRlOiB0cnVlLCByZWFkOiB0cnVlLCBhcHBlbmQ6IHRydWUgfTtcbiAgICAgIGJyZWFrO1xuICAgIH1cbiAgICBjYXNlIFwicnMrXCI6IHtcbiAgICAgIC8vICdycysnOiBPcGVuIGZpbGUgZm9yIHJlYWRpbmcgYW5kIHdyaXRpbmcgaW4gc3luY2hyb25vdXMgbW9kZS4gSW5zdHJ1Y3RzIHRoZSBvcGVyYXRpbmcgc3lzdGVtIHRvIGJ5cGFzcyB0aGUgbG9jYWwgZmlsZSBzeXN0ZW0gY2FjaGUuXG4gICAgICBvcGVuT3B0aW9ucyA9IHsgY3JlYXRlOiB0cnVlLCByZWFkOiB0cnVlLCB3cml0ZTogdHJ1ZSB9O1xuICAgICAgYnJlYWs7XG4gICAgfVxuICAgIGRlZmF1bHQ6IHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihgVW5yZWNvZ25pemVkIGZpbGUgc3lzdGVtIGZsYWc6ICR7ZmxhZ31gKTtcbiAgICB9XG4gIH1cblxuICByZXR1cm4gb3Blbk9wdGlvbnM7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUFBMEUsQUFBMUUsd0VBQTBFO0FBQzFFLE1BQU0sR0FHSixjQUFjLFFBRVQsQ0FBYztBQXFCckIsTUFBTSxVQUFVLGFBQWEsQ0FDM0IsV0FBa0QsRUFDdEIsQ0FBQztJQUM3QixFQUFFLEdBQUcsV0FBVyxFQUFF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