import { cursorPosition } from "./ansi_escapes.ts";
/**
 * Get cursor position.
 * @param options  Options.
 * ```
 * const cursor: Cursor = getCursorPosition();
 * console.log(cursor); // { x: 0, y: 14}
 * ```
 */ export function getCursorPosition({ stdin =Deno.stdin , stdout =Deno.stdout  } = {
}) {
    const data = new Uint8Array(8);
    Deno.setRaw(stdin.rid, true);
    stdout.writeSync(new TextEncoder().encode(cursorPosition));
    stdin.readSync(data);
    Deno.setRaw(stdin.rid, false);
    const [y, x] = new TextDecoder().decode(data).match(/\[(\d+);(\d+)R/)?.slice(1, 3).map(Number) ?? [
        0,
        0
    ];
    return {
        x,
        y
    };
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjIwLjEvYW5zaS9jdXJzb3JfcG9zaXRpb24udHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgY3Vyc29yUG9zaXRpb24gfSBmcm9tIFwiLi9hbnNpX2VzY2FwZXMudHNcIjtcblxuLyoqIEN1cnNvciBwb3NpdGlvbi4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ3Vyc29yIHtcbiAgeDogbnVtYmVyO1xuICB5OiBudW1iZXI7XG59XG5cbi8qKiBDdXJzb3IgcG9zaXRpb24gb3B0aW9ucy4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgQ3Vyc29yUG9zaXRpb25PcHRpb25zIHtcbiAgc3Rkb3V0PzogRGVuby5Xcml0ZXJTeW5jO1xuICBzdGRpbj86IERlbm8uUmVhZGVyU3luYyAmIHsgcmlkOiBudW1iZXIgfTtcbn1cblxuLyoqXG4gKiBHZXQgY3Vyc29yIHBvc2l0aW9uLlxuICogQHBhcmFtIG9wdGlvbnMgIE9wdGlvbnMuXG4gKiBgYGBcbiAqIGNvbnN0IGN1cnNvcjogQ3Vyc29yID0gZ2V0Q3Vyc29yUG9zaXRpb24oKTtcbiAqIGNvbnNvbGUubG9nKGN1cnNvcik7IC8vIHsgeDogMCwgeTogMTR9XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGdldEN1cnNvclBvc2l0aW9uKFxuICB7XG4gICAgc3RkaW4gPSBEZW5vLnN0ZGluLFxuICAgIHN0ZG91dCA9IERlbm8uc3Rkb3V0LFxuICB9OiBDdXJzb3JQb3NpdGlvbk9wdGlvbnMgPSB7fSxcbik6IEN1cnNvciB7XG4gIGNvbnN0IGRhdGEgPSBuZXcgVWludDhBcnJheSg4KTtcblxuICBEZW5vLnNldFJhdyhzdGRpbi5yaWQsIHRydWUpO1xuICBzdGRvdXQud3JpdGVTeW5jKG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShjdXJzb3JQb3NpdGlvbikpO1xuICBzdGRpbi5yZWFkU3luYyhkYXRhKTtcbiAgRGVuby5zZXRSYXcoc3RkaW4ucmlkLCBmYWxzZSk7XG5cbiAgY29uc3QgW3ksIHhdID0gbmV3IFRleHREZWNvZGVyKClcbiAgICAuZGVjb2RlKGRhdGEpXG4gICAgLm1hdGNoKC9cXFsoXFxkKyk7KFxcZCspUi8pXG4gICAgPy5zbGljZSgxLCAzKVxuICAgIC5tYXAoTnVtYmVyKSA/PyBbMCwgMF07XG5cbiAgcmV0dXJuIHsgeCwgeSB9O1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sR0FBRyxjQUFjLFFBQVEsQ0FBbUI7QUFjbEQsRUFPRyxBQVBIOzs7Ozs7O0NBT0csQUFQSCxFQU9HLENBQ0gsTUFBTSxVQUFVLGlCQUFpQixDQUMvQixDQUFDLENBQ0MsS0FBSyxFQUFHLElBQUksQ0FBQyxLQUFLLEdBQ2xCLE1BQU0sRUFBRyxJQUFJLENBQUMsTUFBTSxFQUNDLENBQUMsR0FBRyxDQUFDO0FBQUEsQ0FBQyxFQUNyQixDQUFDO0lBQ1QsS0FBSyxDQUFDLElBQUksR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLENBQUM7SUFFN0IsSUFBSSxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxFQUFFLElBQUk7SUFDM0IsTUFBTSxDQUFDLFNBQVMsQ0FBQyxHQUFHLENBQUMsV0FBVyxHQUFHLE1BQU0sQ0FBQyxjQUFjO0lBQ3hELEtBQUssQ0FBQyxRQUFRLENBQUMsSUFBSTtJQUNuQixJQUFJLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLEVBQUUsS0FBSztJQUU1QixLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUMsSUFBSSxHQUFHLENBQUMsV0FBVyxHQUMzQixNQUFNLENBQUMsSUFBSSxFQUNYLEtBQUssb0JBQ0osS0FBSyxDQUFDLENBQUMsRUFBRSxDQUFDLEVBQ1gsR0FBRyxDQUFDLE1BQU0sS0FBSyxDQUFDO1FBQUEsQ0FBQztRQUFFLENBQUM7SUFBQSxDQUFDO0lBRXhCLE1BQU0sQ0FBQyxDQUFDO1FBQUMsQ0FBQztRQUFFLENBQUM7SUFBQyxDQUFDO0FBQ2pCLENBQUMifQ==