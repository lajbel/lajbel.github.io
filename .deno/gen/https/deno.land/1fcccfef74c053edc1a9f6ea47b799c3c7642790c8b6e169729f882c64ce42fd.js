// Ported from js-yaml v3.13.1:
// https://github.com/nodeca/js-yaml/commit/665aadda42349dcae869f12040d9b10ef18d12da
// Copyright 2011-2015 by Vitaly Puzrin. All rights reserved. MIT license.
// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { Type } from "../type.ts";
import { isNegativeZero } from "../utils.ts";
function isHexCode(c) {
    return 48 <= /* 0 */ c && c <= 57 || 65 <= /* A */ c && c <= 70 || 97 <= /* a */ c && c <= 102;
}
function isOctCode(c) {
    return 48 <= /* 0 */ c && c <= 55 /* 7 */ ;
}
function isDecCode(c) {
    return 48 <= /* 0 */ c && c <= 57 /* 9 */ ;
}
function resolveYamlInteger(data) {
    const max = data.length;
    let index = 0;
    let hasDigits = false;
    if (!max) return false;
    let ch = data[index];
    // sign
    if (ch === "-" || ch === "+") {
        ch = data[++index];
    }
    if (ch === "0") {
        // 0
        if (index + 1 === max) return true;
        ch = data[++index];
        // base 2, base 8, base 16
        if (ch === "b") {
            // base 2
            index++;
            for(; index < max; index++){
                ch = data[index];
                if (ch === "_") continue;
                if (ch !== "0" && ch !== "1") return false;
                hasDigits = true;
            }
            return hasDigits && ch !== "_";
        }
        if (ch === "x") {
            // base 16
            index++;
            for(; index < max; index++){
                ch = data[index];
                if (ch === "_") continue;
                if (!isHexCode(data.charCodeAt(index))) return false;
                hasDigits = true;
            }
            return hasDigits && ch !== "_";
        }
        // base 8
        for(; index < max; index++){
            ch = data[index];
            if (ch === "_") continue;
            if (!isOctCode(data.charCodeAt(index))) return false;
            hasDigits = true;
        }
        return hasDigits && ch !== "_";
    }
    // base 10 (except 0) or base 60
    // value should not start with `_`;
    if (ch === "_") return false;
    for(; index < max; index++){
        ch = data[index];
        if (ch === "_") continue;
        if (ch === ":") break;
        if (!isDecCode(data.charCodeAt(index))) {
            return false;
        }
        hasDigits = true;
    }
    // Should have digits and should not end with `_`
    if (!hasDigits || ch === "_") return false;
    // if !base60 - done;
    if (ch !== ":") return true;
    // base60 almost not used, no needs to optimize
    return /^(:[0-5]?[0-9])+$/.test(data.slice(index));
}
function constructYamlInteger(data) {
    let value = data;
    const digits = [];
    if (value.indexOf("_") !== -1) {
        value = value.replace(/_/g, "");
    }
    let sign = 1;
    let ch = value[0];
    if (ch === "-" || ch === "+") {
        if (ch === "-") sign = -1;
        value = value.slice(1);
        ch = value[0];
    }
    if (value === "0") return 0;
    if (ch === "0") {
        if (value[1] === "b") return sign * parseInt(value.slice(2), 2);
        if (value[1] === "x") return sign * parseInt(value, 16);
        return sign * parseInt(value, 8);
    }
    if (value.indexOf(":") !== -1) {
        value.split(":").forEach((v)=>{
            digits.unshift(parseInt(v, 10));
        });
        let valueInt = 0;
        let base = 1;
        digits.forEach((d)=>{
            valueInt += d * base;
            base *= 60;
        });
        return sign * valueInt;
    }
    return sign * parseInt(value, 10);
}
function isInteger(object) {
    return Object.prototype.toString.call(object) === "[object Number]" && object % 1 === 0 && !isNegativeZero(object);
}
export const int = new Type("tag:yaml.org,2002:int", {
    construct: constructYamlInteger,
    defaultStyle: "decimal",
    kind: "scalar",
    predicate: isInteger,
    represent: {
        binary (obj) {
            return obj >= 0 ? `0b${obj.toString(2)}` : `-0b${obj.toString(2).slice(1)}`;
        },
        octal (obj) {
            return obj >= 0 ? `0${obj.toString(8)}` : `-0${obj.toString(8).slice(1)}`;
        },
        decimal (obj) {
            return obj.toString(10);
        },
        hexadecimal (obj) {
            return obj >= 0 ? `0x${obj.toString(16).toUpperCase()}` : `-0x${obj.toString(16).toUpperCase().slice(1)}`;
        }
    },
    resolve: resolveYamlInteger,
    styleAliases: {
        binary: [
            2,
            "bin"
        ],
        decimal: [
            10,
            "dec"
        ],
        hexadecimal: [
            16,
            "hex"
        ],
        octal: [
            8,
            "oct"
        ]
    }
});
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjk3LjAvZW5jb2RpbmcvX3lhbWwvdHlwZS9pbnQudHMiXSwic291cmNlc0NvbnRlbnQiOlsiLy8gUG9ydGVkIGZyb20ganMteWFtbCB2My4xMy4xOlxuLy8gaHR0cHM6Ly9naXRodWIuY29tL25vZGVjYS9qcy15YW1sL2NvbW1pdC82NjVhYWRkYTQyMzQ5ZGNhZTg2OWYxMjA0MGQ5YjEwZWYxOGQxMmRhXG4vLyBDb3B5cmlnaHQgMjAxMS0yMDE1IGJ5IFZpdGFseSBQdXpyaW4uIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuLy8gQ29weXJpZ2h0IDIwMTgtMjAyMSB0aGUgRGVubyBhdXRob3JzLiBBbGwgcmlnaHRzIHJlc2VydmVkLiBNSVQgbGljZW5zZS5cblxuaW1wb3J0IHsgVHlwZSB9IGZyb20gXCIuLi90eXBlLnRzXCI7XG5pbXBvcnQgeyBBbnksIGlzTmVnYXRpdmVaZXJvIH0gZnJvbSBcIi4uL3V0aWxzLnRzXCI7XG5cbmZ1bmN0aW9uIGlzSGV4Q29kZShjOiBudW1iZXIpOiBib29sZWFuIHtcbiAgcmV0dXJuIChcbiAgICAoMHgzMCA8PSAvKiAwICovIGMgJiYgYyA8PSAweDM5KSAvKiA5ICovIHx8XG4gICAgKDB4NDEgPD0gLyogQSAqLyBjICYmIGMgPD0gMHg0NikgLyogRiAqLyB8fFxuICAgICgweDYxIDw9IC8qIGEgKi8gYyAmJiBjIDw9IDB4NjYpIC8qIGYgKi9cbiAgKTtcbn1cblxuZnVuY3Rpb24gaXNPY3RDb2RlKGM6IG51bWJlcik6IGJvb2xlYW4ge1xuICByZXR1cm4gMHgzMCA8PSAvKiAwICovIGMgJiYgYyA8PSAweDM3IC8qIDcgKi87XG59XG5cbmZ1bmN0aW9uIGlzRGVjQ29kZShjOiBudW1iZXIpOiBib29sZWFuIHtcbiAgcmV0dXJuIDB4MzAgPD0gLyogMCAqLyBjICYmIGMgPD0gMHgzOSAvKiA5ICovO1xufVxuXG5mdW5jdGlvbiByZXNvbHZlWWFtbEludGVnZXIoZGF0YTogc3RyaW5nKTogYm9vbGVhbiB7XG4gIGNvbnN0IG1heCA9IGRhdGEubGVuZ3RoO1xuICBsZXQgaW5kZXggPSAwO1xuICBsZXQgaGFzRGlnaXRzID0gZmFsc2U7XG5cbiAgaWYgKCFtYXgpIHJldHVybiBmYWxzZTtcblxuICBsZXQgY2ggPSBkYXRhW2luZGV4XTtcblxuICAvLyBzaWduXG4gIGlmIChjaCA9PT0gXCItXCIgfHwgY2ggPT09IFwiK1wiKSB7XG4gICAgY2ggPSBkYXRhWysraW5kZXhdO1xuICB9XG5cbiAgaWYgKGNoID09PSBcIjBcIikge1xuICAgIC8vIDBcbiAgICBpZiAoaW5kZXggKyAxID09PSBtYXgpIHJldHVybiB0cnVlO1xuICAgIGNoID0gZGF0YVsrK2luZGV4XTtcblxuICAgIC8vIGJhc2UgMiwgYmFzZSA4LCBiYXNlIDE2XG5cbiAgICBpZiAoY2ggPT09IFwiYlwiKSB7XG4gICAgICAvLyBiYXNlIDJcbiAgICAgIGluZGV4Kys7XG5cbiAgICAgIGZvciAoOyBpbmRleCA8IG1heDsgaW5kZXgrKykge1xuICAgICAgICBjaCA9IGRhdGFbaW5kZXhdO1xuICAgICAgICBpZiAoY2ggPT09IFwiX1wiKSBjb250aW51ZTtcbiAgICAgICAgaWYgKGNoICE9PSBcIjBcIiAmJiBjaCAhPT0gXCIxXCIpIHJldHVybiBmYWxzZTtcbiAgICAgICAgaGFzRGlnaXRzID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBoYXNEaWdpdHMgJiYgY2ggIT09IFwiX1wiO1xuICAgIH1cblxuICAgIGlmIChjaCA9PT0gXCJ4XCIpIHtcbiAgICAgIC8vIGJhc2UgMTZcbiAgICAgIGluZGV4Kys7XG5cbiAgICAgIGZvciAoOyBpbmRleCA8IG1heDsgaW5kZXgrKykge1xuICAgICAgICBjaCA9IGRhdGFbaW5kZXhdO1xuICAgICAgICBpZiAoY2ggPT09IFwiX1wiKSBjb250aW51ZTtcbiAgICAgICAgaWYgKCFpc0hleENvZGUoZGF0YS5jaGFyQ29kZUF0KGluZGV4KSkpIHJldHVybiBmYWxzZTtcbiAgICAgICAgaGFzRGlnaXRzID0gdHJ1ZTtcbiAgICAgIH1cbiAgICAgIHJldHVybiBoYXNEaWdpdHMgJiYgY2ggIT09IFwiX1wiO1xuICAgIH1cblxuICAgIC8vIGJhc2UgOFxuICAgIGZvciAoOyBpbmRleCA8IG1heDsgaW5kZXgrKykge1xuICAgICAgY2ggPSBkYXRhW2luZGV4XTtcbiAgICAgIGlmIChjaCA9PT0gXCJfXCIpIGNvbnRpbnVlO1xuICAgICAgaWYgKCFpc09jdENvZGUoZGF0YS5jaGFyQ29kZUF0KGluZGV4KSkpIHJldHVybiBmYWxzZTtcbiAgICAgIGhhc0RpZ2l0cyA9IHRydWU7XG4gICAgfVxuICAgIHJldHVybiBoYXNEaWdpdHMgJiYgY2ggIT09IFwiX1wiO1xuICB9XG5cbiAgLy8gYmFzZSAxMCAoZXhjZXB0IDApIG9yIGJhc2UgNjBcblxuICAvLyB2YWx1ZSBzaG91bGQgbm90IHN0YXJ0IHdpdGggYF9gO1xuICBpZiAoY2ggPT09IFwiX1wiKSByZXR1cm4gZmFsc2U7XG5cbiAgZm9yICg7IGluZGV4IDwgbWF4OyBpbmRleCsrKSB7XG4gICAgY2ggPSBkYXRhW2luZGV4XTtcbiAgICBpZiAoY2ggPT09IFwiX1wiKSBjb250aW51ZTtcbiAgICBpZiAoY2ggPT09IFwiOlwiKSBicmVhaztcbiAgICBpZiAoIWlzRGVjQ29kZShkYXRhLmNoYXJDb2RlQXQoaW5kZXgpKSkge1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICBoYXNEaWdpdHMgPSB0cnVlO1xuICB9XG5cbiAgLy8gU2hvdWxkIGhhdmUgZGlnaXRzIGFuZCBzaG91bGQgbm90IGVuZCB3aXRoIGBfYFxuICBpZiAoIWhhc0RpZ2l0cyB8fCBjaCA9PT0gXCJfXCIpIHJldHVybiBmYWxzZTtcblxuICAvLyBpZiAhYmFzZTYwIC0gZG9uZTtcbiAgaWYgKGNoICE9PSBcIjpcIikgcmV0dXJuIHRydWU7XG5cbiAgLy8gYmFzZTYwIGFsbW9zdCBub3QgdXNlZCwgbm8gbmVlZHMgdG8gb3B0aW1pemVcbiAgcmV0dXJuIC9eKDpbMC01XT9bMC05XSkrJC8udGVzdChkYXRhLnNsaWNlKGluZGV4KSk7XG59XG5cbmZ1bmN0aW9uIGNvbnN0cnVjdFlhbWxJbnRlZ2VyKGRhdGE6IHN0cmluZyk6IG51bWJlciB7XG4gIGxldCB2YWx1ZSA9IGRhdGE7XG4gIGNvbnN0IGRpZ2l0czogbnVtYmVyW10gPSBbXTtcblxuICBpZiAodmFsdWUuaW5kZXhPZihcIl9cIikgIT09IC0xKSB7XG4gICAgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlKC9fL2csIFwiXCIpO1xuICB9XG5cbiAgbGV0IHNpZ24gPSAxO1xuICBsZXQgY2ggPSB2YWx1ZVswXTtcbiAgaWYgKGNoID09PSBcIi1cIiB8fCBjaCA9PT0gXCIrXCIpIHtcbiAgICBpZiAoY2ggPT09IFwiLVwiKSBzaWduID0gLTE7XG4gICAgdmFsdWUgPSB2YWx1ZS5zbGljZSgxKTtcbiAgICBjaCA9IHZhbHVlWzBdO1xuICB9XG5cbiAgaWYgKHZhbHVlID09PSBcIjBcIikgcmV0dXJuIDA7XG5cbiAgaWYgKGNoID09PSBcIjBcIikge1xuICAgIGlmICh2YWx1ZVsxXSA9PT0gXCJiXCIpIHJldHVybiBzaWduICogcGFyc2VJbnQodmFsdWUuc2xpY2UoMiksIDIpO1xuICAgIGlmICh2YWx1ZVsxXSA9PT0gXCJ4XCIpIHJldHVybiBzaWduICogcGFyc2VJbnQodmFsdWUsIDE2KTtcbiAgICByZXR1cm4gc2lnbiAqIHBhcnNlSW50KHZhbHVlLCA4KTtcbiAgfVxuXG4gIGlmICh2YWx1ZS5pbmRleE9mKFwiOlwiKSAhPT0gLTEpIHtcbiAgICB2YWx1ZS5zcGxpdChcIjpcIikuZm9yRWFjaCgodik6IHZvaWQgPT4ge1xuICAgICAgZGlnaXRzLnVuc2hpZnQocGFyc2VJbnQodiwgMTApKTtcbiAgICB9KTtcblxuICAgIGxldCB2YWx1ZUludCA9IDA7XG4gICAgbGV0IGJhc2UgPSAxO1xuXG4gICAgZGlnaXRzLmZvckVhY2goKGQpOiB2b2lkID0+IHtcbiAgICAgIHZhbHVlSW50ICs9IGQgKiBiYXNlO1xuICAgICAgYmFzZSAqPSA2MDtcbiAgICB9KTtcblxuICAgIHJldHVybiBzaWduICogdmFsdWVJbnQ7XG4gIH1cblxuICByZXR1cm4gc2lnbiAqIHBhcnNlSW50KHZhbHVlLCAxMCk7XG59XG5cbmZ1bmN0aW9uIGlzSW50ZWdlcihvYmplY3Q6IEFueSk6IGJvb2xlYW4ge1xuICByZXR1cm4gKFxuICAgIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbChvYmplY3QpID09PSBcIltvYmplY3QgTnVtYmVyXVwiICYmXG4gICAgb2JqZWN0ICUgMSA9PT0gMCAmJlxuICAgICFpc05lZ2F0aXZlWmVybyhvYmplY3QpXG4gICk7XG59XG5cbmV4cG9ydCBjb25zdCBpbnQgPSBuZXcgVHlwZShcInRhZzp5YW1sLm9yZywyMDAyOmludFwiLCB7XG4gIGNvbnN0cnVjdDogY29uc3RydWN0WWFtbEludGVnZXIsXG4gIGRlZmF1bHRTdHlsZTogXCJkZWNpbWFsXCIsXG4gIGtpbmQ6IFwic2NhbGFyXCIsXG4gIHByZWRpY2F0ZTogaXNJbnRlZ2VyLFxuICByZXByZXNlbnQ6IHtcbiAgICBiaW5hcnkob2JqOiBudW1iZXIpOiBzdHJpbmcge1xuICAgICAgcmV0dXJuIG9iaiA+PSAwXG4gICAgICAgID8gYDBiJHtvYmoudG9TdHJpbmcoMil9YFxuICAgICAgICA6IGAtMGIke29iai50b1N0cmluZygyKS5zbGljZSgxKX1gO1xuICAgIH0sXG4gICAgb2N0YWwob2JqOiBudW1iZXIpOiBzdHJpbmcge1xuICAgICAgcmV0dXJuIG9iaiA+PSAwID8gYDAke29iai50b1N0cmluZyg4KX1gIDogYC0wJHtvYmoudG9TdHJpbmcoOCkuc2xpY2UoMSl9YDtcbiAgICB9LFxuICAgIGRlY2ltYWwob2JqOiBudW1iZXIpOiBzdHJpbmcge1xuICAgICAgcmV0dXJuIG9iai50b1N0cmluZygxMCk7XG4gICAgfSxcbiAgICBoZXhhZGVjaW1hbChvYmo6IG51bWJlcik6IHN0cmluZyB7XG4gICAgICByZXR1cm4gb2JqID49IDBcbiAgICAgICAgPyBgMHgke29iai50b1N0cmluZygxNikudG9VcHBlckNhc2UoKX1gXG4gICAgICAgIDogYC0weCR7b2JqLnRvU3RyaW5nKDE2KS50b1VwcGVyQ2FzZSgpLnNsaWNlKDEpfWA7XG4gICAgfSxcbiAgfSxcbiAgcmVzb2x2ZTogcmVzb2x2ZVlhbWxJbnRlZ2VyLFxuICBzdHlsZUFsaWFzZXM6IHtcbiAgICBiaW5hcnk6IFsyLCBcImJpblwiXSxcbiAgICBkZWNpbWFsOiBbMTAsIFwiZGVjXCJdLFxuICAgIGhleGFkZWNpbWFsOiBbMTYsIFwiaGV4XCJdLFxuICAgIG9jdGFsOiBbOCwgXCJvY3RcIl0sXG4gIH0sXG59KTtcbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUErQixBQUEvQiw2QkFBK0I7QUFDL0IsRUFBb0YsQUFBcEYsa0ZBQW9GO0FBQ3BGLEVBQTBFLEFBQTFFLHdFQUEwRTtBQUMxRSxFQUEwRSxBQUExRSx3RUFBMEU7QUFFMUUsTUFBTSxHQUFHLElBQUksUUFBUSxDQUFZO0FBQ2pDLE1BQU0sR0FBUSxjQUFjLFFBQVEsQ0FBYTtTQUV4QyxTQUFTLENBQUMsQ0FBUyxFQUFXLENBQUM7SUFDdEMsTUFBTSxDQUNILEVBQUksSUFBSSxFQUFPLEFBQVAsR0FBTyxBQUFQLEVBQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUksSUFDOUIsRUFBSSxJQUFJLEVBQU8sQUFBUCxHQUFPLEFBQVAsRUFBTyxDQUFDLENBQUMsSUFBSSxDQUFDLElBQUksRUFBSSxJQUM5QixFQUFJLElBQUksRUFBTyxBQUFQLEdBQU8sQUFBUCxFQUFPLENBQUMsQ0FBQyxJQUFJLENBQUMsSUFBSSxHQUFJO0FBRW5DLENBQUM7U0FFUSxTQUFTLENBQUMsQ0FBUyxFQUFXLENBQUM7SUFDdEMsTUFBTSxDQUFDLEVBQUksSUFBSSxFQUFPLEFBQVAsR0FBTyxBQUFQLEVBQU8sQ0FBQyxDQUFDLElBQUksQ0FBQyxJQUFJLEVBQUksQUFBQyxDQUFPLEFBQVAsRUFBTyxBQUFQLEdBQU8sQUFBUCxFQUFP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