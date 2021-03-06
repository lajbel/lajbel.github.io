// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { Type } from "../type.ts";
const _toString = Object.prototype.toString;
function resolveYamlPairs(data) {
    const result = new Array(data.length);
    for(let index = 0; index < data.length; index++){
        const pair = data[index];
        if (_toString.call(pair) !== "[object Object]") return false;
        const keys = Object.keys(pair);
        if (keys.length !== 1) return false;
        result[index] = [
            keys[0],
            pair[keys[0]]
        ];
    }
    return true;
}
function constructYamlPairs(data) {
    if (data === null) return [];
    const result = new Array(data.length);
    for(let index = 0; index < data.length; index += 1){
        const pair = data[index];
        const keys = Object.keys(pair);
        result[index] = [
            keys[0],
            pair[keys[0]]
        ];
    }
    return result;
}
export const pairs = new Type("tag:yaml.org,2002:pairs", {
    construct: constructYamlPairs,
    kind: "sequence",
    resolve: resolveYamlPairs
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjk3LjAvZW5jb2RpbmcvX3lhbWwvdHlwZS9wYWlycy50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBQb3J0ZWQgZnJvbSBqcy15YW1sIHYzLjEzLjE6XG4vLyBodHRwczovL2dpdGh1Yi5jb20vbm9kZWNhL2pzLXlhbWwvY29tbWl0LzY2NWFhZGRhNDIzNDlkY2FlODY5ZjEyMDQwZDliMTBlZjE4ZDEyZGFcbi8vIENvcHlyaWdodCAyMDExLTIwMTUgYnkgVml0YWx5IFB1enJpbi4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuXG5pbXBvcnQgeyBUeXBlIH0gZnJvbSBcIi4uL3R5cGUudHNcIjtcbmltcG9ydCB0eXBlIHsgQW55IH0gZnJvbSBcIi4uL3V0aWxzLnRzXCI7XG5cbmNvbnN0IF90b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmc7XG5cbmZ1bmN0aW9uIHJlc29sdmVZYW1sUGFpcnMoZGF0YTogQW55W11bXSk6IGJvb2xlYW4ge1xuICBjb25zdCByZXN1bHQgPSBuZXcgQXJyYXkoZGF0YS5sZW5ndGgpO1xuXG4gIGZvciAobGV0IGluZGV4ID0gMDsgaW5kZXggPCBkYXRhLmxlbmd0aDsgaW5kZXgrKykge1xuICAgIGNvbnN0IHBhaXIgPSBkYXRhW2luZGV4XTtcblxuICAgIGlmIChfdG9TdHJpbmcuY2FsbChwYWlyKSAhPT0gXCJbb2JqZWN0IE9iamVjdF1cIikgcmV0dXJuIGZhbHNlO1xuXG4gICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHBhaXIpO1xuXG4gICAgaWYgKGtleXMubGVuZ3RoICE9PSAxKSByZXR1cm4gZmFsc2U7XG5cbiAgICByZXN1bHRbaW5kZXhdID0gW2tleXNbMF0sIHBhaXJba2V5c1swXSBhcyBBbnldXTtcbiAgfVxuXG4gIHJldHVybiB0cnVlO1xufVxuXG5mdW5jdGlvbiBjb25zdHJ1Y3RZYW1sUGFpcnMoZGF0YTogc3RyaW5nKTogQW55W10ge1xuICBpZiAoZGF0YSA9PT0gbnVsbCkgcmV0dXJuIFtdO1xuXG4gIGNvbnN0IHJlc3VsdCA9IG5ldyBBcnJheShkYXRhLmxlbmd0aCk7XG5cbiAgZm9yIChsZXQgaW5kZXggPSAwOyBpbmRleCA8IGRhdGEubGVuZ3RoOyBpbmRleCArPSAxKSB7XG4gICAgY29uc3QgcGFpciA9IGRhdGFbaW5kZXhdO1xuXG4gICAgY29uc3Qga2V5cyA9IE9iamVjdC5rZXlzKHBhaXIpO1xuXG4gICAgcmVzdWx0W2luZGV4XSA9IFtrZXlzWzBdLCBwYWlyW2tleXNbMF0gYXMgQW55XV07XG4gIH1cblxuICByZXR1cm4gcmVzdWx0O1xufVxuXG5leHBvcnQgY29uc3QgcGFpcnMgPSBuZXcgVHlwZShcInRhZzp5YW1sLm9yZywyMDAyOnBhaXJzXCIsIHtcbiAgY29uc3RydWN0OiBjb25zdHJ1Y3RZYW1sUGFpcnMsXG4gIGtpbmQ6IFwic2VxdWVuY2VcIixcbiAgcmVzb2x2ZTogcmVzb2x2ZVlhbWxQYWlycyxcbn0pO1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEVBQStCLEFBQS9CLDZCQUErQjtBQUMvQixFQUFvRixBQUFwRixrRkFBb0Y7QUFDcEYsRUFBMEUsQUFBMUUsd0VBQTBFO0FBQzFFLEVBQTBFLEFBQTFFLHdFQUEwRTtBQUUxRSxNQUFNLEdBQUcsSUFBSSxRQUFRLENBQVk7QUFHakMsS0FBSyxDQUFDLFNBQVMsR0FBRyxNQUFNLENBQUMsU0FBUyxDQUFDLFFBQVE7U0FFbEMsZ0JBQWdCLENBQUMsSUFBYSxFQUFXLENBQUM7SUFDakQsS0FBSyxDQUFDLE1BQU0sR0FBRyxHQUFHLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxNQUFNO0lBRXBDLEdBQUcsQ0FBRSxHQUFHLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRSxLQUFLLEdBQUcsSUFBSSxDQUFDLE1BQU0sRUFBRSxLQUFLLEdBQUksQ0FBQztRQUNqRCxLQUFLLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQyxLQUFLO1FBRXZCLEVBQUUsRUFBRSxTQUFTLENBQUMsSUFBSSxDQUFDLElBQUksTUFBTSxDQUFpQixrQkFBRSxNQUFNLENBQUMsS0FBSztRQUU1RCxLQUFLLENBQUMsSUFBSSxHQUFHLE1BQU0sQ0FBQyxJQUFJLENBQUMsSUFBSTtRQUU3QixFQUFFLEVBQUUsSUFBSSxDQUFDLE1BQU0sS0FBSyxDQUFDLEVBQUUsTUFBTSxDQUFDLEtBQUs7UUFFbkMsTUFBTSxDQUFDLEtBQUssSUFBSSxDQUFDO1lBQUEsSUFBSSxDQUFDLENBQUM7WUFBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFBUyxDQUFDO0lBQ2pELENBQUM7SUFFRCxNQUFNLENBQUMsSUFBSTtBQUNiLENBQUM7U0FFUSxrQkFBa0IsQ0FBQyxJQUFZLEVBQVMsQ0FBQztJQUNoRCxFQUFFLEVBQUUsSUFBSSxLQUFLLElBQUksRUFBRSxNQUFNLENBQUMsQ0FBQyxDQUFDO0lBRTVCLEtBQUssQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsTUFBTTtJQUVwQyxHQUFHLENBQUUsR0FBRyxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUUsS0FBSyxHQUFHLElBQUksQ0FBQyxNQUFNLEVBQUUsS0FBSyxJQUFJLENBQUMsQ0FBRSxDQUFDO1FBQ3BELEtBQUssQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDLEtBQUs7UUFFdkIsS0FBSyxDQUFDLElBQUksR0FBRyxNQUFNLENBQUMsSUFBSSxDQUFDLElBQUk7UUFFN0IsTUFBTSxDQUFDLEtBQUssSUFBSSxDQUFDO1lBQUEsSUFBSSxDQUFDLENBQUM7WUFBRyxJQUFJLENBQUMsSUFBSSxDQUFDLENBQUM7UUFBUyxDQUFDO0lBQ2pELENBQUM7SUFFRCxNQUFNLENBQUMsTUFBTTtBQUNmLENBQUM7QUFFRCxNQUFNLENBQUMsS0FBSyxDQUFDLEtBQUssR0FBRyxHQUFHLENBQUMsSUFBSSxDQUFDLENBQXlCLDBCQUFFLENBQUM7SUFDeEQsU0FBUyxFQUFFLGtCQUFrQjtJQUM3QixJQUFJLEVBQUUsQ0FBVTtJQUNoQixPQUFPLEVBQUUsZ0JBQWdCO0FBQzNCLENBQUMifQ==