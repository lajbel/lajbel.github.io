// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { Schema } from "../schema.ts";
import { map, seq, str } from "../type/mod.ts";
// Standard YAML's Failsafe schema.
// http://www.yaml.org/spec/1.2/spec.html#id2802346
export const failsafe = new Schema({
    explicit: [
        str,
        seq,
        map
    ]
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjk3LjAvZW5jb2RpbmcvX3lhbWwvc2NoZW1hL2ZhaWxzYWZlLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIFBvcnRlZCBmcm9tIGpzLXlhbWwgdjMuMTMuMTpcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ub2RlY2EvanMteWFtbC9jb21taXQvNjY1YWFkZGE0MjM0OWRjYWU4NjlmMTIwNDBkOWIxMGVmMThkMTJkYVxuLy8gQ29weXJpZ2h0IDIwMTEtMjAxNSBieSBWaXRhbHkgUHV6cmluLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIENvcHlyaWdodCAyMDE4LTIwMjEgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbmltcG9ydCB7IFNjaGVtYSB9IGZyb20gXCIuLi9zY2hlbWEudHNcIjtcbmltcG9ydCB7IG1hcCwgc2VxLCBzdHIgfSBmcm9tIFwiLi4vdHlwZS9tb2QudHNcIjtcblxuLy8gU3RhbmRhcmQgWUFNTCdzIEZhaWxzYWZlIHNjaGVtYS5cbi8vIGh0dHA6Ly93d3cueWFtbC5vcmcvc3BlYy8xLjIvc3BlYy5odG1sI2lkMjgwMjM0NlxuZXhwb3J0IGNvbnN0IGZhaWxzYWZlID0gbmV3IFNjaGVtYSh7XG4gIGV4cGxpY2l0OiBbc3RyLCBzZXEsIG1hcF0sXG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUErQixBQUEvQiw2QkFBK0I7QUFDL0IsRUFBb0YsQUFBcEYsa0ZBQW9GO0FBQ3BGLEVBQTBFLEFBQTFFLHdFQUEwRTtBQUMxRSxFQUEwRSxBQUExRSx3RUFBMEU7QUFFMUUsTUFBTSxHQUFHLE1BQU0sUUFBUSxDQUFjO0FBQ3JDLE1BQU0sR0FBRyxHQUFHLEVBQUUsR0FBRyxFQUFFLEdBQUcsUUFBUSxDQUFnQjtBQUU5QyxFQUFtQyxBQUFuQyxpQ0FBbUM7QUFDbkMsRUFBbUQsQUFBbkQsaURBQW1EO0FBQ25ELE1BQU0sQ0FBQyxLQUFLLENBQUMsUUFBUSxHQUFHLEdBQUcsQ0FBQyxNQUFNLENBQUMsQ0FBQztJQUNsQyxRQUFRLEVBQUUsQ0FBQztRQUFBLEdBQUc7UUFBRSxHQUFHO1FBQUUsR0FBRztJQUFBLENBQUM7QUFDM0IsQ0FBQyJ9