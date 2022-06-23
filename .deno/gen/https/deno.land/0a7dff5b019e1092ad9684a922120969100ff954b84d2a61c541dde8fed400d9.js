// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { Schema } from "../schema.ts";
import { func, regexp, undefinedType } from "../type/mod.ts";
import { def } from "./default.ts";
// Extends JS-YAML default schema with additional JavaScript types
// It is not described in the YAML specification.
export const extended = new Schema({
    explicit: [
        func,
        regexp,
        undefinedType
    ],
    include: [
        def
    ]
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjk3LjAvZW5jb2RpbmcvX3lhbWwvc2NoZW1hL2V4dGVuZGVkLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjEgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5cbmltcG9ydCB7IFNjaGVtYSB9IGZyb20gXCIuLi9zY2hlbWEudHNcIjtcbmltcG9ydCB7IGZ1bmMsIHJlZ2V4cCwgdW5kZWZpbmVkVHlwZSB9IGZyb20gXCIuLi90eXBlL21vZC50c1wiO1xuaW1wb3J0IHsgZGVmIH0gZnJvbSBcIi4vZGVmYXVsdC50c1wiO1xuXG4vLyBFeHRlbmRzIEpTLVlBTUwgZGVmYXVsdCBzY2hlbWEgd2l0aCBhZGRpdGlvbmFsIEphdmFTY3JpcHQgdHlwZXNcbi8vIEl0IGlzIG5vdCBkZXNjcmliZWQgaW4gdGhlIFlBTUwgc3BlY2lmaWNhdGlvbi5cbmV4cG9ydCBjb25zdCBleHRlbmRlZCA9IG5ldyBTY2hlbWEoe1xuICBleHBsaWNpdDogW2Z1bmMsIHJlZ2V4cCwgdW5kZWZpbmVkVHlwZV0sXG4gIGluY2x1ZGU6IFtkZWZdLFxufSk7XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsRUFBMEUsQUFBMUUsd0VBQTBFO0FBRTFFLE1BQU0sR0FBRyxNQUFNLFFBQVEsQ0FBYztBQUNyQyxNQUFNLEdBQUcsSUFBSSxFQUFFLE1BQU0sRUFBRSxhQUFhLFFBQVEsQ0FBZ0I7QUFDNUQsTUFBTSxHQUFHLEdBQUcsUUFBUSxDQUFjO0FBRWxDLEVBQWtFLEFBQWxFLGdFQUFrRTtBQUNsRSxFQUFpRCxBQUFqRCwrQ0FBaUQ7QUFDakQsTUFBTSxDQUFDLEtBQUssQ0FBQyxRQUFRLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBQyxDQUFDO0lBQ2xDLFFBQVEsRUFBRSxDQUFDO1FBQUEsSUFBSTtRQUFFLE1BQU07UUFBRSxhQUFhO0lBQUEsQ0FBQztJQUN2QyxPQUFPLEVBQUUsQ0FBQztRQUFBLEdBQUc7SUFBQSxDQUFDO0FBQ2hCLENBQUMifQ==