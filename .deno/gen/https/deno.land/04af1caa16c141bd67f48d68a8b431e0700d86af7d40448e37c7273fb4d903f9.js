import { KeyMap, KeyMapCtrl, KeyMapShift, SpecialKeyMap } from "./key_codes.ts";
// https://en.wikipedia.org/wiki/ANSI_escape_code
// https://github.com/nodejs/node/blob/v13.13.0/lib/internal/readline/utils.js
const kUTF16SurrogateThreshold = 65536; // 2 ** 16
const kEscape = "\x1b";
/**
 * Parse ansi escape sequence.
 * @param data Ansi escape sequence.
 * ```
 * parse("\x04\x18");
 * ```
 * ```
 * [
 *   KeyCode { name: "d", sequence: "\x04", ctrl: true, meta: false, shift: false },
 *   KeyCode { name: "x", sequence: "\x18", ctrl: true, meta: false, shift: false },
 * ]
 * ```
 */ export function parse(data) {
    /*
   * Some patterns seen in terminal key escape codes, derived from combos seen
   * at http://www.midnight-commander.org/browser/lib/tty/key.c
   *
   * ESC letter
   * ESC [ letter
   * ESC [ modifier letter
   * ESC [ 1 ; modifier letter
   * ESC [ num char
   * ESC [ num ; modifier char
   * ESC O letter
   * ESC O modifier letter
   * ESC O 1 ; modifier letter
   * ESC N letter
   * ESC [ [ num ; modifier char
   * ESC [ [ 1 ; modifier letter
   * ESC ESC [ num char
   * ESC ESC O letter
   *
   * - char is usually ~ but $ and ^ also happen with rxvt
   * - modifier is 1 +
   *               (shift     * 1) +
   *               (left_alt  * 2) +
   *               (ctrl      * 4) +
   *               (right_alt * 8)
   * - two leading ESCs apparently mean the same as one leading ESC
   */ let index = -1;
    const keys = [];
    const input = data instanceof Uint8Array ? new TextDecoder().decode(data) : data;
    const hasNext = ()=>input.length - 1 >= index + 1
    ;
    const next = ()=>input[++index]
    ;
    parseNext();
    return keys;
    function parseNext() {
        let ch = next();
        let s = ch;
        let escaped = false;
        const key = {
            name: undefined,
            sequence: undefined,
            code: undefined,
            ctrl: false,
            meta: false,
            shift: false
        };
        if (ch === kEscape && hasNext()) {
            escaped = true;
            s += ch = next();
            if (ch === kEscape) {
                s += ch = next();
            }
        }
        if (escaped && (ch === "O" || ch === "[")) {
            // ANSI escape sequence
            let code = ch;
            let modifier = 0;
            if (ch === "O") {
                // ESC O letter
                // ESC O modifier letter
                s += ch = next();
                if (ch >= "0" && ch <= "9") {
                    modifier = (Number(ch) >> 0) - 1;
                    s += ch = next();
                }
                code += ch;
            } else if (ch === "[") {
                // ESC [ letter
                // ESC [ modifier letter
                // ESC [ [ modifier letter
                // ESC [ [ num char
                s += ch = next();
                if (ch === "[") {
                    // \x1b[[A
                    //      ^--- escape codes might have a second bracket
                    code += ch;
                    s += ch = next();
                }
                /*
         * Here and later we try to buffer just enough data to get
         * a complete ascii sequence.
         *
         * We have basically two classes of ascii characters to process:
         *
         *
         * 1. `\x1b[24;5~` should be parsed as { code: '[24~', modifier: 5 }
         *
         * This particular example is featuring Ctrl+F12 in xterm.
         *
         *  - `;5` part is optional, e.g. it could be `\x1b[24~`
         *  - first part can contain one or two digits
         *
         * So the generic regexp is like /^\d\d?(;\d)?[~^$]$/
         *
         *
         * 2. `\x1b[1;5H` should be parsed as { code: '[H', modifier: 5 }
         *
         * This particular example is featuring Ctrl+Home in xterm.
         *
         *  - `1;5` part is optional, e.g. it could be `\x1b[H`
         *  - `1;` part is optional, e.g. it could be `\x1b[5H`
         *
         * So the generic regexp is like /^((\d;)?\d)?[A-Za-z]$/
         *
         */ const cmdStart = s.length - 1;
                // Skip one or two leading digits
                if (ch >= "0" && ch <= "9") {
                    s += ch = next();
                    if (ch >= "0" && ch <= "9") {
                        s += ch = next();
                    }
                }
                // skip modifier
                if (ch === ";") {
                    s += ch = next();
                    if (ch >= "0" && ch <= "9") {
                        s += next();
                    }
                }
                /*
         * We buffered enough data, now trying to extract code
         * and modifier from it
         */ const cmd = s.slice(cmdStart);
                let match;
                if (match = cmd.match(/^(\d\d?)(;(\d))?([~^$])$/)) {
                    code += match[1] + match[4];
                    modifier = (Number(match[3]) || 1) - 1;
                } else if (match = cmd.match(/^((\d;)?(\d))?([A-Za-z])$/)) {
                    code += match[4];
                    modifier = (Number(match[3]) || 1) - 1;
                } else {
                    code += cmd;
                }
            }
            // Parse the key modifier
            key.ctrl = !!(modifier & 4);
            key.meta = !!(modifier & 10);
            key.shift = !!(modifier & 1);
            key.code = code;
            // Parse the key itself
            if (code in KeyMap) {
                key.name = KeyMap[code];
            } else if (code in KeyMapShift) {
                key.name = KeyMapShift[code];
                key.shift = true;
            } else if (code in KeyMapCtrl) {
                key.name = KeyMapCtrl[code];
                key.ctrl = true;
            } else {
                key.name = "undefined";
            }
        } else if (ch in SpecialKeyMap) {
            key.name = SpecialKeyMap[ch];
            key.meta = escaped;
        } else if (!escaped && ch <= "\x1a") {
            // ctrl+letter
            key.name = String.fromCharCode(ch.charCodeAt(0) + "a".charCodeAt(0) - 1);
            key.ctrl = true;
        } else if (/^[0-9A-Za-z]$/.test(ch)) {
            // Letter, number, shift+letter
            key.name = ch.toLowerCase();
            key.shift = /^[A-Z]$/.test(ch);
            key.meta = escaped;
        } else if (escaped) {
            // Escape sequence timeout
            key.name = ch.length ? undefined : "escape";
            key.meta = true;
        }
        key.sequence = s;
        if (s.length !== 0 && (key.name !== undefined || escaped)) {
            /* Named character or sequence */ // key.sequence = escaped ? undefined : s;
            keys.push(key);
        } else if (charLengthAt(s, 0) === s.length) {
            /* Single unnamed character, e.g. "." */ // key.sequence = s;
            keys.push(key);
        } else {
            throw new Error("Unrecognized or broken escape sequence");
        }
        if (hasNext()) {
            parseNext();
        }
    }
}
function charLengthAt(str, i) {
    const pos = str.codePointAt(i);
    if (typeof pos === "undefined") {
        // Pretend to move to the right. This is necessary to autocomplete while
        // moving to the right.
        return 1;
    }
    return pos >= kUTF16SurrogateThreshold ? 2 : 1;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3gvY2xpZmZ5QHYwLjIwLjEva2V5Y29kZS9rZXlfY29kZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBLZXlNYXAsIEtleU1hcEN0cmwsIEtleU1hcFNoaWZ0LCBTcGVjaWFsS2V5TWFwIH0gZnJvbSBcIi4va2V5X2NvZGVzLnRzXCI7XG5cbi8vIGh0dHBzOi8vZW4ud2lraXBlZGlhLm9yZy93aWtpL0FOU0lfZXNjYXBlX2NvZGVcbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ub2RlanMvbm9kZS9ibG9iL3YxMy4xMy4wL2xpYi9pbnRlcm5hbC9yZWFkbGluZS91dGlscy5qc1xuXG5jb25zdCBrVVRGMTZTdXJyb2dhdGVUaHJlc2hvbGQgPSAweDEwMDAwOyAvLyAyICoqIDE2XG5jb25zdCBrRXNjYXBlID0gXCJcXHgxYlwiO1xuXG5leHBvcnQgaW50ZXJmYWNlIEtleUNvZGUge1xuICBuYW1lPzogc3RyaW5nO1xuICBzZXF1ZW5jZT86IHN0cmluZztcbiAgY29kZT86IHN0cmluZztcbiAgY3RybD86IGJvb2xlYW47XG4gIG1ldGE/OiBib29sZWFuO1xuICBzaGlmdD86IGJvb2xlYW47XG59XG5cbi8qKlxuICogUGFyc2UgYW5zaSBlc2NhcGUgc2VxdWVuY2UuXG4gKiBAcGFyYW0gZGF0YSBBbnNpIGVzY2FwZSBzZXF1ZW5jZS5cbiAqIGBgYFxuICogcGFyc2UoXCJcXHgwNFxceDE4XCIpO1xuICogYGBgXG4gKiBgYGBcbiAqIFtcbiAqICAgS2V5Q29kZSB7IG5hbWU6IFwiZFwiLCBzZXF1ZW5jZTogXCJcXHgwNFwiLCBjdHJsOiB0cnVlLCBtZXRhOiBmYWxzZSwgc2hpZnQ6IGZhbHNlIH0sXG4gKiAgIEtleUNvZGUgeyBuYW1lOiBcInhcIiwgc2VxdWVuY2U6IFwiXFx4MThcIiwgY3RybDogdHJ1ZSwgbWV0YTogZmFsc2UsIHNoaWZ0OiBmYWxzZSB9LFxuICogXVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiBwYXJzZShkYXRhOiBVaW50OEFycmF5IHwgc3RyaW5nKTogS2V5Q29kZVtdIHtcbiAgLypcbiAgICogU29tZSBwYXR0ZXJucyBzZWVuIGluIHRlcm1pbmFsIGtleSBlc2NhcGUgY29kZXMsIGRlcml2ZWQgZnJvbSBjb21ib3Mgc2VlblxuICAgKiBhdCBodHRwOi8vd3d3Lm1pZG5pZ2h0LWNvbW1hbmRlci5vcmcvYnJvd3Nlci9saWIvdHR5L2tleS5jXG4gICAqXG4gICAqIEVTQyBsZXR0ZXJcbiAgICogRVNDIFsgbGV0dGVyXG4gICAqIEVTQyBbIG1vZGlmaWVyIGxldHRlclxuICAgKiBFU0MgWyAxIDsgbW9kaWZpZXIgbGV0dGVyXG4gICAqIEVTQyBbIG51bSBjaGFyXG4gICAqIEVTQyBbIG51bSA7IG1vZGlmaWVyIGNoYXJcbiAgICogRVNDIE8gbGV0dGVyXG4gICAqIEVTQyBPIG1vZGlmaWVyIGxldHRlclxuICAgKiBFU0MgTyAxIDsgbW9kaWZpZXIgbGV0dGVyXG4gICAqIEVTQyBOIGxldHRlclxuICAgKiBFU0MgWyBbIG51bSA7IG1vZGlmaWVyIGNoYXJcbiAgICogRVNDIFsgWyAxIDsgbW9kaWZpZXIgbGV0dGVyXG4gICAqIEVTQyBFU0MgWyBudW0gY2hhclxuICAgKiBFU0MgRVNDIE8gbGV0dGVyXG4gICAqXG4gICAqIC0gY2hhciBpcyB1c3VhbGx5IH4gYnV0ICQgYW5kIF4gYWxzbyBoYXBwZW4gd2l0aCByeHZ0XG4gICAqIC0gbW9kaWZpZXIgaXMgMSArXG4gICAqICAgICAgICAgICAgICAgKHNoaWZ0ICAgICAqIDEpICtcbiAgICogICAgICAgICAgICAgICAobGVmdF9hbHQgICogMikgK1xuICAgKiAgICAgICAgICAgICAgIChjdHJsICAgICAgKiA0KSArXG4gICAqICAgICAgICAgICAgICAgKHJpZ2h0X2FsdCAqIDgpXG4gICAqIC0gdHdvIGxlYWRpbmcgRVNDcyBhcHBhcmVudGx5IG1lYW4gdGhlIHNhbWUgYXMgb25lIGxlYWRpbmcgRVNDXG4gICAqL1xuICBsZXQgaW5kZXggPSAtMTtcbiAgY29uc3Qga2V5czogS2V5Q29kZVtdID0gW107XG4gIGNvbnN0IGlucHV0OiBzdHJpbmcgPSBkYXRhIGluc3RhbmNlb2YgVWludDhBcnJheVxuICAgID8gbmV3IFRleHREZWNvZGVyKCkuZGVjb2RlKGRhdGEpXG4gICAgOiBkYXRhO1xuXG4gIGNvbnN0IGhhc05leHQgPSAoKSA9PiBpbnB1dC5sZW5ndGggLSAxID49IGluZGV4ICsgMTtcbiAgY29uc3QgbmV4dCA9ICgpID0+IGlucHV0WysraW5kZXhdO1xuXG4gIHBhcnNlTmV4dCgpO1xuXG4gIHJldHVybiBrZXlzO1xuXG4gIGZ1bmN0aW9uIHBhcnNlTmV4dCgpIHtcbiAgICBsZXQgY2g6IHN0cmluZyA9IG5leHQoKTtcbiAgICBsZXQgczogc3RyaW5nID0gY2g7XG4gICAgbGV0IGVzY2FwZWQgPSBmYWxzZTtcblxuICAgIGNvbnN0IGtleTogS2V5Q29kZSA9IHtcbiAgICAgIG5hbWU6IHVuZGVmaW5lZCxcbiAgICAgIHNlcXVlbmNlOiB1bmRlZmluZWQsXG4gICAgICBjb2RlOiB1bmRlZmluZWQsXG4gICAgICBjdHJsOiBmYWxzZSxcbiAgICAgIG1ldGE6IGZhbHNlLFxuICAgICAgc2hpZnQ6IGZhbHNlLFxuICAgIH07XG5cbiAgICBpZiAoY2ggPT09IGtFc2NhcGUgJiYgaGFzTmV4dCgpKSB7XG4gICAgICBlc2NhcGVkID0gdHJ1ZTtcbiAgICAgIHMgKz0gY2ggPSBuZXh0KCk7XG5cbiAgICAgIGlmIChjaCA9PT0ga0VzY2FwZSkge1xuICAgICAgICBzICs9IGNoID0gbmV4dCgpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChlc2NhcGVkICYmIChjaCA9PT0gXCJPXCIgfHwgY2ggPT09IFwiW1wiKSkge1xuICAgICAgLy8gQU5TSSBlc2NhcGUgc2VxdWVuY2VcbiAgICAgIGxldCBjb2RlOiBzdHJpbmcgPSBjaDtcbiAgICAgIGxldCBtb2RpZmllciA9IDA7XG5cbiAgICAgIGlmIChjaCA9PT0gXCJPXCIpIHtcbiAgICAgICAgLy8gRVNDIE8gbGV0dGVyXG4gICAgICAgIC8vIEVTQyBPIG1vZGlmaWVyIGxldHRlclxuICAgICAgICBzICs9IGNoID0gbmV4dCgpO1xuXG4gICAgICAgIGlmIChjaCA+PSBcIjBcIiAmJiBjaCA8PSBcIjlcIikge1xuICAgICAgICAgIG1vZGlmaWVyID0gKE51bWJlcihjaCkgPj4gMCkgLSAxO1xuICAgICAgICAgIHMgKz0gY2ggPSBuZXh0KCk7XG4gICAgICAgIH1cblxuICAgICAgICBjb2RlICs9IGNoO1xuICAgICAgfSBlbHNlIGlmIChjaCA9PT0gXCJbXCIpIHtcbiAgICAgICAgLy8gRVNDIFsgbGV0dGVyXG4gICAgICAgIC8vIEVTQyBbIG1vZGlmaWVyIGxldHRlclxuICAgICAgICAvLyBFU0MgWyBbIG1vZGlmaWVyIGxldHRlclxuICAgICAgICAvLyBFU0MgWyBbIG51bSBjaGFyXG4gICAgICAgIHMgKz0gY2ggPSBuZXh0KCk7XG5cbiAgICAgICAgaWYgKGNoID09PSBcIltcIikge1xuICAgICAgICAgIC8vIFxceDFiW1tBXG4gICAgICAgICAgLy8gICAgICBeLS0tIGVzY2FwZSBjb2RlcyBtaWdodCBoYXZlIGEgc2Vjb25kIGJyYWNrZXRcbiAgICAgICAgICBjb2RlICs9IGNoO1xuICAgICAgICAgIHMgKz0gY2ggPSBuZXh0KCk7XG4gICAgICAgIH1cblxuICAgICAgICAvKlxuICAgICAgICAgKiBIZXJlIGFuZCBsYXRlciB3ZSB0cnkgdG8gYnVmZmVyIGp1c3QgZW5vdWdoIGRhdGEgdG8gZ2V0XG4gICAgICAgICAqIGEgY29tcGxldGUgYXNjaWkgc2VxdWVuY2UuXG4gICAgICAgICAqXG4gICAgICAgICAqIFdlIGhhdmUgYmFzaWNhbGx5IHR3byBjbGFzc2VzIG9mIGFzY2lpIGNoYXJhY3RlcnMgdG8gcHJvY2VzczpcbiAgICAgICAgICpcbiAgICAgICAgICpcbiAgICAgICAgICogMS4gYFxceDFiWzI0OzV+YCBzaG91bGQgYmUgcGFyc2VkIGFzIHsgY29kZTogJ1syNH4nLCBtb2RpZmllcjogNSB9XG4gICAgICAgICAqXG4gICAgICAgICAqIFRoaXMgcGFydGljdWxhciBleGFtcGxlIGlzIGZlYXR1cmluZyBDdHJsK0YxMiBpbiB4dGVybS5cbiAgICAgICAgICpcbiAgICAgICAgICogIC0gYDs1YCBwYXJ0IGlzIG9wdGlvbmFsLCBlLmcuIGl0IGNvdWxkIGJlIGBcXHgxYlsyNH5gXG4gICAgICAgICAqICAtIGZpcnN0IHBhcnQgY2FuIGNvbnRhaW4gb25lIG9yIHR3byBkaWdpdHNcbiAgICAgICAgICpcbiAgICAgICAgICogU28gdGhlIGdlbmVyaWMgcmVnZXhwIGlzIGxpa2UgL15cXGRcXGQ/KDtcXGQpP1t+XiRdJC9cbiAgICAgICAgICpcbiAgICAgICAgICpcbiAgICAgICAgICogMi4gYFxceDFiWzE7NUhgIHNob3VsZCBiZSBwYXJzZWQgYXMgeyBjb2RlOiAnW0gnLCBtb2RpZmllcjogNSB9XG4gICAgICAgICAqXG4gICAgICAgICAqIFRoaXMgcGFydGljdWxhciBleGFtcGxlIGlzIGZlYXR1cmluZyBDdHJsK0hvbWUgaW4geHRlcm0uXG4gICAgICAgICAqXG4gICAgICAgICAqICAtIGAxOzVgIHBhcnQgaXMgb3B0aW9uYWwsIGUuZy4gaXQgY291bGQgYmUgYFxceDFiW0hgXG4gICAgICAgICAqICAtIGAxO2AgcGFydCBpcyBvcHRpb25hbCwgZS5nLiBpdCBjb3VsZCBiZSBgXFx4MWJbNUhgXG4gICAgICAgICAqXG4gICAgICAgICAqIFNvIHRoZSBnZW5lcmljIHJlZ2V4cCBpcyBsaWtlIC9eKChcXGQ7KT9cXGQpP1tBLVphLXpdJC9cbiAgICAgICAgICpcbiAgICAgICAgICovXG4gICAgICAgIGNvbnN0IGNtZFN0YXJ0OiBudW1iZXIgPSBzLmxlbmd0aCAtIDE7XG5cbiAgICAgICAgLy8gU2tpcCBvbmUgb3IgdHdvIGxlYWRpbmcgZGlnaXRzXG4gICAgICAgIGlmIChjaCA+PSBcIjBcIiAmJiBjaCA8PSBcIjlcIikge1xuICAgICAgICAgIHMgKz0gY2ggPSBuZXh0KCk7XG5cbiAgICAgICAgICBpZiAoY2ggPj0gXCIwXCIgJiYgY2ggPD0gXCI5XCIpIHtcbiAgICAgICAgICAgIHMgKz0gY2ggPSBuZXh0KCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLy8gc2tpcCBtb2RpZmllclxuICAgICAgICBpZiAoY2ggPT09IFwiO1wiKSB7XG4gICAgICAgICAgcyArPSBjaCA9IG5leHQoKTtcblxuICAgICAgICAgIGlmIChjaCA+PSBcIjBcIiAmJiBjaCA8PSBcIjlcIikge1xuICAgICAgICAgICAgcyArPSBuZXh0KCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgLypcbiAgICAgICAgICogV2UgYnVmZmVyZWQgZW5vdWdoIGRhdGEsIG5vdyB0cnlpbmcgdG8gZXh0cmFjdCBjb2RlXG4gICAgICAgICAqIGFuZCBtb2RpZmllciBmcm9tIGl0XG4gICAgICAgICAqL1xuICAgICAgICBjb25zdCBjbWQ6IHN0cmluZyA9IHMuc2xpY2UoY21kU3RhcnQpO1xuICAgICAgICBsZXQgbWF0Y2g6IFJlZ0V4cE1hdGNoQXJyYXkgfCBudWxsO1xuXG4gICAgICAgIGlmICgobWF0Y2ggPSBjbWQubWF0Y2goL14oXFxkXFxkPykoOyhcXGQpKT8oW35eJF0pJC8pKSkge1xuICAgICAgICAgIGNvZGUgKz0gbWF0Y2hbMV0gKyBtYXRjaFs0XTtcbiAgICAgICAgICBtb2RpZmllciA9IChOdW1iZXIobWF0Y2hbM10pIHx8IDEpIC0gMTtcbiAgICAgICAgfSBlbHNlIGlmICgobWF0Y2ggPSBjbWQubWF0Y2goL14oKFxcZDspPyhcXGQpKT8oW0EtWmEtel0pJC8pKSkge1xuICAgICAgICAgIGNvZGUgKz0gbWF0Y2hbNF07XG4gICAgICAgICAgbW9kaWZpZXIgPSAoTnVtYmVyKG1hdGNoWzNdKSB8fCAxKSAtIDE7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgY29kZSArPSBjbWQ7XG4gICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgLy8gUGFyc2UgdGhlIGtleSBtb2RpZmllclxuICAgICAga2V5LmN0cmwgPSAhIShtb2RpZmllciAmIDQpO1xuICAgICAga2V5Lm1ldGEgPSAhIShtb2RpZmllciAmIDEwKTtcbiAgICAgIGtleS5zaGlmdCA9ICEhKG1vZGlmaWVyICYgMSk7XG4gICAgICBrZXkuY29kZSA9IGNvZGU7XG5cbiAgICAgIC8vIFBhcnNlIHRoZSBrZXkgaXRzZWxmXG4gICAgICBpZiAoY29kZSBpbiBLZXlNYXApIHtcbiAgICAgICAga2V5Lm5hbWUgPSBLZXlNYXBbY29kZV07XG4gICAgICB9IGVsc2UgaWYgKGNvZGUgaW4gS2V5TWFwU2hpZnQpIHtcbiAgICAgICAga2V5Lm5hbWUgPSBLZXlNYXBTaGlmdFtjb2RlXTtcbiAgICAgICAga2V5LnNoaWZ0ID0gdHJ1ZTtcbiAgICAgIH0gZWxzZSBpZiAoY29kZSBpbiBLZXlNYXBDdHJsKSB7XG4gICAgICAgIGtleS5uYW1lID0gS2V5TWFwQ3RybFtjb2RlXTtcbiAgICAgICAga2V5LmN0cmwgPSB0cnVlO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAga2V5Lm5hbWUgPSBcInVuZGVmaW5lZFwiO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoY2ggaW4gU3BlY2lhbEtleU1hcCkge1xuICAgICAga2V5Lm5hbWUgPSBTcGVjaWFsS2V5TWFwW2NoXTtcbiAgICAgIGtleS5tZXRhID0gZXNjYXBlZDtcbiAgICB9IGVsc2UgaWYgKCFlc2NhcGVkICYmIGNoIDw9IFwiXFx4MWFcIikge1xuICAgICAgLy8gY3RybCtsZXR0ZXJcbiAgICAgIGtleS5uYW1lID0gU3RyaW5nLmZyb21DaGFyQ29kZShcbiAgICAgICAgY2guY2hhckNvZGVBdCgwKSArIFwiYVwiLmNoYXJDb2RlQXQoMCkgLSAxLFxuICAgICAgKTtcbiAgICAgIGtleS5jdHJsID0gdHJ1ZTtcbiAgICB9IGVsc2UgaWYgKC9eWzAtOUEtWmEtel0kLy50ZXN0KGNoKSkge1xuICAgICAgLy8gTGV0dGVyLCBudW1iZXIsIHNoaWZ0K2xldHRlclxuICAgICAga2V5Lm5hbWUgPSBjaC50b0xvd2VyQ2FzZSgpO1xuICAgICAga2V5LnNoaWZ0ID0gL15bQS1aXSQvLnRlc3QoY2gpO1xuICAgICAga2V5Lm1ldGEgPSBlc2NhcGVkO1xuICAgIH0gZWxzZSBpZiAoZXNjYXBlZCkge1xuICAgICAgLy8gRXNjYXBlIHNlcXVlbmNlIHRpbWVvdXRcbiAgICAgIGtleS5uYW1lID0gY2gubGVuZ3RoID8gdW5kZWZpbmVkIDogXCJlc2NhcGVcIjtcbiAgICAgIGtleS5tZXRhID0gdHJ1ZTtcbiAgICB9XG5cbiAgICBrZXkuc2VxdWVuY2UgPSBzO1xuXG4gICAgaWYgKHMubGVuZ3RoICE9PSAwICYmIChrZXkubmFtZSAhPT0gdW5kZWZpbmVkIHx8IGVzY2FwZWQpKSB7XG4gICAgICAvKiBOYW1lZCBjaGFyYWN0ZXIgb3Igc2VxdWVuY2UgKi9cbiAgICAgIC8vIGtleS5zZXF1ZW5jZSA9IGVzY2FwZWQgPyB1bmRlZmluZWQgOiBzO1xuICAgICAga2V5cy5wdXNoKGtleSk7XG4gICAgfSBlbHNlIGlmIChjaGFyTGVuZ3RoQXQocywgMCkgPT09IHMubGVuZ3RoKSB7XG4gICAgICAvKiBTaW5nbGUgdW5uYW1lZCBjaGFyYWN0ZXIsIGUuZy4gXCIuXCIgKi9cbiAgICAgIC8vIGtleS5zZXF1ZW5jZSA9IHM7XG4gICAgICBrZXlzLnB1c2goa2V5KTtcbiAgICB9IGVsc2Uge1xuICAgICAgdGhyb3cgbmV3IEVycm9yKFwiVW5yZWNvZ25pemVkIG9yIGJyb2tlbiBlc2NhcGUgc2VxdWVuY2VcIik7XG4gICAgfVxuXG4gICAgaWYgKGhhc05leHQoKSkge1xuICAgICAgcGFyc2VOZXh0KCk7XG4gICAgfVxuICB9XG59XG5cbmZ1bmN0aW9uIGNoYXJMZW5ndGhBdChzdHI6IHN0cmluZywgaTogbnVtYmVyKTogbnVtYmVyIHtcbiAgY29uc3QgcG9zOiBudW1iZXIgfCB1bmRlZmluZWQgPSBzdHIuY29kZVBvaW50QXQoaSk7XG4gIGlmICh0eXBlb2YgcG9zID09PSBcInVuZGVmaW5lZFwiKSB7XG4gICAgLy8gUHJldGVuZCB0byBtb3ZlIHRvIHRoZSByaWdodC4gVGhpcyBpcyBuZWNlc3NhcnkgdG8gYXV0b2NvbXBsZXRlIHdoaWxlXG4gICAgLy8gbW92aW5nIHRvIHRoZSByaWdodC5cbiAgICByZXR1cm4gMTtcbiAgfVxuICByZXR1cm4gcG9zID49IGtVVEYxNlN1cnJvZ2F0ZVRocmVzaG9sZCA/IDIgOiAxO1xufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE1BQU0sR0FBRyxNQUFNLEVBQUUsVUFBVSxFQUFFLFdBQVcsRUFBRSxhQUFhLFFBQVEsQ0FBZ0I7QUFFL0UsRUFBaUQsQUFBakQsK0NBQWlEO0FBQ2pELEVBQThFLEFBQTlFLDRFQUE4RTtBQUU5RSxLQUFLLENBQUMsd0JBQXdCLEdBQUcsS0FBTyxDQUFFLENBQVUsQUFBVixFQUFVLEFBQVYsUUFBVTtBQUNwRCxLQUFLLENBQUMsT0FBTyxHQUFHLENBQU07QUFXdEIsRUFZRyxBQVpIOzs7Ozs7Ozs7Ozs7Q0FZRyxBQVpILEVBWUcsQ0FDSCxNQUFNLFVBQVUsS0FBSyxDQUFDLElBQXlCLEVBQWEsQ0FBQztJQUMzRCxFQTBCRyxBQTFCSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7R0EwQkcsQUExQkgsRUEwQkcsQ0FDSCxHQUFHLENBQUMsS0FBSyxJQUFJLENBQUM7SUFDZCxLQUFLLENBQUMsSUFBSSxHQUFjLENBQUMsQ0FBQztJQUMxQixLQUFLLENBQUMsS0FBSyxHQUFXLElBQUksWUFBWSxVQUFVLEdBQzVDLEdBQUcsQ0FBQyxXQUFXLEdBQUcsTUFBTSxDQUFDLElBQUksSUFDN0IsSUFBSTtJQUVSLEtBQUssQ0FBQyxPQUFPLE9BQVMsS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLElBQUksS0FBSyxHQUFHLENBQUM7O0lBQ25ELEtBQUssQ0FBQyxJQUFJLE9BQVMsS0FBSyxHQUFHLEtBQUs7O0lBRWhDLFNBQVM7SUFFVCxNQUFNLENBQUMsSUFBSTthQUVGLFNBQVMsR0FBRyxDQUFDO1FBQ3BCLEdBQUcsQ0FBQyxFQUFFLEdBQVcs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