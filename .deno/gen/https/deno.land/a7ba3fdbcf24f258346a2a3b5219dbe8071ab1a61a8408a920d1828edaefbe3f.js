import { fromFileUrl } from "../path.ts";
export function mkdir(path, options, callback) {
    path = path instanceof URL ? fromFileUrl(path) : path;
    let mode = 511;
    let recursive = false;
    if (typeof options == "function") {
        callback = options;
    } else if (typeof options === "number") {
        mode = options;
    } else if (typeof options === "boolean") {
        recursive = options;
    } else if (options) {
        if (options.recursive !== undefined) recursive = options.recursive;
        if (options.mode !== undefined) mode = options.mode;
    }
    if (typeof recursive !== "boolean") {
        throw new Deno.errors.InvalidData("invalid recursive option , must be a boolean");
    }
    Deno.mkdir(path, {
        recursive,
        mode
    }).then(()=>{
        if (typeof callback === "function") {
            callback(null);
        }
    }, (err)=>{
        if (typeof callback === "function") {
            callback(err);
        }
    });
}
export function mkdirSync(path, options) {
    path = path instanceof URL ? fromFileUrl(path) : path;
    let mode = 511;
    let recursive = false;
    if (typeof options === "number") {
        mode = options;
    } else if (typeof options === "boolean") {
        recursive = options;
    } else if (options) {
        if (options.recursive !== undefined) recursive = options.recursive;
        if (options.mode !== undefined) mode = options.mode;
    }
    if (typeof recursive !== "boolean") {
        throw new Deno.errors.InvalidData("invalid recursive option , must be a boolean");
    }
    Deno.mkdirSync(path, {
        recursive,
        mode
    });
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEwOS4wL25vZGUvX2ZzL19mc19ta2Rpci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0IHR5cGUgeyBDYWxsYmFja1dpdGhFcnJvciB9IGZyb20gXCIuL19mc19jb21tb24udHNcIjtcbmltcG9ydCB7IGZyb21GaWxlVXJsIH0gZnJvbSBcIi4uL3BhdGgudHNcIjtcblxuLyoqXG4gKiBUT0RPOiBBbHNvIGFjY2VwdCAncGF0aCcgcGFyYW1ldGVyIGFzIGEgTm9kZSBwb2x5ZmlsbCBCdWZmZXIgdHlwZSBvbmNlIHRoZXNlXG4gKiBhcmUgaW1wbGVtZW50ZWQuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vZGVub2xhbmQvZGVuby9pc3N1ZXMvMzQwM1xuICovXG50eXBlIE1rZGlyT3B0aW9ucyA9XG4gIHwgeyByZWN1cnNpdmU/OiBib29sZWFuOyBtb2RlPzogbnVtYmVyIHwgdW5kZWZpbmVkIH1cbiAgfCBudW1iZXJcbiAgfCBib29sZWFuO1xuXG5leHBvcnQgZnVuY3Rpb24gbWtkaXIoXG4gIHBhdGg6IHN0cmluZyB8IFVSTCxcbiAgb3B0aW9ucz86IE1rZGlyT3B0aW9ucyB8IENhbGxiYWNrV2l0aEVycm9yLFxuICBjYWxsYmFjaz86IENhbGxiYWNrV2l0aEVycm9yLFxuKTogdm9pZCB7XG4gIHBhdGggPSBwYXRoIGluc3RhbmNlb2YgVVJMID8gZnJvbUZpbGVVcmwocGF0aCkgOiBwYXRoO1xuXG4gIGxldCBtb2RlID0gMG83Nzc7XG4gIGxldCByZWN1cnNpdmUgPSBmYWxzZTtcblxuICBpZiAodHlwZW9mIG9wdGlvbnMgPT0gXCJmdW5jdGlvblwiKSB7XG4gICAgY2FsbGJhY2sgPSBvcHRpb25zO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zID09PSBcIm51bWJlclwiKSB7XG4gICAgbW9kZSA9IG9wdGlvbnM7XG4gIH0gZWxzZSBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwiYm9vbGVhblwiKSB7XG4gICAgcmVjdXJzaXZlID0gb3B0aW9ucztcbiAgfSBlbHNlIGlmIChvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMucmVjdXJzaXZlICE9PSB1bmRlZmluZWQpIHJlY3Vyc2l2ZSA9IG9wdGlvbnMucmVjdXJzaXZlO1xuICAgIGlmIChvcHRpb25zLm1vZGUgIT09IHVuZGVmaW5lZCkgbW9kZSA9IG9wdGlvbnMubW9kZTtcbiAgfVxuICBpZiAodHlwZW9mIHJlY3Vyc2l2ZSAhPT0gXCJib29sZWFuXCIpIHtcbiAgICB0aHJvdyBuZXcgRGVuby5lcnJvcnMuSW52YWxpZERhdGEoXG4gICAgICBcImludmFsaWQgcmVjdXJzaXZlIG9wdGlvbiAsIG11c3QgYmUgYSBib29sZWFuXCIsXG4gICAgKTtcbiAgfVxuICBEZW5vLm1rZGlyKHBhdGgsIHsgcmVjdXJzaXZlLCBtb2RlIH0pXG4gICAgLnRoZW4oKCkgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGNhbGxiYWNrKG51bGwpO1xuICAgICAgfVxuICAgIH0sIChlcnIpID0+IHtcbiAgICAgIGlmICh0eXBlb2YgY2FsbGJhY2sgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICBjYWxsYmFjayhlcnIpO1xuICAgICAgfVxuICAgIH0pO1xufVxuXG5leHBvcnQgZnVuY3Rpb24gbWtkaXJTeW5jKHBhdGg6IHN0cmluZyB8IFVSTCwgb3B0aW9ucz86IE1rZGlyT3B0aW9ucyk6IHZvaWQge1xuICBwYXRoID0gcGF0aCBpbnN0YW5jZW9mIFVSTCA/IGZyb21GaWxlVXJsKHBhdGgpIDogcGF0aDtcbiAgbGV0IG1vZGUgPSAwbzc3NztcbiAgbGV0IHJlY3Vyc2l2ZSA9IGZhbHNlO1xuXG4gIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJudW1iZXJcIikge1xuICAgIG1vZGUgPSBvcHRpb25zO1xuICB9IGVsc2UgaWYgKHR5cGVvZiBvcHRpb25zID09PSBcImJvb2xlYW5cIikge1xuICAgIHJlY3Vyc2l2ZSA9IG9wdGlvbnM7XG4gIH0gZWxzZSBpZiAob3B0aW9ucykge1xuICAgIGlmIChvcHRpb25zLnJlY3Vyc2l2ZSAhPT0gdW5kZWZpbmVkKSByZWN1cnNpdmUgPSBvcHRpb25zLnJlY3Vyc2l2ZTtcbiAgICBpZiAob3B0aW9ucy5tb2RlICE9PSB1bmRlZmluZWQpIG1vZGUgPSBvcHRpb25zLm1vZGU7XG4gIH1cbiAgaWYgKHR5cGVvZiByZWN1cnNpdmUgIT09IFwiYm9vbGVhblwiKSB7XG4gICAgdGhyb3cgbmV3IERlbm8uZXJyb3JzLkludmFsaWREYXRhKFxuICAgICAgXCJpbnZhbGlkIHJlY3Vyc2l2ZSBvcHRpb24gLCBtdXN0IGJlIGEgYm9vbGVhblwiLFxuICAgICk7XG4gIH1cblxuICBEZW5vLm1rZGlyU3luYyhwYXRoLCB7IHJlY3Vyc2l2ZSwgbW9kZSB9KTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFFQSxNQUFNLEdBQUcsV0FBVyxRQUFRLENBQVk7QUFXeEMsTUFBTSxVQUFVLEtBQUssQ0FDbkIsSUFBa0IsRUFDbEIsT0FBMEMsRUFDMUMsUUFBNEIsRUFDdEIsQ0FBQztJQUNQLElBQUksR0FBRyxJQUFJLFlBQVksR0FBRyxHQUFHLFdBQVcsQ0FBQyxJQUFJLElBQUksSUFBSTtJQUVyRCxHQUFHLENBQUMsSUFBSSxHQUFHLEdBQUs7SUFDaEIsR0FBRyxDQUFDLFNBQVMsR0FBRyxLQUFLO0lBRXJCLEVBQUUsRUFBRSxNQUFNLENBQUMsT0FBTyxJQUFJLENBQVUsV0FBRSxDQUFDO1FBQ2pDLFFBQVEsR0FBRyxPQUFPO0lBQ3BCLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxDQUFDLE9BQU8sS0FBSyxDQUFRLFNBQUUsQ0FBQztRQUN2QyxJQUFJLEdBQUcsT0FBTztJQUNoQixDQUFDLE1BQU0sRUFBRSxFQUFFLE1BQU0sQ0FBQyxPQUFPLEtBQUssQ0FBUyxVQUFFLENBQUM7UUFDeEMsU0FBUyxHQUFHLE9BQU87SUFDckIsQ0FBQyxNQUFNLEVBQUUsRUFBRSxPQUFPLEVBQUUsQ0FBQztRQUNuQixFQUFFLEVBQUUsT0FBTyxDQUFDLFNBQVMsS0FBSyxTQUFTLEVBQUUsU0FBUyxHQUFHLE9BQU8sQ0FBQyxTQUFTO1FBQ2xFLEVBQUUsRUFBRSxPQUFPLENBQUMsSUFBSSxLQUFLLFNBQVMsRUFBRSxJQUFJLEdBQUcsT0FBTyxDQUFDLElBQUk7SUFDckQsQ0FBQztJQUNELEVBQUUsRUFBRSxNQUFNLENBQUMsU0FBUyxLQUFLLENBQVMsVUFBRSxDQUFDO1FBQ25DLEtBQUssQ0FBQyxHQUFHLENBQUMsSUFBSSxDQUFDLE1BQU0sQ0FBQyxXQUFXLENBQy9CLENBQThDO0lBRWxELENBQUM7SUFDRCxJQUFJLENBQUMsS0FBSyxDQUFDLElBQUksRUFBRSxDQUFDO1FBQUMsU0FBUztRQUFFLElBQUk7SUFBQyxDQUFDLEVBQ2pDLElBQUksS0FBTyxDQUFDO1FBQ1gsRUFBRSxFQUFFLE1BQU0sQ0FBQyxRQUFRLEtBQUssQ0FBVSxXQUFFLENBQUM7WUFDbkMsUUFBUSxDQUFDLElBQUk7UUFDZixDQUFDO0lBQ0gsQ0FBQyxHQUFHLEdBQUcsR0FBSyxDQUFDO1FBQ1gsRUFBRSxFQUFFLE1BQU0sQ0FBQyxRQUFRLEtBQUssQ0FBVSxXQUFFLENBQUM7WUFDbkMsUUFBUSxDQUFDLEdBQUc7UUFDZCxDQUFDO0lBQ0gsQ0FBQztBQUNMLENBQUM7QUFFRCxNQUFNLFVBQVUsU0FBUyxDQUFDLElBQWtCLEVBQUUsT0FBc0IsRUFBUSxDQUFDO0lBQzNFLElBQUksR0FBRyxJQUFJLFlBQVksR0FBRyxHQUFHLFdBQVcsQ0FBQyxJQUFJLElBQUksSUFBSTtJQUNyRCxHQUFHLENBQUMsSUFBSSxHQUFHLEdBQUs7SUFDaEIsR0FBRyxDQUFDLFNBQVMsR0FBRyxLQUFLO0lBRXJCLEVBQUUsRUFBRSxNQUFNLENBQUMsT0FBTyxLQUFLLENBQVEsU0FBRSxDQUFDO1FBQ2hDLElBQUksR0FBRyxPQUFPO0lBQ2hCLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxDQUFDLE9BQU8sS0FBSyxDQUFTLFVBQUUsQ0FBQztRQUN4QyxTQUFTLEdBQUcsT0FBTztJQUNyQixDQUFDLE1BQU0sRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDO1FBQ25CLEVBQUUsRUFBRSxPQUFPLENBQUMsU0FBUyxLQUFLLFNBQVMsRUFBRSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVM7UUFDbEUsRUFBRSxFQUFFLE9BQU8sQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUFFLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSTtJQUNyRCxDQUFDO0lBQ0QsRUFBRSxFQUFFLE1BQU0sQ0FBQyxTQUFTLEtBQUssQ0FBUyxVQUFFLENBQUM7UUFDbkMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FDL0IsQ0FBOEM7SUFFbEQsQ0FBQztJQUVELElBQUksQ0FBQyxTQUFTLENBQUMsSUFBSSxFQUFFLENBQUM7UUFBQyxTQUFTO1FBQUUsSUFBSTtJQUFDLENBQUM7QUFDMUMsQ0FBQyJ9