// Ported and adapted from js-yaml-js-types v1.0.0:
// https://github.com/nodeca/js-yaml-js-types/tree/ac537e7bbdd3c2cbbd9882ca3919c520c2dc022b
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { Type } from "../type.ts";
export const undefinedType = new Type("tag:yaml.org,2002:js/undefined", {
    kind: "scalar",
    resolve () {
        return true;
    },
    construct () {
        return undefined;
    },
    predicate (object) {
        return typeof object === "undefined";
    },
    represent () {
        return "";
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjk3LjAvZW5jb2RpbmcvX3lhbWwvdHlwZS91bmRlZmluZWQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gUG9ydGVkIGFuZCBhZGFwdGVkIGZyb20ganMteWFtbC1qcy10eXBlcyB2MS4wLjA6XG4vLyBodHRwczovL2dpdGh1Yi5jb20vbm9kZWNhL2pzLXlhbWwtanMtdHlwZXMvdHJlZS9hYzUzN2U3YmJkZDNjMmNiYmQ5ODgyY2EzOTE5YzUyMGMyZGMwMjJiXG4vLyBDb3B5cmlnaHQgMjAxMS0yMDE1IGJ5IFZpdGFseSBQdXpyaW4uIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gQ29weXJpZ2h0IDIwMTgtMjAyMSB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cblxuaW1wb3J0IHsgVHlwZSB9IGZyb20gXCIuLi90eXBlLnRzXCI7XG5cbmV4cG9ydCBjb25zdCB1bmRlZmluZWRUeXBlID0gbmV3IFR5cGUoXCJ0YWc6eWFtbC5vcmcsMjAwMjpqcy91bmRlZmluZWRcIiwge1xuICBraW5kOiBcInNjYWxhclwiLFxuICByZXNvbHZlKCkge1xuICAgIHJldHVybiB0cnVlO1xuICB9LFxuICBjb25zdHJ1Y3QoKSB7XG4gICAgcmV0dXJuIHVuZGVmaW5lZDtcbiAgfSxcbiAgcHJlZGljYXRlKG9iamVjdCkge1xuICAgIHJldHVybiB0eXBlb2Ygb2JqZWN0ID09PSBcInVuZGVmaW5lZFwiO1xuICB9LFxuICByZXByZXNlbnQoKSB7XG4gICAgcmV0dXJuIFwiXCI7XG4gIH0sXG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUFtRCxBQUFuRCxpREFBbUQ7QUFDbkQsRUFBMkYsQUFBM0YseUZBQTJGO0FBQzNGLEVBQTBFLEFBQTFFLHdFQUEwRTtBQUMxRSxFQUEwRSxBQUExRSx3RUFBMEU7QUFFMUUsTUFBTSxHQUFHLElBQUksUUFBUSxDQUFZO0FBRWpDLE1BQU0sQ0FBQyxLQUFLLENBQUMsYUFBYSxHQUFHLEdBQUcsQ0FBQyxJQUFJLENBQUMsQ0FBZ0MsaUNBQUUsQ0FBQztJQUN2RSxJQUFJLEVBQUUsQ0FBUTtJQUNkLE9BQU8sSUFBRyxDQUFDO1FBQ1QsTUFBTSxDQUFDLElBQUk7SUFDYixDQUFDO0lBQ0QsU0FBUyxJQUFHLENBQUM7UUFDWCxNQUFNLENBQUMsU0FBUztJQUNsQixDQUFDO0lBQ0QsU0FBUyxFQUFDLE1BQU0sRUFBRSxDQUFDO1FBQ2pCLE1BQU0sQ0FBQyxNQUFNLENBQUMsTUFBTSxLQUFLLENBQVc7SUFDdEMsQ0FBQztJQUNELFNBQVMsSUFBRyxDQUFDO1FBQ1gsTUFBTSxDQUFDLENBQUU7SUFDWCxDQUFDO0FBQ0gsQ0FBQyJ9