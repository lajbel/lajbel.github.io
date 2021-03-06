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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjk4LjAvbm9kZS9fZnMvX2ZzX21rZGlyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjEgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5pbXBvcnQgdHlwZSB7IENhbGxiYWNrV2l0aEVycm9yIH0gZnJvbSBcIi4vX2ZzX2NvbW1vbi50c1wiO1xuaW1wb3J0IHsgZnJvbUZpbGVVcmwgfSBmcm9tIFwiLi4vcGF0aC50c1wiO1xuXG4vKipcbiAqIFRPRE86IEFsc28gYWNjZXB0ICdwYXRoJyBwYXJhbWV0ZXIgYXMgYSBOb2RlIHBvbHlmaWxsIEJ1ZmZlciB0eXBlIG9uY2UgdGhlc2VcbiAqIGFyZSBpbXBsZW1lbnRlZC4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9kZW5vbGFuZC9kZW5vL2lzc3Vlcy8zNDAzXG4gKi9cbnR5cGUgTWtkaXJPcHRpb25zID1cbiAgfCB7IHJlY3Vyc2l2ZT86IGJvb2xlYW47IG1vZGU/OiBudW1iZXIgfCB1bmRlZmluZWQgfVxuICB8IG51bWJlclxuICB8IGJvb2xlYW47XG5cbmV4cG9ydCBmdW5jdGlvbiBta2RpcihcbiAgcGF0aDogc3RyaW5nIHwgVVJMLFxuICBvcHRpb25zPzogTWtkaXJPcHRpb25zIHwgQ2FsbGJhY2tXaXRoRXJyb3IsXG4gIGNhbGxiYWNrPzogQ2FsbGJhY2tXaXRoRXJyb3IsXG4pOiB2b2lkIHtcbiAgcGF0aCA9IHBhdGggaW5zdGFuY2VvZiBVUkwgPyBmcm9tRmlsZVVybChwYXRoKSA6IHBhdGg7XG5cbiAgbGV0IG1vZGUgPSAwbzc3NztcbiAgbGV0IHJlY3Vyc2l2ZSA9IGZhbHNlO1xuXG4gIGlmICh0eXBlb2Ygb3B0aW9ucyA9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICBjYWxsYmFjayA9IG9wdGlvbnM7XG4gIH0gZWxzZSBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwibnVtYmVyXCIpIHtcbiAgICBtb2RlID0gb3B0aW9ucztcbiAgfSBlbHNlIGlmICh0eXBlb2Ygb3B0aW9ucyA9PT0gXCJib29sZWFuXCIpIHtcbiAgICByZWN1cnNpdmUgPSBvcHRpb25zO1xuICB9IGVsc2UgaWYgKG9wdGlvbnMpIHtcbiAgICBpZiAob3B0aW9ucy5yZWN1cnNpdmUgIT09IHVuZGVmaW5lZCkgcmVjdXJzaXZlID0gb3B0aW9ucy5yZWN1cnNpdmU7XG4gICAgaWYgKG9wdGlvbnMubW9kZSAhPT0gdW5kZWZpbmVkKSBtb2RlID0gb3B0aW9ucy5tb2RlO1xuICB9XG4gIGlmICh0eXBlb2YgcmVjdXJzaXZlICE9PSBcImJvb2xlYW5cIikge1xuICAgIHRocm93IG5ldyBEZW5vLmVycm9ycy5JbnZhbGlkRGF0YShcbiAgICAgIFwiaW52YWxpZCByZWN1cnNpdmUgb3B0aW9uICwgbXVzdCBiZSBhIGJvb2xlYW5cIixcbiAgICApO1xuICB9XG4gIERlbm8ubWtkaXIocGF0aCwgeyByZWN1cnNpdmUsIG1vZGUgfSlcbiAgICAudGhlbigoKSA9PiB7XG4gICAgICBpZiAodHlwZW9mIGNhbGxiYWNrID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgY2FsbGJhY2sobnVsbCk7XG4gICAgICB9XG4gICAgfSwgKGVycikgPT4ge1xuICAgICAgaWYgKHR5cGVvZiBjYWxsYmFjayA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgIGNhbGxiYWNrKGVycik7XG4gICAgICB9XG4gICAgfSk7XG59XG5cbmV4cG9ydCBmdW5jdGlvbiBta2RpclN5bmMocGF0aDogc3RyaW5nIHwgVVJMLCBvcHRpb25zPzogTWtkaXJPcHRpb25zKTogdm9pZCB7XG4gIHBhdGggPSBwYXRoIGluc3RhbmNlb2YgVVJMID8gZnJvbUZpbGVVcmwocGF0aCkgOiBwYXRoO1xuICBsZXQgbW9kZSA9IDBvNzc3O1xuICBsZXQgcmVjdXJzaXZlID0gZmFsc2U7XG5cbiAgaWYgKHR5cGVvZiBvcHRpb25zID09PSBcIm51bWJlclwiKSB7XG4gICAgbW9kZSA9IG9wdGlvbnM7XG4gIH0gZWxzZSBpZiAodHlwZW9mIG9wdGlvbnMgPT09IFwiYm9vbGVhblwiKSB7XG4gICAgcmVjdXJzaXZlID0gb3B0aW9ucztcbiAgfSBlbHNlIGlmIChvcHRpb25zKSB7XG4gICAgaWYgKG9wdGlvbnMucmVjdXJzaXZlICE9PSB1bmRlZmluZWQpIHJlY3Vyc2l2ZSA9IG9wdGlvbnMucmVjdXJzaXZlO1xuICAgIGlmIChvcHRpb25zLm1vZGUgIT09IHVuZGVmaW5lZCkgbW9kZSA9IG9wdGlvbnMubW9kZTtcbiAgfVxuICBpZiAodHlwZW9mIHJlY3Vyc2l2ZSAhPT0gXCJib29sZWFuXCIpIHtcbiAgICB0aHJvdyBuZXcgRGVuby5lcnJvcnMuSW52YWxpZERhdGEoXG4gICAgICBcImludmFsaWQgcmVjdXJzaXZlIG9wdGlvbiAsIG11c3QgYmUgYSBib29sZWFuXCIsXG4gICAgKTtcbiAgfVxuXG4gIERlbm8ubWtkaXJTeW5jKHBhdGgsIHsgcmVjdXJzaXZlLCBtb2RlIH0pO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUVBLE1BQU0sR0FBRyxXQUFXLFFBQVEsQ0FBWTtBQVd4QyxNQUFNLFVBQVUsS0FBSyxDQUNuQixJQUFrQixFQUNsQixPQUEwQyxFQUMxQyxRQUE0QixFQUN0QixDQUFDO0lBQ1AsSUFBSSxHQUFHLElBQUksWUFBWSxHQUFHLEdBQUcsV0FBVyxDQUFDLElBQUksSUFBSSxJQUFJO0lBRXJELEdBQUcsQ0FBQyxJQUFJLEdBQUcsR0FBSztJQUNoQixHQUFHLENBQUMsU0FBUyxHQUFHLEtBQUs7SUFFckIsRUFBRSxFQUFFLE1BQU0sQ0FBQyxPQUFPLElBQUksQ0FBVSxXQUFFLENBQUM7UUFDakMsUUFBUSxHQUFHLE9BQU87SUFDcEIsQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLENBQUMsT0FBTyxLQUFLLENBQVEsU0FBRSxDQUFDO1FBQ3ZDLElBQUksR0FBRyxPQUFPO0lBQ2hCLENBQUMsTUFBTSxFQUFFLEVBQUUsTUFBTSxDQUFDLE9BQU8sS0FBSyxDQUFTLFVBQUUsQ0FBQztRQUN4QyxTQUFTLEdBQUcsT0FBTztJQUNyQixDQUFDLE1BQU0sRUFBRSxFQUFFLE9BQU8sRUFBRSxDQUFDO1FBQ25CLEVBQUUsRUFBRSxPQUFPLENBQUMsU0FBUyxLQUFLLFNBQVMsRUFBRSxTQUFTLEdBQUcsT0FBTyxDQUFDLFNBQVM7UUFDbEUsRUFBRSxFQUFFLE9BQU8sQ0FBQyxJQUFJLEtBQUssU0FBUyxFQUFFLElBQUksR0FBRyxPQUFPLENBQUMsSUFBSTtJQUNyRCxDQUFDO0lBQ0QsRUFBRSxFQUFFLE1BQU0sQ0FBQyxTQUFTLEtBQUssQ0FBUyxVQUFFLENBQUM7UUFDbkMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxJQUFJLENBQUMsTUFBTSxDQUFDLFdBQVcsQ0FDL0IsQ0FBOEM7SUFFbEQsQ0FBQztJQUNELElBQUksQ0FBQyxLQUFLLENBQUMsSUFBSSxFQUFFLENBQUM7UUFBQyxTQUFTO1FBQUUsSUFBSTtJQUFDLENBQUMsRUFDakMsSUFBSSxLQUFPLENBQUM7UUFDWCxFQUFFLEVBQUUsTUFBTSxDQUFDLFFBQVEsS0FBSyxDQUFVLFdBQUUsQ0FBQztZQUNuQyxRQUFRLENBQUMsSUFBSTtRQUNmLENBQUM7SUFDSCxDQUFDLEdBQUcsR0FBRyxHQUFLLENBQUM7UUFDWCxFQUFFLEVBQUUsTUFBTSxDQUFDLFFBQVEsS0FBSyxDQUFVLFdBQUUsQ0FBQztZQUNuQyxRQUFRLENBQUMsR0FBRztRQUNkLENBQUM7SUFDSCxDQUFDO0FBQ0wsQ0FBQztBQUVELE1BQU0sVUFBVSxTQUFTLENBQUMsSUFBa0IsRUFBRSxPQUFzQixFQUFRLENBQUM7SUFDM0UsSUFBSSxHQUFHLElBQUksWUFBWSxHQUFHLEdBQUcsV0FBVyxDQUFDLElBQUksSUFBSSxJQUFJO0lBQ3JELEdBQUcsQ0FBQyxJQUFJLEdBQUcsR0FBSztJQUNoQixHQUFHLENBQUMsU0FBUyxHQUFHLEtBQUs7SUFFckIsRUFBRSxFQUFFLE1BQU0sQ0FBQyxPQUFPLEtBQUssQ0FBUSxTQUFFLENBQUM7UUFDaEMsSUFBSSxHQUFHLE9BQU87SUFDaEIsQ0FBQyxNQUFNLEVBQUUsRUFBRSxNQUFNLENBQUMsT0FBTyxLQUFLLENBQVMsVUFBRSxDQUFDO1FBQ3hDLFNBQVMsR0FBRyxPQUFPO0lBQ3JCLENBQUMsTUFBTSxFQUFFLEVBQUUsT0FBTyxFQUFFLENBQUM7UUFDbkIsRUFBRSxFQUFFLE9BQU8sQ0FBQyxTQUFTLEtBQUssU0FBUyxFQUFFLFNBQVMsR0FBRyxPQUFPLENBQUMsU0FBUztRQUNsRSxFQUFFLEVBQUUsT0FBTyxDQUFDLElBQUksS0FBSyxTQUFTLEVBQUUsSUFBSSxHQUFHLE9BQU8sQ0FBQyxJQUFJO0lBQ3JELENBQUM7SUFDRCxFQUFFLEVBQUUsTUFBTSxDQUFDLFNBQVMsS0FBSyxDQUFTLFVBQUUsQ0FBQztRQUNuQyxLQUFLLENBQUMsR0FBRyxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUMsV0FBVyxDQUMvQixDQUE4QztJQUVsRCxDQUFDO0lBRUQsSUFBSSxDQUFDLFNBQVMsQ0FBQyxJQUFJLEVBQUUsQ0FBQztRQUFDLFNBQVM7UUFBRSxJQUFJO0lBQUMsQ0FBQztBQUMxQyxDQUFDIn0=