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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZ3Zmb2ltYXNhMmFvZW9lY3d1aGIya3NzZmVzdXB5YnUzYmtydDZ3Mnh5NnZpZW1iam9hcS5hcndlYXZlLm5ldC9OVXJrTUJJR2dPSTRnclVPSFNwU0tTVkg0RFRZVlJuNjJyNDlWQkdCUzRFL3Rlc3RpbmcvX2RpZmYudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gQ29weXJpZ2h0IDIwMTgtMjAyMSB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cbi8vIFRoaXMgbW9kdWxlIGlzIGJyb3dzZXIgY29tcGF0aWJsZS5cblxuaW50ZXJmYWNlIEZhcnRoZXN0UG9pbnQge1xuICB5OiBudW1iZXI7XG4gIGlkOiBudW1iZXI7XG59XG5cbmV4cG9ydCBlbnVtIERpZmZUeXBlIHtcbiAgcmVtb3ZlZCA9IFwicmVtb3ZlZFwiLFxuICBjb21tb24gPSBcImNvbW1vblwiLFxuICBhZGRlZCA9IFwiYWRkZWRcIixcbn1cblxuZXhwb3J0IGludGVyZmFjZSBEaWZmUmVzdWx0PFQ+IHtcbiAgdHlwZTogRGlmZlR5cGU7XG4gIHZhbHVlOiBUO1xufVxuXG5jb25zdCBSRU1PVkVEID0gMTtcbmNvbnN0IENPTU1PTiA9IDI7XG5jb25zdCBBRERFRCA9IDM7XG5cbmZ1bmN0aW9uIGNyZWF0ZUNvbW1vbjxUPihBOiBUW10sIEI6IFRbXSwgcmV2ZXJzZT86IGJvb2xlYW4pOiBUW10ge1xuICBjb25zdCBjb21tb24gPSBbXTtcbiAgaWYgKEEubGVuZ3RoID09PSAwIHx8IEIubGVuZ3RoID09PSAwKSByZXR1cm4gW107XG4gIGZvciAobGV0IGkgPSAwOyBpIDwgTWF0aC5taW4oQS5sZW5ndGgsIEIubGVuZ3RoKTsgaSArPSAxKSB7XG4gICAgaWYgKFxuICAgICAgQVtyZXZlcnNlID8gQS5sZW5ndGggLSBpIC0gMSA6IGldID09PSBCW3JldmVyc2UgPyBCLmxlbmd0aCAtIGkgLSAxIDogaV1cbiAgICApIHtcbiAgICAgIGNvbW1vbi5wdXNoKEFbcmV2ZXJzZSA/IEEubGVuZ3RoIC0gaSAtIDEgOiBpXSk7XG4gICAgfSBlbHNlIHtcbiAgICAgIHJldHVybiBjb21tb247XG4gICAgfVxuICB9XG4gIHJldHVybiBjb21tb247XG59XG5cbi8qKlxuICogUmVuZGVycyB0aGUgZGlmZmVyZW5jZXMgYmV0d2VlbiB0aGUgYWN0dWFsIGFuZCBleHBlY3RlZCB2YWx1ZXNcbiAqIEBwYXJhbSBBIEFjdHVhbCB2YWx1ZVxuICogQHBhcmFtIEIgRXhwZWN0ZWQgdmFsdWVcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIGRpZmY8VD4oQTogVFtdLCBCOiBUW10pOiBBcnJheTxEaWZmUmVzdWx0PFQ+PiB7XG4gIGNvbnN0IHByZWZpeENvbW1vbiA9IGNyZWF0ZUNvbW1vbihBLCBCKTtcbiAgY29uc3Qgc3VmZml4Q29tbW9uID0gY3JlYXRlQ29tbW9uKFxuICAgIEEuc2xpY2UocHJlZml4Q29tbW9uLmxlbmd0aCksXG4gICAgQi5zbGljZShwcmVmaXhDb21tb24ubGVuZ3RoKSxcbiAgICB0cnVlLFxuICApLnJldmVyc2UoKTtcbiAgQSA9IHN1ZmZpeENvbW1vbi5sZW5ndGhcbiAgICA/IEEuc2xpY2UocHJlZml4Q29tbW9uLmxlbmd0aCwgLXN1ZmZpeENvbW1vbi5sZW5ndGgpXG4gICAgOiBBLnNsaWNlKHByZWZpeENvbW1vbi5sZW5ndGgpO1xuICBCID0gc3VmZml4Q29tbW9uLmxlbmd0aFxuICAgID8gQi5zbGljZShwcmVmaXhDb21tb24ubGVuZ3RoLCAtc3VmZml4Q29tbW9uLmxlbmd0aClcbiAgICA6IEIuc2xpY2UocHJlZml4Q29tbW9uLmxlbmd0aCk7XG4gIGNvbnN0IHN3YXBwZWQgPSBCLmxlbmd0aCA+IEEubGVuZ3RoO1xuICBbQSwgQl0gPSBzd2FwcGVkID8gW0IsIEFdIDogW0EsIEJdO1xuICBjb25zdCBNID0gQS5sZW5ndGg7XG4gIGNvbnN0IE4gPSBCLmxlbmd0aDtcbiAgaWYgKCFNICYmICFOICYmICFzdWZmaXhDb21tb24ubGVuZ3RoICYmICFwcmVmaXhDb21tb24ubGVuZ3RoKSByZXR1cm4gW107XG4gIGlmICghTikge1xuICAgIHJldHVybiBbXG4gICAgICAuLi5wcmVmaXhDb21tb24ubWFwKFxuICAgICAgICAoYyk6IERpZmZSZXN1bHQ8dHlwZW9mIGM+ID0+ICh7IHR5cGU6IERpZmZUeXBlLmNvbW1vbiwgdmFsdWU6IGMgfSksXG4gICAgICApLFxuICAgICAgLi4uQS5tYXAoXG4gICAgICAgIChhKTogRGlmZlJlc3VsdDx0eXBlb2YgYT4gPT4gKHtcbiAgICAgICAgICB0eXBlOiBzd2FwcGVkID8gRGlmZlR5cGUuYWRkZWQgOiBEaWZmVHlwZS5yZW1vdmVkLFxuICAgICAgICAgIHZhbHVlOiBhLFxuICAgICAgICB9KSxcbiAgICAgICksXG4gICAgICAuLi5zdWZmaXhDb21tb24ubWFwKFxuICAgICAgICAoYyk6IERpZmZSZXN1bHQ8dHlwZW9mIGM+ID0+ICh7IHR5cGU6IERpZmZUeXBlLmNvbW1vbiwgdmFsdWU6IGMgfSksXG4gICAgICApLFxuICAgIF07XG4gIH1cbiAgY29uc3Qgb2Zmc2V0ID0gTjtcbiAgY29uc3QgZGVsdGEgPSBNIC0gTjtcbiAgY29uc3Qgc2l6ZSA9IE0gKyBOICsgMTtcbiAgY29uc3QgZnAgPSBuZXcgQXJyYXkoc2l6ZSkuZmlsbCh7IHk6IC0xIH0pO1xuICAvKipcbiAgICogSU5GTzpcbiAgICogVGhpcyBidWZmZXIgaXMgdXNlZCB0byBzYXZlIG1lbW9yeSBhbmQgaW1wcm92ZSBwZXJmb3JtYW5jZS5cbiAgICogVGhlIGZpcnN0IGhhbGYgaXMgdXNlZCB0byBzYXZlIHJvdXRlIGFuZCBsYXN0IGhhbGYgaXMgdXNlZCB0byBzYXZlIGRpZmZcbiAgICogdHlwZS5cbiAgICogVGhpcyBpcyBiZWNhdXNlLCB3aGVuIEkga2VwdCBuZXcgdWludDhhcnJheSBhcmVhIHRvIHNhdmUgdHlwZSxwZXJmb3JtYW5jZVxuICAgKiB3b3JzZW5lZC5cbiAgICovXG4gIGNvbnN0IHJvdXRlcyA9IG5ldyBVaW50MzJBcnJheSgoTSAqIE4gKyBzaXplICsgMSkgKiAyKTtcbiAgY29uc3QgZGlmZlR5cGVzUHRyT2Zmc2V0ID0gcm91dGVzLmxlbmd0aCAvIDI7XG4gIGxldCBwdHIgPSAwO1xuICBsZXQgcCA9IC0xO1xuXG4gIGZ1bmN0aW9uIGJhY2tUcmFjZTxUPihcbiAgICBBOiBUW10sXG4gICAgQjogVFtdLFxuICAgIGN1cnJlbnQ6IEZhcnRoZXN0UG9pbnQsXG4gICAgc3dhcHBlZDogYm9vbGVhbixcbiAgKTogQXJyYXk8e1xuICAgIHR5cGU6IERpZmZUeXBlO1xuICAgIHZhbHVlOiBUO1xuICB9PiB7XG4gICAgY29uc3QgTSA9IEEubGVuZ3RoO1xuICAgIGNvbnN0IE4gPSBCLmxlbmd0aDtcbiAgICBjb25zdCByZXN1bHQgPSBbXTtcbiAgICBsZXQgYSA9IE0gLSAxO1xuICAgIGxldCBiID0gTiAtIDE7XG4gICAgbGV0IGogPSByb3V0ZXNbY3VycmVudC5pZF07XG4gICAgbGV0IHR5cGUgPSByb3V0ZXNbY3VycmVudC5pZCArIGRpZmZUeXBlc1B0ck9mZnNldF07XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGlmICghaiAmJiAhdHlwZSkgYnJlYWs7XG4gICAgICBjb25zdCBwcmV2ID0gajtcbiAgICAgIGlmICh0eXBlID09PSBSRU1PVkVEKSB7XG4gICAgICAgIHJlc3VsdC51bnNoaWZ0KHtcbiAgICAgICAgICB0eXBlOiBzd2FwcGVkID8gRGlmZlR5cGUucmVtb3ZlZCA6IERpZmZUeXBlLmFkZGVkLFxuICAgICAgICAgIHZhbHVlOiBCW2JdLFxuICAgICAgICB9KTtcbiAgICAgICAgYiAtPSAxO1xuICAgICAgfSBlbHNlIGlmICh0eXBlID09PSBBRERFRCkge1xuICAgICAgICByZXN1bHQudW5zaGlmdCh7XG4gICAgICAgICAgdHlwZTogc3dhcHBlZCA/IERpZmZUeXBlLmFkZGVkIDogRGlmZlR5cGUucmVtb3ZlZCxcbiAgICAgICAgICB2YWx1ZTogQVthXSxcbiAgICAgICAgfSk7XG4gICAgICAgIGEgLT0gMTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHJlc3VsdC51bnNoaWZ0KHsgdHlwZTogRGlmZlR5cGUuY29tbW9uLCB2YWx1ZTogQVthXSB9KTtcbiAgICAgICAgYSAtPSAxO1xuICAgICAgICBiIC09IDE7XG4gICAgICB9XG4gICAgICBqID0gcm91dGVzW3ByZXZdO1xuICAgICAgdHlwZSA9IHJvdXRlc1twcmV2ICsgZGlmZlR5cGVzUHRyT2Zmc2V0XTtcbiAgICB9XG4gICAgcmV0dXJuIHJlc3VsdDtcbiAgfVxuXG4gIGZ1bmN0aW9uIGNyZWF0ZUZQKFxuICAgIHNsaWRlOiBGYXJ0aGVzdFBvaW50LFxuICAgIGRvd246IEZhcnRoZXN0UG9pbnQsXG4gICAgazogbnVtYmVyLFxuICAgIE06IG51bWJlcixcbiAgKTogRmFydGhlc3RQb2ludCB7XG4gICAgaWYgKHNsaWRlICYmIHNsaWRlLnkgPT09IC0xICYmIGRvd24gJiYgZG93bi55ID09PSAtMSkge1xuICAgICAgcmV0dXJuIHsgeTogMCwgaWQ6IDAgfTtcbiAgICB9XG4gICAgaWYgKFxuICAgICAgKGRvd24gJiYgZG93bi55ID09PSAtMSkgfHxcbiAgICAgIGsgPT09IE0gfHxcbiAgICAgIChzbGlkZSAmJiBzbGlkZS55KSA+IChkb3duICYmIGRvd24ueSkgKyAxXG4gICAgKSB7XG4gICAgICBjb25zdCBwcmV2ID0gc2xpZGUuaWQ7XG4gICAgICBwdHIrKztcbiAgICAgIHJvdXRlc1twdHJdID0gcHJldjtcbiAgICAgIHJvdXRlc1twdHIgKyBkaWZmVHlwZXNQdHJPZmZzZXRdID0gQURERUQ7XG4gICAgICByZXR1cm4geyB5OiBzbGlkZS55LCBpZDogcHRyIH07XG4gICAgfSBlbHNlIHtcbiAgICAgIGNvbnN0IHByZXYgPSBkb3duLmlkO1xuICAgICAgcHRyKys7XG4gICAgICByb3V0ZXNbcHRyXSA9IHByZXY7XG4gICAgICByb3V0ZXNbcHRyICsgZGlmZlR5cGVzUHRyT2Zmc2V0XSA9IFJFTU9WRUQ7XG4gICAgICByZXR1cm4geyB5OiBkb3duLnkgKyAxLCBpZDogcHRyIH07XG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gc25ha2U8VD4oXG4gICAgazogbnVtYmVyLFxuICAgIHNsaWRlOiBGYXJ0aGVzdFBvaW50LFxuICAgIGRvd246IEZhcnRoZXN0UG9pbnQsXG4gICAgX29mZnNldDogbnVtYmVyLFxuICAgIEE6IFRbXSxcbiAgICBCOiBUW10sXG4gICk6IEZhcnRoZXN0UG9pbnQge1xuICAgIGNvbnN0IE0gPSBBLmxlbmd0aDtcbiAgICBjb25zdCBOID0gQi5sZW5ndGg7XG4gICAgaWYgKGsgPCAtTiB8fCBNIDwgaykgcmV0dXJuIHsgeTogLTEsIGlkOiAtMSB9O1xuICAgIGNvbnN0IGZwID0gY3JlYXRlRlAoc2xpZGUsIGRvd24sIGssIE0pO1xuICAgIHdoaWxlIChmcC55ICsgayA8IE0gJiYgZnAueSA8IE4gJiYgQVtmcC55ICsga10gPT09IEJbZnAueV0pIHtcbiAgICAgIGNvbnN0IHByZXYgPSBmcC5pZDtcbiAgICAgIHB0cisrO1xuICAgICAgZnAuaWQgPSBwdHI7XG4gICAgICBmcC55ICs9IDE7XG4gICAgICByb3V0ZXNbcHRyXSA9IHByZXY7XG4gICAgICByb3V0ZXNbcHRyICsgZGlmZlR5cGVzUHRyT2Zmc2V0XSA9IENPTU1PTjtcbiAgICB9XG4gICAgcmV0dXJuIGZwO1xuICB9XG5cbiAgd2hpbGUgKGZwW2RlbHRhICsgb2Zmc2V0XS55IDwgTikge1xuICAgIHAgPSBwICsgMTtcbiAgICBmb3IgKGxldCBrID0gLXA7IGsgPCBkZWx0YTsgKytrKSB7XG4gICAgICBmcFtrICsgb2Zmc2V0XSA9IHNuYWtlKFxuICAgICAgICBrLFxuICAgICAgICBmcFtrIC0gMSArIG9mZnNldF0sXG4gICAgICAgIGZwW2sgKyAxICsgb2Zmc2V0XSxcbiAgICAgICAgb2Zmc2V0LFxuICAgICAgICBBLFxuICAgICAgICBCLFxuICAgICAgKTtcbiAgICB9XG4gICAgZm9yIChsZXQgayA9IGRlbHRhICsgcDsgayA+IGRlbHRhOyAtLWspIHtcbiAgICAgIGZwW2sgKyBvZmZzZXRdID0gc25ha2UoXG4gICAgICAgIGssXG4gICAgICAgIGZwW2sgLSAxICsgb2Zmc2V0XSxcbiAgICAgICAgZnBbayArIDEgKyBvZmZzZXRdLFxuICAgICAgICBvZmZzZXQsXG4gICAgICAgIEEsXG4gICAgICAgIEIsXG4gICAgICApO1xuICAgIH1cbiAgICBmcFtkZWx0YSArIG9mZnNldF0gPSBzbmFrZShcbiAgICAgIGRlbHRhLFxuICAgICAgZnBbZGVsdGEgLSAxICsgb2Zmc2V0XSxcbiAgICAgIGZwW2RlbHRhICsgMSArIG9mZnNldF0sXG4gICAgICBvZmZzZXQsXG4gICAgICBBLFxuICAgICAgQixcbiAgICApO1xuICB9XG4gIHJldHVybiBbXG4gICAgLi4ucHJlZml4Q29tbW9uLm1hcChcbiAgICAgIChjKTogRGlmZlJlc3VsdDx0eXBlb2YgYz4gPT4gKHsgdHlwZTogRGlmZlR5cGUuY29tbW9uLCB2YWx1ZTogYyB9KSxcbiAgICApLFxuICAgIC4uLmJhY2tUcmFjZShBLCBCLCBmcFtkZWx0YSArIG9mZnNldF0sIHN3YXBwZWQpLFxuICAgIC4uLnN1ZmZpeENvbW1vbi5tYXAoXG4gICAgICAoYyk6IERpZmZSZXN1bHQ8dHlwZW9mIGM+ID0+ICh7IHR5cGU6IERpZmZUeXBlLmNvbW1vbiwgdmFsdWU6IGMgfSksXG4gICAgKSxcbiAgXTtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFRTyxNQUFNO1VBQUQsUUFBUTtJQUFSLFFBQVEsQ0FDbEIsQ0FBTyxZQUFQLENBQU87SUFERyxRQUFRLENBRWxCLENBQU0sV0FBTixDQUFNO0lBRkksUUFBUSxDQUdsQixDQUFLLFVBQUwsQ0FBSztHQUhLLFFBQVEsS0FBUixRQUFROztBQVdwQixLQUFLLENBQUMsT0FBTyxHQUFHLENBQUM7QUFDakIsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDO0FBQ2hCLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQztTQUVOLFlBQVksQ0FBSSxDQUFNLEVBQUUsQ0FBTSxFQUFFLE9BQWlCLEVBQU8s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