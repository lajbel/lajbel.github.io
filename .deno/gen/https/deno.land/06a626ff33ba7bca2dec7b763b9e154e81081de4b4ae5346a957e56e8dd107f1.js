// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { getOpenOptions, isFileOptions } from "./_fs_common.ts";
import { notImplemented } from "../_utils.ts";
import { fromFileUrl } from "../path.ts";
/**
 * TODO: Also accept 'data' parameter as a Node polyfill Buffer type once these
 * are implemented. See https://github.com/denoland/deno/issues/3403
 */ export function appendFile(pathOrRid, data, optionsOrCallback, callback) {
    pathOrRid = pathOrRid instanceof URL ? fromFileUrl(pathOrRid) : pathOrRid;
    const callbackFn = optionsOrCallback instanceof Function ? optionsOrCallback : callback;
    const options = optionsOrCallback instanceof Function ? undefined : optionsOrCallback;
    if (!callbackFn) {
        throw new Error("No callback function supplied");
    }
    validateEncoding(options);
    let rid = -1;
    const buffer = data instanceof Uint8Array ? data : new TextEncoder().encode(data);
    new Promise((resolve, reject)=>{
        if (typeof pathOrRid === "number") {
            rid = pathOrRid;
            Deno.write(rid, buffer).then(resolve, reject);
        } else {
            const mode = isFileOptions(options) ? options.mode : undefined;
            const flag = isFileOptions(options) ? options.flag : undefined;
            if (mode) {
                // TODO(bartlomieju) rework once https://github.com/denoland/deno/issues/4017 completes
                notImplemented("Deno does not yet support setting mode on create");
            }
            Deno.open(pathOrRid, getOpenOptions(flag)).then(({ rid: openedFileRid  })=>{
                rid = openedFileRid;
                return Deno.write(openedFileRid, buffer);
            }).then(resolve, reject);
        }
    }).then(()=>{
        closeRidIfNecessary(typeof pathOrRid === "string", rid);
        callbackFn(null);
    }, (err)=>{
        closeRidIfNecessary(typeof pathOrRid === "string", rid);
        callbackFn(err);
    });
}
function closeRidIfNecessary(isPathString, rid) {
    if (isPathString && rid != -1) {
        //Only close if a path was supplied and a rid allocated
        Deno.close(rid);
    }
}
/**
 * TODO: Also accept 'data' parameter as a Node polyfill Buffer type once these
 * are implemented. See https://github.com/denoland/deno/issues/3403
 */ export function appendFileSync(pathOrRid, data, options) {
    let rid = -1;
    validateEncoding(options);
    pathOrRid = pathOrRid instanceof URL ? fromFileUrl(pathOrRid) : pathOrRid;
    try {
        if (typeof pathOrRid === "number") {
            rid = pathOrRid;
        } else {
            const mode = isFileOptions(options) ? options.mode : undefined;
            const flag = isFileOptions(options) ? options.flag : undefined;
            if (mode) {
                // TODO(bartlomieju) rework once https://github.com/denoland/deno/issues/4017 completes
                notImplemented("Deno does not yet support setting mode on create");
            }
            const file = Deno.openSync(pathOrRid, getOpenOptions(flag));
            rid = file.rid;
        }
        const buffer = data instanceof Uint8Array ? data : new TextEncoder().encode(data);
        Deno.writeSync(rid, buffer);
    } finally{
        closeRidIfNecessary(typeof pathOrRid === "string", rid);
    }
}
function validateEncoding(encodingOption) {
    if (!encodingOption) return;
    if (typeof encodingOption === "string") {
        if (encodingOption !== "utf8") {
            throw new Error("Only 'utf8' encoding is currently supported");
        }
    } else if (encodingOption.encoding && encodingOption.encoding !== "utf8") {
        throw new Error("Only 'utf8' encoding is currently supported");
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjk4LjAvbm9kZS9fZnMvX2ZzX2FwcGVuZEZpbGUudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMSB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbmltcG9ydCB7XG4gIENhbGxiYWNrV2l0aEVycm9yLFxuICBnZXRPcGVuT3B0aW9ucyxcbiAgaXNGaWxlT3B0aW9ucyxcbiAgV3JpdGVGaWxlT3B0aW9ucyxcbn0gZnJvbSBcIi4vX2ZzX2NvbW1vbi50c1wiO1xuaW1wb3J0IHsgRW5jb2RpbmdzLCBub3RJbXBsZW1lbnRlZCB9IGZyb20gXCIuLi9fdXRpbHMudHNcIjtcbmltcG9ydCB7IGZyb21GaWxlVXJsIH0gZnJvbSBcIi4uL3BhdGgudHNcIjtcblxuLyoqXG4gKiBUT0RPOiBBbHNvIGFjY2VwdCAnZGF0YScgcGFyYW1ldGVyIGFzIGEgTm9kZSBwb2x5ZmlsbCBCdWZmZXIgdHlwZSBvbmNlIHRoZXNlXG4gKiBhcmUgaW1wbGVtZW50ZWQuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vZGVub2xhbmQvZGVuby9pc3N1ZXMvMzQwM1xuICovXG5leHBvcnQgZnVuY3Rpb24gYXBwZW5kRmlsZShcbiAgcGF0aE9yUmlkOiBzdHJpbmcgfCBudW1iZXIgfCBVUkwsXG4gIGRhdGE6IHN0cmluZyB8IFVpbnQ4QXJyYXksXG4gIG9wdGlvbnNPckNhbGxiYWNrOiBFbmNvZGluZ3MgfCBXcml0ZUZpbGVPcHRpb25zIHwgQ2FsbGJhY2tXaXRoRXJyb3IsXG4gIGNhbGxiYWNrPzogQ2FsbGJhY2tXaXRoRXJyb3IsXG4pOiB2b2lkIHtcbiAgcGF0aE9yUmlkID0gcGF0aE9yUmlkIGluc3RhbmNlb2YgVVJMID8gZnJvbUZpbGVVcmwocGF0aE9yUmlkKSA6IHBhdGhPclJpZDtcbiAgY29uc3QgY2FsbGJhY2tGbjogQ2FsbGJhY2tXaXRoRXJyb3IgfCB1bmRlZmluZWQgPVxuICAgIG9wdGlvbnNPckNhbGxiYWNrIGluc3RhbmNlb2YgRnVuY3Rpb24gPyBvcHRpb25zT3JDYWxsYmFjayA6IGNhbGxiYWNrO1xuICBjb25zdCBvcHRpb25zOiBFbmNvZGluZ3MgfCBXcml0ZUZpbGVPcHRpb25zIHwgdW5kZWZpbmVkID1cbiAgICBvcHRpb25zT3JDYWxsYmFjayBpbnN0YW5jZW9mIEZ1bmN0aW9uID8gdW5kZWZpbmVkIDogb3B0aW9uc09yQ2FsbGJhY2s7XG4gIGlmICghY2FsbGJhY2tGbikge1xuICAgIHRocm93IG5ldyBFcnJvcihcIk5vIGNhbGxiYWNrIGZ1bmN0aW9uIHN1cHBsaWVkXCIpO1xuICB9XG5cbiAgdmFsaWRhdGVFbmNvZGluZyhvcHRpb25zKTtcbiAgbGV0IHJpZCA9IC0xO1xuICBjb25zdCBidWZmZXI6IFVpbnQ4QXJyYXkgPSBkYXRhIGluc3RhbmNlb2YgVWludDhBcnJheVxuICAgID8gZGF0YVxuICAgIDogbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKGRhdGEpO1xuICBuZXcgUHJvbWlzZSgocmVzb2x2ZSwgcmVqZWN0KSA9PiB7XG4gICAgaWYgKHR5cGVvZiBwYXRoT3JSaWQgPT09IFwibnVtYmVyXCIpIHtcbiAgICAgIHJpZCA9IHBhdGhPclJpZDtcbiAgICAgIERlbm8ud3JpdGUocmlkLCBidWZmZXIpLnRoZW4ocmVzb2x2ZSwgcmVqZWN0KTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgbW9kZTogbnVtYmVyIHwgdW5kZWZpbmVkID0gaXNGaWxlT3B0aW9ucyhvcHRpb25zKVxuICAgICAgICA/IG9wdGlvbnMubW9kZVxuICAgICAgICA6IHVuZGVmaW5lZDtcbiAgICAgIGNvbnN0IGZsYWc6IHN0cmluZyB8IHVuZGVmaW5lZCA9IGlzRmlsZU9wdGlvbnMob3B0aW9ucylcbiAgICAgICAgPyBvcHRpb25zLmZsYWdcbiAgICAgICAgOiB1bmRlZmluZWQ7XG5cbiAgICAgIGlmIChtb2RlKSB7XG4gICAgICAgIC8vIFRPRE8oYmFydGxvbWllanUpIHJld29yayBvbmNlIGh0dHBzOi8vZ2l0aHViLmNvbS9kZW5vbGFuZC9kZW5vL2lzc3Vlcy80MDE3IGNvbXBsZXRlc1xuICAgICAgICBub3RJbXBsZW1lbnRlZChcIkRlbm8gZG9lcyBub3QgeWV0IHN1cHBvcnQgc2V0dGluZyBtb2RlIG9uIGNyZWF0ZVwiKTtcbiAgICAgIH1cbiAgICAgIERlbm8ub3BlbihwYXRoT3JSaWQgYXMgc3RyaW5nLCBnZXRPcGVuT3B0aW9ucyhmbGFnKSlcbiAgICAgICAgLnRoZW4oKHsgcmlkOiBvcGVuZWRGaWxlUmlkIH0pID0+IHtcbiAgICAgICAgICByaWQgPSBvcGVuZWRGaWxlUmlkO1xuICAgICAgICAgIHJldHVybiBEZW5vLndyaXRlKG9wZW5lZEZpbGVSaWQsIGJ1ZmZlcik7XG4gICAgICAgIH0pXG4gICAgICAgIC50aGVuKHJlc29sdmUsIHJlamVjdCk7XG4gICAgfVxuICB9KVxuICAgIC50aGVuKCgpID0+IHtcbiAgICAgIGNsb3NlUmlkSWZOZWNlc3NhcnkodHlwZW9mIHBhdGhPclJpZCA9PT0gXCJzdHJpbmdcIiwgcmlkKTtcbiAgICAgIGNhbGxiYWNrRm4obnVsbCk7XG4gICAgfSwgKGVycikgPT4ge1xuICAgICAgY2xvc2VSaWRJZk5lY2Vzc2FyeSh0eXBlb2YgcGF0aE9yUmlkID09PSBcInN0cmluZ1wiLCByaWQpO1xuICAgICAgY2FsbGJhY2tGbihlcnIpO1xuICAgIH0pO1xufVxuXG5mdW5jdGlvbiBjbG9zZVJpZElmTmVjZXNzYXJ5KGlzUGF0aFN0cmluZzogYm9vbGVhbiwgcmlkOiBudW1iZXIpOiB2b2lkIHtcbiAgaWYgKGlzUGF0aFN0cmluZyAmJiByaWQgIT0gLTEpIHtcbiAgICAvL09ubHkgY2xvc2UgaWYgYSBwYXRoIHdhcyBzdXBwbGllZCBhbmQgYSByaWQgYWxsb2NhdGVkXG4gICAgRGVuby5jbG9zZShyaWQpO1xuICB9XG59XG5cbi8qKlxuICogVE9ETzogQWxzbyBhY2NlcHQgJ2RhdGEnIHBhcmFtZXRlciBhcyBhIE5vZGUgcG9seWZpbGwgQnVmZmVyIHR5cGUgb25jZSB0aGVzZVxuICogYXJlIGltcGxlbWVudGVkLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2Rlbm9sYW5kL2Rlbm8vaXNzdWVzLzM0MDNcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGFwcGVuZEZpbGVTeW5jKFxuICBwYXRoT3JSaWQ6IHN0cmluZyB8IG51bWJlciB8IFVSTCxcbiAgZGF0YTogc3RyaW5nIHwgVWludDhBcnJheSxcbiAgb3B0aW9ucz86IEVuY29kaW5ncyB8IFdyaXRlRmlsZU9wdGlvbnMsXG4pOiB2b2lkIHtcbiAgbGV0IHJpZCA9IC0xO1xuXG4gIHZhbGlkYXRlRW5jb2Rpbmcob3B0aW9ucyk7XG4gIHBhdGhPclJpZCA9IHBhdGhPclJpZCBpbnN0YW5jZW9mIFVSTCA/IGZyb21GaWxlVXJsKHBhdGhPclJpZCkgOiBwYXRoT3JSaWQ7XG5cbiAgdHJ5IHtcbiAgICBpZiAodHlwZW9mIHBhdGhPclJpZCA9PT0gXCJudW1iZXJcIikge1xuICAgICAgcmlkID0gcGF0aE9yUmlkO1xuICAgIH0gZWxzZSB7XG4gICAgICBjb25zdCBtb2RlOiBudW1iZXIgfCB1bmRlZmluZWQgPSBpc0ZpbGVPcHRpb25zKG9wdGlvbnMpXG4gICAgICAgID8gb3B0aW9ucy5tb2RlXG4gICAgICAgIDogdW5kZWZpbmVkO1xuICAgICAgY29uc3QgZmxhZzogc3RyaW5nIHwgdW5kZWZpbmVkID0gaXNGaWxlT3B0aW9ucyhvcHRpb25zKVxuICAgICAgICA/IG9wdGlvbnMuZmxhZ1xuICAgICAgICA6IHVuZGVmaW5lZDtcblxuICAgICAgaWYgKG1vZGUpIHtcbiAgICAgICAgLy8gVE9ETyhiYXJ0bG9taWVqdSkgcmV3b3JrIG9uY2UgaHR0cHM6Ly9naXRodWIuY29tL2Rlbm9sYW5kL2Rlbm8vaXNzdWVzLzQwMTcgY29tcGxldGVzXG4gICAgICAgIG5vdEltcGxlbWVudGVkKFwiRGVubyBkb2VzIG5vdCB5ZXQgc3VwcG9ydCBzZXR0aW5nIG1vZGUgb24gY3JlYXRlXCIpO1xuICAgICAgfVxuXG4gICAgICBjb25zdCBmaWxlID0gRGVuby5vcGVuU3luYyhwYXRoT3JSaWQsIGdldE9wZW5PcHRpb25zKGZsYWcpKTtcbiAgICAgIHJpZCA9IGZpbGUucmlkO1xuICAgIH1cblxuICAgIGNvbnN0IGJ1ZmZlcjogVWludDhBcnJheSA9IGRhdGEgaW5zdGFuY2VvZiBVaW50OEFycmF5XG4gICAgICA/IGRhdGFcbiAgICAgIDogbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKGRhdGEpO1xuXG4gICAgRGVuby53cml0ZVN5bmMocmlkLCBidWZmZXIpO1xuICB9IGZpbmFsbHkge1xuICAgIGNsb3NlUmlkSWZOZWNlc3NhcnkodHlwZW9mIHBhdGhPclJpZCA9PT0gXCJzdHJpbmdcIiwgcmlkKTtcbiAgfVxufVxuXG5mdW5jdGlvbiB2YWxpZGF0ZUVuY29kaW5nKFxuICBlbmNvZGluZ09wdGlvbjogRW5jb2RpbmdzIHwgV3JpdGVGaWxlT3B0aW9ucyB8IHVuZGVmaW5lZCxcbik6IHZvaWQge1xuICBpZiAoIWVuY29kaW5nT3B0aW9uKSByZXR1cm47XG5cbiAgaWYgKHR5cGVvZiBlbmNvZGluZ09wdGlvbiA9PT0gXCJzdHJpbmdcIikge1xuICAgIGlmIChlbmNvZGluZ09wdGlvbiAhPT0gXCJ1dGY4XCIpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIk9ubHkgJ3V0ZjgnIGVuY29kaW5nIGlzIGN1cnJlbnRseSBzdXBwb3J0ZWRcIik7XG4gICAgfVxuICB9IGVsc2UgaWYgKGVuY29kaW5nT3B0aW9uLmVuY29kaW5nICYmIGVuY29kaW5nT3B0aW9uLmVuY29kaW5nICE9PSBcInV0ZjhcIikge1xuICAgIHRocm93IG5ldyBFcnJvcihcIk9ubHkgJ3V0ZjgnIGVuY29kaW5nIGlzIGN1cnJlbnRseSBzdXBwb3J0ZWRcIik7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUEwRSxBQUExRSx3RUFBMEU7QUFDMUUsTUFBTSxHQUVKLGNBQWMsRUFDZCxhQUFhLFFBRVIsQ0FBaUI7QUFD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