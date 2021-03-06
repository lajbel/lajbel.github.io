import { existsSync } from "../../fs/exists.ts";
import { fromFileUrl } from "../path.ts";
import { getOpenOptions } from "./_fs_common.ts";
function convertFlagAndModeToOptions(flag, mode) {
    if (!flag && !mode) return undefined;
    if (!flag && mode) return {
        mode
    };
    return {
        ...getOpenOptions(flag),
        mode
    };
}
export function open(path, flagsOrCallback, callbackOrMode, maybeCallback) {
    const flags = typeof flagsOrCallback === "string" ? flagsOrCallback : undefined;
    const callback = typeof flagsOrCallback === "function" ? flagsOrCallback : typeof callbackOrMode === "function" ? callbackOrMode : maybeCallback;
    const mode = typeof callbackOrMode === "number" ? callbackOrMode : undefined;
    path = path instanceof URL ? fromFileUrl(path) : path;
    if (!callback) throw new Error("No callback function supplied");
    if ([
        "ax",
        "ax+",
        "wx",
        "wx+"
    ].includes(flags || "") && existsSync(path)) {
        const err = new Error(`EEXIST: file already exists, open '${path}'`);
        callback(err);
    } else {
        if (flags === "as" || flags === "as+") {
            let err = null, res;
            try {
                res = openSync(path, flags, mode);
            } catch (error) {
                err = error;
            }
            if (err) {
                callback(err);
            } else {
                callback(null, res);
            }
            return;
        }
        Deno.open(path, convertFlagAndModeToOptions(flags, mode)).then((file)=>callback(null, file.rid)
        , (err)=>callback(err)
        );
    }
}
export function openSync(path, flagsOrMode, maybeMode) {
    const flags = typeof flagsOrMode === "string" ? flagsOrMode : undefined;
    const mode = typeof flagsOrMode === "number" ? flagsOrMode : maybeMode;
    path = path instanceof URL ? fromFileUrl(path) : path;
    if ([
        "ax",
        "ax+",
        "wx",
        "wx+"
    ].includes(flags || "") && existsSync(path)) {
        throw new Error(`EEXIST: file already exists, open '${path}'`);
    }
    return Deno.openSync(path, convertFlagAndModeToOptions(flags, mode)).rid;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjk4LjAvbm9kZS9fZnMvX2ZzX29wZW4udHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgZXhpc3RzU3luYyB9IGZyb20gXCIuLi8uLi9mcy9leGlzdHMudHNcIjtcbmltcG9ydCB7IGZyb21GaWxlVXJsIH0gZnJvbSBcIi4uL3BhdGgudHNcIjtcbmltcG9ydCB7IGdldE9wZW5PcHRpb25zIH0gZnJvbSBcIi4vX2ZzX2NvbW1vbi50c1wiO1xuXG50eXBlIG9wZW5GbGFncyA9XG4gIHwgXCJhXCJcbiAgfCBcImF4XCJcbiAgfCBcImErXCJcbiAgfCBcImF4K1wiXG4gIHwgXCJhc1wiXG4gIHwgXCJhcytcIlxuICB8IFwiclwiXG4gIHwgXCJyK1wiXG4gIHwgXCJycytcIlxuICB8IFwid1wiXG4gIHwgXCJ3eFwiXG4gIHwgXCJ3K1wiXG4gIHwgXCJ3eCtcIjtcblxudHlwZSBvcGVuQ2FsbGJhY2sgPSAoZXJyOiBFcnJvciB8IG51bGwsIGZkOiBudW1iZXIpID0+IHZvaWQ7XG5cbmZ1bmN0aW9uIGNvbnZlcnRGbGFnQW5kTW9kZVRvT3B0aW9ucyhcbiAgZmxhZz86IG9wZW5GbGFncyxcbiAgbW9kZT86IG51bWJlcixcbik6IERlbm8uT3Blbk9wdGlvbnMgfCB1bmRlZmluZWQge1xuICBpZiAoIWZsYWcgJiYgIW1vZGUpIHJldHVybiB1bmRlZmluZWQ7XG4gIGlmICghZmxhZyAmJiBtb2RlKSByZXR1cm4geyBtb2RlIH07XG4gIHJldHVybiB7IC4uLmdldE9wZW5PcHRpb25zKGZsYWcpLCBtb2RlIH07XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBvcGVuKHBhdGg6IHN0cmluZyB8IFVSTCwgY2FsbGJhY2s6IG9wZW5DYWxsYmFjayk6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gb3BlbihcbiAgcGF0aDogc3RyaW5nIHwgVVJMLFxuICBmbGFnczogb3BlbkZsYWdzLFxuICBjYWxsYmFjazogb3BlbkNhbGxiYWNrLFxuKTogdm9pZDtcbmV4cG9ydCBmdW5jdGlvbiBvcGVuKFxuICBwYXRoOiBzdHJpbmcgfCBVUkwsXG4gIGZsYWdzOiBvcGVuRmxhZ3MsXG4gIG1vZGU6IG51bWJlcixcbiAgY2FsbGJhY2s6IG9wZW5DYWxsYmFjayxcbik6IHZvaWQ7XG5leHBvcnQgZnVuY3Rpb24gb3BlbihcbiAgcGF0aDogc3RyaW5nIHwgVVJMLFxuICBmbGFnc09yQ2FsbGJhY2s6IG9wZW5DYWxsYmFjayB8IG9wZW5GbGFncyxcbiAgY2FsbGJhY2tPck1vZGU/OiBvcGVuQ2FsbGJhY2sgfCBudW1iZXIsXG4gIG1heWJlQ2FsbGJhY2s/OiBvcGVuQ2FsbGJhY2ssXG4pIHtcbiAgY29uc3QgZmxhZ3MgPSB0eXBlb2YgZmxhZ3NPckNhbGxiYWNrID09PSBcInN0cmluZ1wiXG4gICAgPyBmbGFnc09yQ2FsbGJhY2tcbiAgICA6IHVuZGVmaW5lZDtcbiAgY29uc3QgY2FsbGJhY2sgPSB0eXBlb2YgZmxhZ3NPckNhbGxiYWNrID09PSBcImZ1bmN0aW9uXCJcbiAgICA/IGZsYWdzT3JDYWxsYmFja1xuICAgIDogdHlwZW9mIGNhbGxiYWNrT3JNb2RlID09PSBcImZ1bmN0aW9uXCJcbiAgICA/IGNhbGxiYWNrT3JNb2RlXG4gICAgOiBtYXliZUNhbGxiYWNrO1xuICBjb25zdCBtb2RlID0gdHlwZW9mIGNhbGxiYWNrT3JNb2RlID09PSBcIm51bWJlclwiID8gY2FsbGJhY2tPck1vZGUgOiB1bmRlZmluZWQ7XG4gIHBhdGggPSBwYXRoIGluc3RhbmNlb2YgVVJMID8gZnJvbUZpbGVVcmwocGF0aCkgOiBwYXRoO1xuXG4gIGlmICghY2FsbGJhY2spIHRocm93IG5ldyBFcnJvcihcIk5vIGNhbGxiYWNrIGZ1bmN0aW9uIHN1cHBsaWVkXCIpO1xuXG4gIGlmIChbXCJheFwiLCBcImF4K1wiLCBcInd4XCIsIFwid3grXCJdLmluY2x1ZGVzKGZsYWdzIHx8IFwiXCIpICYmIGV4aXN0c1N5bmMocGF0aCkpIHtcbiAgICBjb25zdCBlcnIgPSBuZXcgRXJyb3IoYEVFWElTVDogZmlsZSBhbHJlYWR5IGV4aXN0cywgb3BlbiAnJHtwYXRofSdgKTtcbiAgICAoY2FsbGJhY2sgYXMgKGVycjogRXJyb3IpID0+IHZvaWQpKGVycik7XG4gIH0gZWxzZSB7XG4gICAgaWYgKGZsYWdzID09PSBcImFzXCIgfHwgZmxhZ3MgPT09IFwiYXMrXCIpIHtcbiAgICAgIGxldCBlcnI6IEVycm9yIHwgbnVsbCA9IG51bGwsIHJlczogbnVtYmVyO1xuICAgICAgdHJ5IHtcbiAgICAgICAgcmVzID0gb3BlblN5bmMocGF0aCwgZmxhZ3MsIG1vZGUpO1xuICAgICAgfSBjYXRjaCAoZXJyb3IpIHtcbiAgICAgICAgZXJyID0gZXJyb3I7XG4gICAgICB9XG4gICAgICBpZiAoZXJyKSB7XG4gICAgICAgIChjYWxsYmFjayBhcyAoZXJyOiBFcnJvcikgPT4gdm9pZCkoZXJyKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGNhbGxiYWNrKG51bGwsIHJlcyEpO1xuICAgICAgfVxuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBEZW5vLm9wZW4ocGF0aCwgY29udmVydEZsYWdBbmRNb2RlVG9PcHRpb25zKGZsYWdzLCBtb2RlKSkudGhlbihcbiAgICAgIChmaWxlKSA9PiBjYWxsYmFjayhudWxsLCBmaWxlLnJpZCksXG4gICAgICAoZXJyKSA9PiAoY2FsbGJhY2sgYXMgKGVycjogRXJyb3IpID0+IHZvaWQpKGVyciksXG4gICAgKTtcbiAgfVxufVxuXG5leHBvcnQgZnVuY3Rpb24gb3BlblN5bmMocGF0aDogc3RyaW5nIHwgVVJMKTogbnVtYmVyO1xuZXhwb3J0IGZ1bmN0aW9uIG9wZW5TeW5jKHBhdGg6IHN0cmluZyB8IFVSTCwgZmxhZ3M/OiBvcGVuRmxhZ3MpOiBudW1iZXI7XG5leHBvcnQgZnVuY3Rpb24gb3BlblN5bmMocGF0aDogc3RyaW5nIHwgVVJMLCBtb2RlPzogbnVtYmVyKTogbnVtYmVyO1xuZXhwb3J0IGZ1bmN0aW9uIG9wZW5TeW5jKFxuICBwYXRoOiBzdHJpbmcgfCBVUkwsXG4gIGZsYWdzPzogb3BlbkZsYWdzLFxuICBtb2RlPzogbnVtYmVyLFxuKTogbnVtYmVyO1xuZXhwb3J0IGZ1bmN0aW9uIG9wZW5TeW5jKFxuICBwYXRoOiBzdHJpbmcgfCBVUkwsXG4gIGZsYWdzT3JNb2RlPzogb3BlbkZsYWdzIHwgbnVtYmVyLFxuICBtYXliZU1vZGU/OiBudW1iZXIsXG4pIHtcbiAgY29uc3QgZmxhZ3MgPSB0eXBlb2YgZmxhZ3NPck1vZGUgPT09IFwic3RyaW5nXCIgPyBmbGFnc09yTW9kZSA6IHVuZGVmaW5lZDtcbiAgY29uc3QgbW9kZSA9IHR5cGVvZiBmbGFnc09yTW9kZSA9PT0gXCJudW1iZXJcIiA/IGZsYWdzT3JNb2RlIDogbWF5YmVNb2RlO1xuICBwYXRoID0gcGF0aCBpbnN0YW5jZW9mIFVSTCA/IGZyb21GaWxlVXJsKHBhdGgpIDogcGF0aDtcblxuICBpZiAoW1wiYXhcIiwgXCJheCtcIiwgXCJ3eFwiLCBcInd4K1wiXS5pbmNsdWRlcyhmbGFncyB8fCBcIlwiKSAmJiBleGlzdHNTeW5jKHBhdGgpKSB7XG4gICAgdGhyb3cgbmV3IEVycm9yKGBFRVhJU1Q6IGZpbGUgYWxyZWFkeSBleGlzdHMsIG9wZW4gJyR7cGF0aH0nYCk7XG4gIH1cblxuICByZXR1cm4gRGVuby5vcGVuU3luYyhwYXRoLCBjb252ZXJ0RmxhZ0FuZE1vZGVUb09wdGlvbnMoZmxhZ3MsIG1vZGUpKS5yaWQ7XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxHQUFHLFVBQVUsUUFBUSxDQUFvQjtBQUMvQyxNQUFNLEdBQUcsV0FBVyxRQUFRLENBQVk7QUFDeEMsTUFBTSxHQUFHLGNBQWMsUUFBUSxDQUFpQjtTQW1CdkMsMkJBQTJCLENBQ2xDLElBQWdCLEVBQ2hCLElBQWEsRUFDaUIsQ0FBQztJQUMvQixFQUFFLEdBQUcsSUFBSSxLQUFLLElBQUksRUFBRSxNQUFNLENBQUMsU0FBUztJQUNwQyxFQUFFLEdBQUcsSUFBSSxJQUFJLElBQUksRUFBRSxNQUFNLENBQUMsQ0FB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