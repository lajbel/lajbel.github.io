export var DiffType;
(function(DiffType) {
    DiffType["removed"] = "removed";
    DiffType["common"] = "common";
    DiffType["added"] = "added";
})(DiffType || (DiffType = {
}));
const REMOVED = 1;
const COMMON = 2;
const ADDED = 3;
function createCommon(A, B, reverse) {
    const common = [];
    if (A.length === 0 || B.length === 0) return [];
    for(let i = 0; i < Math.min(A.length, B.length); i += 1){
        if (A[reverse ? A.length - i - 1 : i] === B[reverse ? B.length - i - 1 : i]) {
            common.push(A[reverse ? A.length - i - 1 : i]);
        } else {
            return common;
        }
    }
    return common;
}
/**
 * Renders the differences between the actual and expected values
 * @param A Actual value
 * @param B Expected value
 */ export function diff(A, B) {
    const prefixCommon = createCommon(A, B);
    const suffixCommon = createCommon(A.slice(prefixCommon.length), B.slice(prefixCommon.length), true).reverse();
    A = suffixCommon.length ? A.slice(prefixCommon.length, -suffixCommon.length) : A.slice(prefixCommon.length);
    B = suffixCommon.length ? B.slice(prefixCommon.length, -suffixCommon.length) : B.slice(prefixCommon.length);
    const swapped = B.length > A.length;
    [A, B] = swapped ? [
        B,
        A
    ] : [
        A,
        B
    ];
    const M = A.length;
    const N = B.length;
    if (!M && !N && !suffixCommon.length && !prefixCommon.length) return [];
    if (!N) {
        return [
            ...prefixCommon.map((c)=>({
                    type: DiffType.common,
                    value: c
                })
            ),
            ...A.map((a)=>({
                    type: swapped ? DiffType.added : DiffType.removed,
                    value: a
                })
            ),
            ...suffixCommon.map((c)=>({
                    type: DiffType.common,
                    value: c
                })
            ), 
        ];
    }
    const offset = N;
    const delta = M - N;
    const size = M + N + 1;
    const fp = new Array(size).fill({
        y: -1
    });
    /**
   * INFO:
   * This buffer is used to save memory and improve performance.
   * The first half is used to save route and last half is used to save diff
   * type.
   * This is because, when I kept new uint8array area to save type,performance
   * worsened.
   */ const routes = new Uint32Array((M * N + size + 1) * 2);
    const diffTypesPtrOffset = routes.length / 2;
    let ptr = 0;
    let p = -1;
    function backTrace(A, B, current, swapped) {
        const M = A.length;
        const N = B.length;
        const result = [];
        let a = M - 1;
        let b = N - 1;
        let j = routes[current.id];
        let type = routes[current.id + diffTypesPtrOffset];
        while(true){
            if (!j && !type) break;
            const prev = j;
            if (type === REMOVED) {
                result.unshift({
                    type: swapped ? DiffType.removed : DiffType.added,
                    value: B[b]
                });
                b -= 1;
            } else if (type === ADDED) {
                result.unshift({
                    type: swapped ? DiffType.added : DiffType.removed,
                    value: A[a]
                });
                a -= 1;
            } else {
                result.unshift({
                    type: DiffType.common,
                    value: A[a]
                });
                a -= 1;
                b -= 1;
            }
            j = routes[prev];
            type = routes[prev + diffTypesPtrOffset];
        }
        return result;
    }
    function createFP(slide, down, k, M) {
        if (slide && slide.y === -1 && down && down.y === -1) {
            return {
                y: 0,
                id: 0
            };
        }
        if (down && down.y === -1 || k === M || (slide && slide.y) > (down && down.y) + 1) {
            const prev = slide.id;
            ptr++;
            routes[ptr] = prev;
            routes[ptr + diffTypesPtrOffset] = ADDED;
            return {
                y: slide.y,
                id: ptr
            };
        } else {
            const prev = down.id;
            ptr++;
            routes[ptr] = prev;
            routes[ptr + diffTypesPtrOffset] = REMOVED;
            return {
                y: down.y + 1,
                id: ptr
            };
        }
    }
    function snake(k, slide, down, _offset, A, B) {
        const M = A.length;
        const N = B.length;
        if (k < -N || M < k) return {
            y: -1,
            id: -1
        };
        const fp = createFP(slide, down, k, M);
        while(fp.y + k < M && fp.y < N && A[fp.y + k] === B[fp.y]){
            const prev = fp.id;
            ptr++;
            fp.id = ptr;
            fp.y += 1;
            routes[ptr] = prev;
            routes[ptr + diffTypesPtrOffset] = COMMON;
        }
        return fp;
    }
    while(fp[delta + offset].y < N){
        p = p + 1;
        for(let k = -p; k < delta; ++k){
            fp[k + offset] = snake(k, fp[k - 1 + offset], fp[k + 1 + offset], offset, A, B);
        }
        for(let k1 = delta + p; k1 > delta; --k1){
            fp[k1 + offset] = snake(k1, fp[k1 - 1 + offset], fp[k1 + 1 + offset], offset, A, B);
        }
        fp[delta + offset] = snake(delta, fp[delta - 1 + offset], fp[delta + 1 + offset], offset, A, B);
    }
    return [
        ...prefixCommon.map((c)=>({
                type: DiffType.common,
                value: c
            })
        ),
        ...backTrace(A, B, fp[delta + offset], swapped),
        ...suffixCommon.map((c)=>({
                type: DiffType.common,
                value: c
            })
        ), 
    ];
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjk4LjAvdGVzdGluZy9fZGlmZi50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gVGhpcyBtb2R1bGUgaXMgYnJvd3NlciBjb21wYXRpYmxlLlxuXG5pbnRlcmZhY2UgRmFydGhlc3RQb2ludCB7XG4gIHk6IG51bWJlcjtcbiAgaWQ6IG51bWJlcjtcbn1cblxuZXhwb3J0IGVudW0gRGlmZlR5cGUge1xuICByZW1vdmVkID0gXCJyZW1vdmVkXCIsXG4gIGNvbW1vbiA9IFwiY29tbW9uXCIsXG4gIGFkZGVkID0gXCJhZGRlZFwiLFxufVxuXG5leHBvcnQgaW50ZXJmYWNlIERpZmZSZXN1bHQ8VD4ge1xuICB0eXBlOiBEaWZmVHlwZTtcbiAgdmFsdWU6IFQ7XG59XG5cbmNvbnN0IFJFTU9WRUQgPSAxO1xuY29uc3QgQ09NTU9OID0gMjtcbmNvbnN0IEFEREVEID0gMztcblxuZnVuY3Rpb24gY3JlYXRlQ29tbW9uPFQ+KEE6IFRbXSwgQjogVFtdLCByZXZlcnNlPzogYm9vbGVhbik6IFRbXSB7XG4gIGNvbnN0IGNvbW1vbiA9IFtdO1xuICBpZiAoQS5sZW5ndGggPT09IDAgfHwgQi5sZW5ndGggPT09IDApIHJldHVybiBbXTtcbiAgZm9yIChsZXQgaSA9IDA7IGkgPCBNYXRoLm1pbihBLmxlbmd0aCwgQi5sZW5ndGgpOyBpICs9IDEpIHtcbiAgICBpZiAoXG4gICAgICBBW3JldmVyc2UgPyBBLmxlbmd0aCAtIGkgLSAxIDogaV0gPT09IEJbcmV2ZXJzZSA/IEIubGVuZ3RoIC0gaSAtIDEgOiBpXVxuICAgICkge1xuICAgICAgY29tbW9uLnB1c2goQVtyZXZlcnNlID8gQS5sZW5ndGggLSBpIC0gMSA6IGldKTtcbiAgICB9IGVsc2Uge1xuICAgICAgcmV0dXJuIGNvbW1vbjtcbiAgICB9XG4gIH1cbiAgcmV0dXJuIGNvbW1vbjtcbn1cblxuLyoqXG4gKiBSZW5kZXJzIHRoZSBkaWZmZXJlbmNlcyBiZXR3ZWVuIHRoZSBhY3R1YWwgYW5kIGV4cGVjdGVkIHZhbHVlc1xuICogQHBhcmFtIEEgQWN0dWFsIHZhbHVlXG4gKiBAcGFyYW0gQiBFeHBlY3RlZCB2YWx1ZVxuICovXG5leHBvcnQgZnVuY3Rpb24gZGlmZjxUPihBOiBUW10sIEI6IFRbXSk6IEFycmF5PERpZmZSZXN1bHQ8VD4+IHtcbiAgY29uc3QgcHJlZml4Q29tbW9uID0gY3JlYXRlQ29tbW9uKEEsIEIpO1xuICBjb25zdCBzdWZmaXhDb21tb24gPSBjcmVhdGVDb21tb24oXG4gICAgQS5zbGljZShwcmVmaXhDb21tb24ubGVuZ3RoKSxcbiAgICBCLnNsaWNlKHByZWZpeENvbW1vbi5sZW5ndGgpLFxuICAgIHRydWUsXG4gICkucmV2ZXJzZSgpO1xuICBBID0gc3VmZml4Q29tbW9uLmxlbmd0aFxuICAgID8gQS5zbGljZShwcmVmaXhDb21tb24ubGVuZ3RoLCAtc3VmZml4Q29tbW9uLmxlbmd0aClcbiAgICA6IEEuc2xpY2UocHJlZml4Q29tbW9uLmxlbmd0aCk7XG4gIEIgPSBzdWZmaXhDb21tb24ubGVuZ3RoXG4gICAgPyBCLnNsaWNlKHByZWZpeENvbW1vbi5sZW5ndGgsIC1zdWZmaXhDb21tb24ubGVuZ3RoKVxuICAgIDogQi5zbGljZShwcmVmaXhDb21tb24ubGVuZ3RoKTtcbiAgY29uc3Qgc3dhcHBlZCA9IEIubGVuZ3RoID4gQS5sZW5ndGg7XG4gIFtBLCBCXSA9IHN3YXBwZWQgPyBbQiwgQV0gOiBbQSwgQl07XG4gIGNvbnN0IE0gPSBBLmxlbmd0aDtcbiAgY29uc3QgTiA9IEIubGVuZ3RoO1xuICBpZiAoIU0gJiYgIU4gJiYgIXN1ZmZpeENvbW1vbi5sZW5ndGggJiYgIXByZWZpeENvbW1vbi5sZW5ndGgpIHJldHVybiBbXTtcbiAgaWYgKCFOKSB7XG4gICAgcmV0dXJuIFtcbiAgICAgIC4uLnByZWZpeENvbW1vbi5tYXAoXG4gICAgICAgIChjKTogRGlmZlJlc3VsdDx0eXBlb2YgYz4gPT4gKHsgdHlwZTogRGlmZlR5cGUuY29tbW9uLCB2YWx1ZTogYyB9KSxcbiAgICAgICksXG4gICAgICAuLi5BLm1hcChcbiAgICAgICAgKGEpOiBEaWZmUmVzdWx0PHR5cGVvZiBhPiA9PiAoe1xuICAgICAgICAgIHR5cGU6IHN3YXBwZWQgPyBEaWZmVHlwZS5hZGRlZCA6IERpZmZUeXBlLnJlbW92ZWQsXG4gICAgICAgICAgdmFsdWU6IGEsXG4gICAgICAgIH0pLFxuICAgICAgKSxcbiAgICAgIC4uLnN1ZmZpeENvbW1vbi5tYXAoXG4gICAgICAgIChjKTogRGlmZlJlc3VsdDx0eXBlb2YgYz4gPT4gKHsgdHlwZTogRGlmZlR5cGUuY29tbW9uLCB2YWx1ZTogYyB9KSxcbiAgICAgICksXG4gICAgXTtcbiAgfVxuICBjb25zdCBvZmZzZXQgPSBOO1xuICBjb25zdCBkZWx0YSA9IE0gLSBOO1xuICBjb25zdCBzaXplID0gTSArIE4gKyAxO1xuICBjb25zdCBmcCA9IG5ldyBBcnJheShzaXplKS5maWxsKHsgeTogLTEgfSk7XG4gIC8qKlxuICAgKiBJTkZPOlxuICAgKiBUaGlzIGJ1ZmZlciBpcyB1c2VkIHRvIHNhdmUgbWVtb3J5IGFuZCBpbXByb3ZlIHBlcmZvcm1hbmNlLlxuICAgKiBUaGUgZmlyc3QgaGFsZiBpcyB1c2VkIHRvIHNhdmUgcm91dGUgYW5kIGxhc3QgaGFsZiBpcyB1c2VkIHRvIHNhdmUgZGlmZlxuICAgKiB0eXBlLlxuICAgKiBUaGlzIGlzIGJlY2F1c2UsIHdoZW4gSSBrZXB0IG5ldyB1aW50OGFycmF5IGFyZWEgdG8gc2F2ZSB0eXBlLHBlcmZvcm1hbmNlXG4gICAqIHdvcnNlbmVkLlxuICAgKi9cbiAgY29uc3Qgcm91dGVzID0gbmV3IFVpbnQzMkFycmF5KChNICogTiArIHNpemUgKyAxKSAqIDIpO1xuICBjb25zdCBkaWZmVHlwZXNQdHJPZmZzZXQgPSByb3V0ZXMubGVuZ3RoIC8gMjtcbiAgbGV0IHB0ciA9IDA7XG4gIGxldCBwID0gLTE7XG5cbiAgZnVuY3Rpb24gYmFja1RyYWNlPFQ+KFxuICAgIEE6IFRbXSxcbiAgICBCOiBUW10sXG4gICAgY3VycmVudDogRmFydGhlc3RQb2ludCxcbiAgICBzd2FwcGVkOiBib29sZWFuLFxuICApOiBBcnJheTx7XG4gICAgdHlwZTogRGlmZlR5cGU7XG4gICAgdmFsdWU6IFQ7XG4gIH0+IHtcbiAgICBjb25zdCBNID0gQS5sZW5ndGg7XG4gICAgY29uc3QgTiA9IEIubGVuZ3RoO1xuICAgIGNvbnN0IHJlc3VsdCA9IFtdO1xuICAgIGxldCBhID0gTSAtIDE7XG4gICAgbGV0IGIgPSBOIC0gMTtcbiAgICBsZXQgaiA9IHJvdXRlc1tjdXJyZW50LmlkXTtcbiAgICBsZXQgdHlwZSA9IHJvdXRlc1tjdXJyZW50LmlkICsgZGlmZlR5cGVzUHRyT2Zmc2V0XTtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgaWYgKCFqICYmICF0eXBlKSBicmVhaztcbiAgICAgIGNvbnN0IHByZXYgPSBqO1xuICAgICAgaWYgKHR5cGUgPT09IFJFTU9WRUQpIHtcbiAgICAgICAgcmVzdWx0LnVuc2hpZnQoe1xuICAgICAgICAgIHR5cGU6IHN3YXBwZWQgPyBEaWZmVHlwZS5yZW1vdmVkIDogRGlmZlR5cGUuYWRkZWQsXG4gICAgICAgICAgdmFsdWU6IEJbYl0sXG4gICAgICAgIH0pO1xuICAgICAgICBiIC09IDE7XG4gICAgICB9IGVsc2UgaWYgKHR5cGUgPT09IEFEREVEKSB7XG4gICAgICAgIHJlc3VsdC51bnNoaWZ0KHtcbiAgICAgICAgICB0eXBlOiBzd2FwcGVkID8gRGlmZlR5cGUuYWRkZWQgOiBEaWZmVHlwZS5yZW1vdmVkLFxuICAgICAgICAgIHZhbHVlOiBBW2FdLFxuICAgICAgICB9KTtcbiAgICAgICAgYSAtPSAxO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgcmVzdWx0LnVuc2hpZnQoeyB0eXBlOiBEaWZmVHlwZS5jb21tb24sIHZhbHVlOiBBW2FdIH0pO1xuICAgICAgICBhIC09IDE7XG4gICAgICAgIGIgLT0gMTtcbiAgICAgIH1cbiAgICAgIGogPSByb3V0ZXNbcHJldl07XG4gICAgICB0eXBlID0gcm91dGVzW3ByZXYgKyBkaWZmVHlwZXNQdHJPZmZzZXRdO1xuICAgIH1cbiAgICByZXR1cm4gcmVzdWx0O1xuICB9XG5cbiAgZnVuY3Rpb24gY3JlYXRlRlAoXG4gICAgc2xpZGU6IEZhcnRoZXN0UG9pbnQsXG4gICAgZG93bjogRmFydGhlc3RQb2ludCxcbiAgICBrOiBudW1iZXIsXG4gICAgTTogbnVtYmVyLFxuICApOiBGYXJ0aGVzdFBvaW50IHtcbiAgICBpZiAoc2xpZGUgJiYgc2xpZGUueSA9PT0gLTEgJiYgZG93biAmJiBkb3duLnkgPT09IC0xKSB7XG4gICAgICByZXR1cm4geyB5OiAwLCBpZDogMCB9O1xuICAgIH1cbiAgICBpZiAoXG4gICAgICAoZG93biAmJiBkb3duLnkgPT09IC0xKSB8fFxuICAgICAgayA9PT0gTSB8fFxuICAgICAgKHNsaWRlICYmIHNsaWRlLnkpID4gKGRvd24gJiYgZG93bi55KSArIDFcbiAgICApIHtcbiAgICAgIGNvbnN0IHByZXYgPSBzbGlkZS5pZDtcbiAgICAgIHB0cisrO1xuICAgICAgcm91dGVzW3B0cl0gPSBwcmV2O1xuICAgICAgcm91dGVzW3B0ciArIGRpZmZUeXBlc1B0ck9mZnNldF0gPSBBRERFRDtcbiAgICAgIHJldHVybiB7IHk6IHNsaWRlLnksIGlkOiBwdHIgfTtcbiAgICB9IGVsc2Uge1xuICAgICAgY29uc3QgcHJldiA9IGRvd24uaWQ7XG4gICAgICBwdHIrKztcbiAgICAgIHJvdXRlc1twdHJdID0gcHJldjtcbiAgICAgIHJvdXRlc1twdHIgKyBkaWZmVHlwZXNQdHJPZmZzZXRdID0gUkVNT1ZFRDtcbiAgICAgIHJldHVybiB7IHk6IGRvd24ueSArIDEsIGlkOiBwdHIgfTtcbiAgICB9XG4gIH1cblxuICBmdW5jdGlvbiBzbmFrZTxUPihcbiAgICBrOiBudW1iZXIsXG4gICAgc2xpZGU6IEZhcnRoZXN0UG9pbnQsXG4gICAgZG93bjogRmFydGhlc3RQb2ludCxcbiAgICBfb2Zmc2V0OiBudW1iZXIsXG4gICAgQTogVFtdLFxuICAgIEI6IFRbXSxcbiAgKTogRmFydGhlc3RQb2ludCB7XG4gICAgY29uc3QgTSA9IEEubGVuZ3RoO1xuICAgIGNvbnN0IE4gPSBCLmxlbmd0aDtcbiAgICBpZiAoayA8IC1OIHx8IE0gPCBrKSByZXR1cm4geyB5OiAtMSwgaWQ6IC0xIH07XG4gICAgY29uc3QgZnAgPSBjcmVhdGVGUChzbGlkZSwgZG93biwgaywgTSk7XG4gICAgd2hpbGUgKGZwLnkgKyBrIDwgTSAmJiBmcC55IDwgTiAmJiBBW2ZwLnkgKyBrXSA9PT0gQltmcC55XSkge1xuICAgICAgY29uc3QgcHJldiA9IGZwLmlkO1xuICAgICAgcHRyKys7XG4gICAgICBmcC5pZCA9IHB0cjtcbiAgICAgIGZwLnkgKz0gMTtcbiAgICAgIHJvdXRlc1twdHJdID0gcHJldjtcbiAgICAgIHJvdXRlc1twdHIgKyBkaWZmVHlwZXNQdHJPZmZzZXRdID0gQ09NTU9OO1xuICAgIH1cbiAgICByZXR1cm4gZnA7XG4gIH1cblxuICB3aGlsZSAoZnBbZGVsdGEgKyBvZmZzZXRdLnkgPCBOKSB7XG4gICAgcCA9IHAgKyAxO1xuICAgIGZvciAobGV0IGsgPSAtcDsgayA8IGRlbHRhOyArK2spIHtcbiAgICAgIGZwW2sgKyBvZmZzZXRdID0gc25ha2UoXG4gICAgICAgIGssXG4gICAgICAgIGZwW2sgLSAxICsgb2Zmc2V0XSxcbiAgICAgICAgZnBbayArIDEgKyBvZmZzZXRdLFxuICAgICAgICBvZmZzZXQsXG4gICAgICAgIEEsXG4gICAgICAgIEIsXG4gICAgICApO1xuICAgIH1cbiAgICBmb3IgKGxldCBrID0gZGVsdGEgKyBwOyBrID4gZGVsdGE7IC0taykge1xuICAgICAgZnBbayArIG9mZnNldF0gPSBzbmFrZShcbiAgICAgICAgayxcbiAgICAgICAgZnBbayAtIDEgKyBvZmZzZXRdLFxuICAgICAgICBmcFtrICsgMSArIG9mZnNldF0sXG4gICAgICAgIG9mZnNldCxcbiAgICAgICAgQSxcbiAgICAgICAgQixcbiAgICAgICk7XG4gICAgfVxuICAgIGZwW2RlbHRhICsgb2Zmc2V0XSA9IHNuYWtlKFxuICAgICAgZGVsdGEsXG4gICAgICBmcFtkZWx0YSAtIDEgKyBvZmZzZXRdLFxuICAgICAgZnBbZGVsdGEgKyAxICsgb2Zmc2V0XSxcbiAgICAgIG9mZnNldCxcbiAgICAgIEEsXG4gICAgICBCLFxuICAgICk7XG4gIH1cbiAgcmV0dXJuIFtcbiAgICAuLi5wcmVmaXhDb21tb24ubWFwKFxuICAgICAgKGMpOiBEaWZmUmVzdWx0PHR5cGVvZiBjPiA9PiAoeyB0eXBlOiBEaWZmVHlwZS5jb21tb24sIHZhbHVlOiBjIH0pLFxuICAgICksXG4gICAgLi4uYmFja1RyYWNlKEEsIEIsIGZwW2RlbHRhICsgb2Zmc2V0XSwgc3dhcHBlZCksXG4gICAgLi4uc3VmZml4Q29tbW9uLm1hcChcbiAgICAgIChjKTogRGlmZlJlc3VsdDx0eXBlb2YgYz4gPT4gKHsgdHlwZTogRGlmZlR5cGUuY29tbW9uLCB2YWx1ZTogYyB9KSxcbiAgICApLFxuICBdO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQVFPLE1BQU07VUFBRCxRQUFRO0lBQVIsUUFBUSxDQUNsQixDQUFPLFlBQVAsQ0FBTztJQURHLFFBQVEsQ0FFbEIsQ0FBTSxXQUFOLENBQU07SUFGSSxRQUFRLENBR2xCLENBQUssVUFBTCxDQUFLO0dBSEssUUFBUSxLQUFSLFFBQVE7O0FBV3BCLEtBQUssQ0FBQyxPQUFPLEdBQUcsQ0FBQztBQUNqQixLQUFLLENBQUMsTUFBTSxHQUFHLENBQUM7QUFDaEIsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDO1NBRU4sWUFBWSxDQUFJLENBQU0sRUFBRSxDQUFNLEVBQUUsT0FBaUIsRUFBTyxDQUFDO0lBQ2hFLEtBQUssQ0FBQyxNQUFNLEdBQUcsQ0FBQyxDQUFDO0lBQ2pCLEVBQUUsRUFBRSxDQUFDLENBQUMsTUFBTSxLQUFLLENBQUMsSUFBSSxD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