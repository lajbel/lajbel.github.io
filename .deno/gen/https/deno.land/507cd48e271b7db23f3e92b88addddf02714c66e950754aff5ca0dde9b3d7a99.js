// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import * as hex from "../encoding/hex.ts";
import * as base64 from "../encoding/base64.ts";
import { normalizeEncoding, notImplemented } from "./_utils.ts";
const notImplementedEncodings = [
    "ascii",
    "binary",
    "latin1",
    "ucs2",
    "utf16le", 
];
function checkEncoding(encoding = "utf8", strict = true) {
    if (typeof encoding !== "string" || strict && encoding === "") {
        if (!strict) return "utf8";
        throw new TypeError(`Unknown encoding: ${encoding}`);
    }
    const normalized = normalizeEncoding(encoding);
    if (normalized === undefined) {
        throw new TypeError(`Unknown encoding: ${encoding}`);
    }
    if (notImplementedEncodings.includes(encoding)) {
        notImplemented(`"${encoding}" encoding`);
    }
    return normalized;
}
// https://github.com/nodejs/node/blob/56dbe466fdbc598baea3bfce289bf52b97b8b8f7/lib/buffer.js#L598
const encodingOps = {
    utf8: {
        byteLength: (string)=>new TextEncoder().encode(string).byteLength
    },
    ucs2: {
        byteLength: (string)=>string.length * 2
    },
    utf16le: {
        byteLength: (string)=>string.length * 2
    },
    latin1: {
        byteLength: (string)=>string.length
    },
    ascii: {
        byteLength: (string)=>string.length
    },
    base64: {
        byteLength: (string)=>base64ByteLength(string, string.length)
    },
    hex: {
        byteLength: (string)=>string.length >>> 1
    }
};
function base64ByteLength(str, bytes) {
    // Handle padding
    if (str.charCodeAt(bytes - 1) === 61) bytes--;
    if (bytes > 1 && str.charCodeAt(bytes - 1) === 61) bytes--;
    // Base64 ratio: 3/4
    return bytes * 3 >>> 2;
}
/**
 * See also https://nodejs.org/api/buffer.html
 */ export class Buffer extends Uint8Array {
    /**
   * Allocates a new Buffer of size bytes.
   */ static alloc(size, fill, encoding = "utf8") {
        if (typeof size !== "number") {
            throw new TypeError(`The "size" argument must be of type number. Received type ${typeof size}`);
        }
        const buf = new Buffer(size);
        if (size === 0) return buf;
        let bufFill;
        if (typeof fill === "string") {
            const clearEncoding = checkEncoding(encoding);
            if (typeof fill === "string" && fill.length === 1 && clearEncoding === "utf8") {
                buf.fill(fill.charCodeAt(0));
            } else bufFill = Buffer.from(fill, clearEncoding);
        } else if (typeof fill === "number") {
            buf.fill(fill);
        } else if (fill instanceof Uint8Array) {
            if (fill.length === 0) {
                throw new TypeError(`The argument "value" is invalid. Received ${fill.constructor.name} []`);
            }
            bufFill = fill;
        }
        if (bufFill) {
            if (bufFill.length > buf.length) {
                bufFill = bufFill.subarray(0, buf.length);
            }
            let offset = 0;
            while(offset < size){
                buf.set(bufFill, offset);
                offset += bufFill.length;
                if (offset + bufFill.length >= size) break;
            }
            if (offset !== size) {
                buf.set(bufFill.subarray(0, size - offset), offset);
            }
        }
        return buf;
    }
    static allocUnsafe(size) {
        return new Buffer(size);
    }
    /**
   * Returns the byte length of a string when encoded. This is not the same as
   * String.prototype.length, which does not account for the encoding that is
   * used to convert the string into bytes.
   */ static byteLength(string, encoding = "utf8") {
        if (typeof string != "string") return string.byteLength;
        encoding = normalizeEncoding(encoding) || "utf8";
        return encodingOps[encoding].byteLength(string);
    }
    /**
   * Returns a new Buffer which is the result of concatenating all the Buffer
   * instances in the list together.
   */ static concat(list, totalLength) {
        if (totalLength == undefined) {
            totalLength = 0;
            for (const buf of list){
                totalLength += buf.length;
            }
        }
        const buffer = Buffer.allocUnsafe(totalLength);
        let pos = 0;
        for (const item of list){
            let buf;
            if (!(item instanceof Buffer)) {
                buf = Buffer.from(item);
            } else {
                buf = item;
            }
            buf.copy(buffer, pos);
            pos += buf.length;
        }
        return buffer;
    }
    static from(// deno-lint-ignore no-explicit-any
    value, offsetOrEncoding, length) {
        const offset = typeof offsetOrEncoding === "string" ? undefined : offsetOrEncoding;
        let encoding = typeof offsetOrEncoding === "string" ? offsetOrEncoding : undefined;
        if (typeof value == "string") {
            encoding = checkEncoding(encoding, false);
            if (encoding === "hex") {
                return new Buffer(hex.decode(new TextEncoder().encode(value)).buffer);
            }
            if (encoding === "base64") return new Buffer(base64.decode(value).buffer);
            return new Buffer(new TextEncoder().encode(value).buffer);
        }
        // workaround for https://github.com/microsoft/TypeScript/issues/38446
        return new Buffer(value, offset, length);
    }
    /**
   * Returns true if obj is a Buffer, false otherwise.
   */ static isBuffer(obj) {
        return obj instanceof Buffer;
    }
    // deno-lint-ignore no-explicit-any
    static isEncoding(encoding) {
        return typeof encoding === "string" && encoding.length !== 0 && normalizeEncoding(encoding) !== undefined;
    }
    /**
   * Copies data from a region of buf to a region in target, even if the target
   * memory region overlaps with buf.
   */ copy(targetBuffer, targetStart = 0, sourceStart = 0, sourceEnd = this.length) {
        const sourceBuffer = this.subarray(sourceStart, sourceEnd).subarray(0, Math.max(0, targetBuffer.length - targetStart));
        if (sourceBuffer.length === 0) return 0;
        targetBuffer.set(sourceBuffer, targetStart);
        return sourceBuffer.length;
    }
    /*
   * Returns true if both buf and otherBuffer have exactly the same bytes, false otherwise.
   */ equals(otherBuffer) {
        if (!(otherBuffer instanceof Uint8Array)) {
            throw new TypeError(`The "otherBuffer" argument must be an instance of Buffer or Uint8Array. Received type ${typeof otherBuffer}`);
        }
        if (this === otherBuffer) return true;
        if (this.byteLength !== otherBuffer.byteLength) return false;
        for(let i = 0; i < this.length; i++){
            if (this[i] !== otherBuffer[i]) return false;
        }
        return true;
    }
    readBigInt64BE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getBigInt64(offset);
    }
    readBigInt64LE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getBigInt64(offset, true);
    }
    readBigUInt64BE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getBigUint64(offset);
    }
    readBigUInt64LE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getBigUint64(offset, true);
    }
    readDoubleBE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getFloat64(offset);
    }
    readDoubleLE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getFloat64(offset, true);
    }
    readFloatBE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getFloat32(offset);
    }
    readFloatLE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getFloat32(offset, true);
    }
    readInt8(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getInt8(offset);
    }
    readInt16BE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getInt16(offset);
    }
    readInt16LE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getInt16(offset, true);
    }
    readInt32BE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getInt32(offset);
    }
    readInt32LE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getInt32(offset, true);
    }
    readUInt8(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint8(offset);
    }
    readUInt16BE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint16(offset);
    }
    readUInt16LE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint16(offset, true);
    }
    readUInt32BE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint32(offset);
    }
    readUInt32LE(offset = 0) {
        return new DataView(this.buffer, this.byteOffset, this.byteLength).getUint32(offset, true);
    }
    /**
   * Returns a new Buffer that references the same memory as the original, but
   * offset and cropped by the start and end indices.
   */ slice(begin = 0, end = this.length) {
        // workaround for https://github.com/microsoft/TypeScript/issues/38665
        return this.subarray(begin, end);
    }
    /**
   * Returns a JSON representation of buf. JSON.stringify() implicitly calls
   * this function when stringifying a Buffer instance.
   */ toJSON() {
        return {
            type: "Buffer",
            data: Array.from(this)
        };
    }
    /**
   * Decodes buf to a string according to the specified character encoding in
   * encoding. start and end may be passed to decode only a subset of buf.
   */ toString(encoding = "utf8", start = 0, end = this.length) {
        encoding = checkEncoding(encoding);
        const b = this.subarray(start, end);
        if (encoding === "hex") return new TextDecoder().decode(hex.encode(b));
        if (encoding === "base64") return base64.encode(b);
        return new TextDecoder(encoding).decode(b);
    }
    /**
   * Writes string to buf at offset according to the character encoding in
   * encoding. The length parameter is the number of bytes to write. If buf did
   * not contain enough space to fit the entire string, only part of string will
   * be written. However, partially encoded characters will not be written.
   */ write(string, offset = 0, length = this.length) {
        return new TextEncoder().encodeInto(string, this.subarray(offset, offset + length)).written;
    }
    writeBigInt64BE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setBigInt64(offset, value);
        return offset + 4;
    }
    writeBigInt64LE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setBigInt64(offset, value, true);
        return offset + 4;
    }
    writeBigUInt64BE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setBigUint64(offset, value);
        return offset + 4;
    }
    writeBigUInt64LE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setBigUint64(offset, value, true);
        return offset + 4;
    }
    writeDoubleBE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setFloat64(offset, value);
        return offset + 8;
    }
    writeDoubleLE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setFloat64(offset, value, true);
        return offset + 8;
    }
    writeFloatBE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setFloat32(offset, value);
        return offset + 4;
    }
    writeFloatLE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setFloat32(offset, value, true);
        return offset + 4;
    }
    writeInt8(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setInt8(offset, value);
        return offset + 1;
    }
    writeInt16BE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setInt16(offset, value);
        return offset + 2;
    }
    writeInt16LE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setInt16(offset, value, true);
        return offset + 2;
    }
    writeInt32BE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setUint32(offset, value);
        return offset + 4;
    }
    writeInt32LE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setInt32(offset, value, true);
        return offset + 4;
    }
    writeUInt8(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setUint8(offset, value);
        return offset + 1;
    }
    writeUInt16BE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setUint16(offset, value);
        return offset + 2;
    }
    writeUInt16LE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setUint16(offset, value, true);
        return offset + 2;
    }
    writeUInt32BE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setUint32(offset, value);
        return offset + 4;
    }
    writeUInt32LE(value, offset = 0) {
        new DataView(this.buffer, this.byteOffset, this.byteLength).setUint32(offset, value, true);
        return offset + 4;
    }
}
export const kMaxLength = 4294967296;
export const kStringMaxLength = 536870888;
export const constants = {
    MAX_LENGTH: kMaxLength,
    MAX_STRING_LENGTH: kStringMaxLength
};
export const atob = globalThis.atob;
export const btoa = globalThis.btoa;
export default {
    Buffer,
    kMaxLength,
    kStringMaxLength,
    constants,
    atob,
    btoa
};
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEwOS4wL25vZGUvYnVmZmVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjEgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5pbXBvcnQgKiBhcyBoZXggZnJvbSBcIi4uL2VuY29kaW5nL2hleC50c1wiO1xuaW1wb3J0ICogYXMgYmFzZTY0IGZyb20gXCIuLi9lbmNvZGluZy9iYXNlNjQudHNcIjtcbmltcG9ydCB7IEVuY29kaW5ncywgbm9ybWFsaXplRW5jb2RpbmcsIG5vdEltcGxlbWVudGVkIH0gZnJvbSBcIi4vX3V0aWxzLnRzXCI7XG5cbmNvbnN0IG5vdEltcGxlbWVudGVkRW5jb2RpbmdzID0gW1xuICBcImFzY2lpXCIsXG4gIFwiYmluYXJ5XCIsXG4gIFwibGF0aW4xXCIsXG4gIFwidWNzMlwiLFxuICBcInV0ZjE2bGVcIixcbl07XG5cbmZ1bmN0aW9uIGNoZWNrRW5jb2RpbmcoZW5jb2RpbmcgPSBcInV0ZjhcIiwgc3RyaWN0ID0gdHJ1ZSk6IEVuY29kaW5ncyB7XG4gIGlmICh0eXBlb2YgZW5jb2RpbmcgIT09IFwic3RyaW5nXCIgfHwgKHN0cmljdCAmJiBlbmNvZGluZyA9PT0gXCJcIikpIHtcbiAgICBpZiAoIXN0cmljdCkgcmV0dXJuIFwidXRmOFwiO1xuICAgIHRocm93IG5ldyBUeXBlRXJyb3IoYFVua25vd24gZW5jb2Rpbmc6ICR7ZW5jb2Rpbmd9YCk7XG4gIH1cblxuICBjb25zdCBub3JtYWxpemVkID0gbm9ybWFsaXplRW5jb2RpbmcoZW5jb2RpbmcpO1xuXG4gIGlmIChub3JtYWxpemVkID09PSB1bmRlZmluZWQpIHtcbiAgICB0aHJvdyBuZXcgVHlwZUVycm9yKGBVbmtub3duIGVuY29kaW5nOiAke2VuY29kaW5nfWApO1xuICB9XG5cbiAgaWYgKG5vdEltcGxlbWVudGVkRW5jb2RpbmdzLmluY2x1ZGVzKGVuY29kaW5nKSkge1xuICAgIG5vdEltcGxlbWVudGVkKGBcIiR7ZW5jb2Rpbmd9XCIgZW5jb2RpbmdgKTtcbiAgfVxuXG4gIHJldHVybiBub3JtYWxpemVkO1xufVxuXG5pbnRlcmZhY2UgRW5jb2RpbmdPcCB7XG4gIGJ5dGVMZW5ndGgoc3RyaW5nOiBzdHJpbmcpOiBudW1iZXI7XG59XG5cbi8vIGh0dHBzOi8vZ2l0aHViLmNvbS9ub2RlanMvbm9kZS9ibG9iLzU2ZGJlNDY2ZmRiYzU5OGJhZWEzYmZjZTI4OWJmNTJiOTdiOGI4ZjcvbGliL2J1ZmZlci5qcyNMNTk4XG5jb25zdCBlbmNvZGluZ09wczogeyBba2V5OiBzdHJpbmddOiBFbmNvZGluZ09wIH0gPSB7XG4gIHV0Zjg6IHtcbiAgICBieXRlTGVuZ3RoOiAoc3RyaW5nOiBzdHJpbmcpOiBudW1iZXIgPT5cbiAgICAgIG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShzdHJpbmcpLmJ5dGVMZW5ndGgsXG4gIH0sXG4gIHVjczI6IHtcbiAgICBieXRlTGVuZ3RoOiAoc3RyaW5nOiBzdHJpbmcpOiBudW1iZXIgPT4gc3RyaW5nLmxlbmd0aCAqIDIsXG4gIH0sXG4gIHV0ZjE2bGU6IHtcbiAgICBieXRlTGVuZ3RoOiAoc3RyaW5nOiBzdHJpbmcpOiBudW1iZXIgPT4gc3RyaW5nLmxlbmd0aCAqIDIsXG4gIH0sXG4gIGxhdGluMToge1xuICAgIGJ5dGVMZW5ndGg6IChzdHJpbmc6IHN0cmluZyk6IG51bWJlciA9PiBzdHJpbmcubGVuZ3RoLFxuICB9LFxuICBhc2NpaToge1xuICAgIGJ5dGVMZW5ndGg6IChzdHJpbmc6IHN0cmluZyk6IG51bWJlciA9PiBzdHJpbmcubGVuZ3RoLFxuICB9LFxuICBiYXNlNjQ6IHtcbiAgICBieXRlTGVuZ3RoOiAoc3RyaW5nOiBzdHJpbmcpOiBudW1iZXIgPT5cbiAgICAgIGJhc2U2NEJ5dGVMZW5ndGgoc3RyaW5nLCBzdHJpbmcubGVuZ3RoKSxcbiAgfSxcbiAgaGV4OiB7XG4gICAgYnl0ZUxlbmd0aDogKHN0cmluZzogc3RyaW5nKTogbnVtYmVyID0+IHN0cmluZy5sZW5ndGggPj4+IDEsXG4gIH0sXG59O1xuXG5mdW5jdGlvbiBiYXNlNjRCeXRlTGVuZ3RoKHN0cjogc3RyaW5nLCBieXRlczogbnVtYmVyKTogbnVtYmVyIHtcbiAgLy8gSGFuZGxlIHBhZGRpbmdcbiAgaWYgKHN0ci5jaGFyQ29kZUF0KGJ5dGVzIC0gMSkgPT09IDB4M2QpIGJ5dGVzLS07XG4gIGlmIChieXRlcyA+IDEgJiYgc3RyLmNoYXJDb2RlQXQoYnl0ZXMgLSAxKSA9PT0gMHgzZCkgYnl0ZXMtLTtcblxuICAvLyBCYXNlNjQgcmF0aW86IDMvNFxuICByZXR1cm4gKGJ5dGVzICogMykgPj4+IDI7XG59XG5cbi8qKlxuICogU2VlIGFsc28gaHR0cHM6Ly9ub2RlanMub3JnL2FwaS9idWZmZXIuaHRtbFxuICovXG5leHBvcnQgY2xhc3MgQnVmZmVyIGV4dGVuZHMgVWludDhBcnJheSB7XG4gIC8qKlxuICAgKiBBbGxvY2F0ZXMgYSBuZXcgQnVmZmVyIG9mIHNpemUgYnl0ZXMuXG4gICAqL1xuICBzdGF0aWMgYWxsb2MoXG4gICAgc2l6ZTogbnVtYmVyLFxuICAgIGZpbGw/OiBudW1iZXIgfCBzdHJpbmcgfCBVaW50OEFycmF5IHwgQnVmZmVyLFxuICAgIGVuY29kaW5nID0gXCJ1dGY4XCIsXG4gICk6IEJ1ZmZlciB7XG4gICAgaWYgKHR5cGVvZiBzaXplICE9PSBcIm51bWJlclwiKSB7XG4gICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKFxuICAgICAgICBgVGhlIFwic2l6ZVwiIGFyZ3VtZW50IG11c3QgYmUgb2YgdHlwZSBudW1iZXIuIFJlY2VpdmVkIHR5cGUgJHt0eXBlb2Ygc2l6ZX1gLFxuICAgICAgKTtcbiAgICB9XG5cbiAgICBjb25zdCBidWYgPSBuZXcgQnVmZmVyKHNpemUpO1xuICAgIGlmIChzaXplID09PSAwKSByZXR1cm4gYnVmO1xuXG4gICAgbGV0IGJ1ZkZpbGw7XG4gICAgaWYgKHR5cGVvZiBmaWxsID09PSBcInN0cmluZ1wiKSB7XG4gICAgICBjb25zdCBjbGVhckVuY29kaW5nID0gY2hlY2tFbmNvZGluZyhlbmNvZGluZyk7XG4gICAgICBpZiAoXG4gICAgICAgIHR5cGVvZiBmaWxsID09PSBcInN0cmluZ1wiICYmXG4gICAgICAgIGZpbGwubGVuZ3RoID09PSAxICYmXG4gICAgICAgIGNsZWFyRW5jb2RpbmcgPT09IFwidXRmOFwiXG4gICAgICApIHtcbiAgICAgICAgYnVmLmZpbGwoZmlsbC5jaGFyQ29kZUF0KDApKTtcbiAgICAgIH0gZWxzZSBidWZGaWxsID0gQnVmZmVyLmZyb20oZmlsbCwgY2xlYXJFbmNvZGluZyk7XG4gICAgfSBlbHNlIGlmICh0eXBlb2YgZmlsbCA9PT0gXCJudW1iZXJcIikge1xuICAgICAgYnVmLmZpbGwoZmlsbCk7XG4gICAgfSBlbHNlIGlmIChmaWxsIGluc3RhbmNlb2YgVWludDhBcnJheSkge1xuICAgICAgaWYgKGZpbGwubGVuZ3RoID09PSAwKSB7XG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgICAgYFRoZSBhcmd1bWVudCBcInZhbHVlXCIgaXMgaW52YWxpZC4gUmVjZWl2ZWQgJHtmaWxsLmNvbnN0cnVjdG9yLm5hbWV9IFtdYCxcbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgYnVmRmlsbCA9IGZpbGw7XG4gICAgfVxuXG4gICAgaWYgKGJ1ZkZpbGwpIHtcbiAgICAgIGlmIChidWZGaWxsLmxlbmd0aCA+IGJ1Zi5sZW5ndGgpIHtcbiAgICAgICAgYnVmRmlsbCA9IGJ1ZkZpbGwuc3ViYXJyYXkoMCwgYnVmLmxlbmd0aCk7XG4gICAgICB9XG5cbiAgICAgIGxldCBvZmZzZXQgPSAwO1xuICAgICAgd2hpbGUgKG9mZnNldCA8IHNpemUpIHtcbiAgICAgICAgYnVmLnNldChidWZGaWxsLCBvZmZzZXQpO1xuICAgICAgICBvZmZzZXQgKz0gYnVmRmlsbC5sZW5ndGg7XG4gICAgICAgIGlmIChvZmZzZXQgKyBidWZGaWxsLmxlbmd0aCA+PSBzaXplKSBicmVhaztcbiAgICAgIH1cbiAgICAgIGlmIChvZmZzZXQgIT09IHNpemUpIHtcbiAgICAgICAgYnVmLnNldChidWZGaWxsLnN1YmFycmF5KDAsIHNpemUgLSBvZmZzZXQpLCBvZmZzZXQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIHJldHVybiBidWY7XG4gIH1cblxuICBzdGF0aWMgYWxsb2NVbnNhZmUoc2l6ZTogbnVtYmVyKTogQnVmZmVyIHtcbiAgICByZXR1cm4gbmV3IEJ1ZmZlcihzaXplKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBSZXR1cm5zIHRoZSBieXRlIGxlbmd0aCBvZiBhIHN0cmluZyB3aGVuIGVuY29kZWQuIFRoaXMgaXMgbm90IHRoZSBzYW1lIGFzXG4gICAqIFN0cmluZy5wcm90b3R5cGUubGVuZ3RoLCB3aGljaCBkb2VzIG5vdCBhY2NvdW50IGZvciB0aGUgZW5jb2RpbmcgdGhhdCBpc1xuICAgKiB1c2VkIHRvIGNvbnZlcnQgdGhlIHN0cmluZyBpbnRvIGJ5dGVzLlxuICAgKi9cbiAgc3RhdGljIGJ5dGVMZW5ndGgoXG4gICAgc3RyaW5nOiBzdHJpbmcgfCBCdWZmZXIgfCBBcnJheUJ1ZmZlclZpZXcgfCBBcnJheUJ1ZmZlciB8IFNoYXJlZEFycmF5QnVmZmVyLFxuICAgIGVuY29kaW5nID0gXCJ1dGY4XCIsXG4gICk6IG51bWJlciB7XG4gICAgaWYgKHR5cGVvZiBzdHJpbmcgIT0gXCJzdHJpbmdcIikgcmV0dXJuIHN0cmluZy5ieXRlTGVuZ3RoO1xuXG4gICAgZW5jb2RpbmcgPSBub3JtYWxpemVFbmNvZGluZyhlbmNvZGluZykgfHwgXCJ1dGY4XCI7XG4gICAgcmV0dXJuIGVuY29kaW5nT3BzW2VuY29kaW5nXS5ieXRlTGVuZ3RoKHN0cmluZyk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIG5ldyBCdWZmZXIgd2hpY2ggaXMgdGhlIHJlc3VsdCBvZiBjb25jYXRlbmF0aW5nIGFsbCB0aGUgQnVmZmVyXG4gICAqIGluc3RhbmNlcyBpbiB0aGUgbGlzdCB0b2dldGhlci5cbiAgICovXG4gIHN0YXRpYyBjb25jYXQobGlzdDogQnVmZmVyW10gfCBVaW50OEFycmF5W10sIHRvdGFsTGVuZ3RoPzogbnVtYmVyKTogQnVmZmVyIHtcbiAgICBpZiAodG90YWxMZW5ndGggPT0gdW5kZWZpbmVkKSB7XG4gICAgICB0b3RhbExlbmd0aCA9IDA7XG4gICAgICBmb3IgKGNvbnN0IGJ1ZiBvZiBsaXN0KSB7XG4gICAgICAgIHRvdGFsTGVuZ3RoICs9IGJ1Zi5sZW5ndGg7XG4gICAgICB9XG4gICAgfVxuXG4gICAgY29uc3QgYnVmZmVyID0gQnVmZmVyLmFsbG9jVW5zYWZlKHRvdGFsTGVuZ3RoKTtcbiAgICBsZXQgcG9zID0gMDtcbiAgICBmb3IgKGNvbnN0IGl0ZW0gb2YgbGlzdCkge1xuICAgICAgbGV0IGJ1ZjogQnVmZmVyO1xuICAgICAgaWYgKCEoaXRlbSBpbnN0YW5jZW9mIEJ1ZmZlcikpIHtcbiAgICAgICAgYnVmID0gQnVmZmVyLmZyb20oaXRlbSk7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBidWYgPSBpdGVtO1xuICAgICAgfVxuICAgICAgYnVmLmNvcHkoYnVmZmVyLCBwb3MpO1xuICAgICAgcG9zICs9IGJ1Zi5sZW5ndGg7XG4gICAgfVxuXG4gICAgcmV0dXJuIGJ1ZmZlcjtcbiAgfVxuXG4gIC8qKlxuICAgKiBBbGxvY2F0ZXMgYSBuZXcgQnVmZmVyIHVzaW5nIGFuIGFycmF5IG9mIGJ5dGVzIGluIHRoZSByYW5nZSAwIOKAkyAyNTUuIEFycmF5XG4gICAqIGVudHJpZXMgb3V0c2lkZSB0aGF0IHJhbmdlIHdpbGwgYmUgdHJ1bmNhdGVkIHRvIGZpdCBpbnRvIGl0LlxuICAgKi9cbiAgc3RhdGljIGZyb20oYXJyYXk6IG51bWJlcltdKTogQnVmZmVyO1xuICAvKipcbiAgICogVGhpcyBjcmVhdGVzIGEgdmlldyBvZiB0aGUgQXJyYXlCdWZmZXIgd2l0aG91dCBjb3B5aW5nIHRoZSB1bmRlcmx5aW5nXG4gICAqIG1lbW9yeS4gRm9yIGV4YW1wbGUsIHdoZW4gcGFzc2VkIGEgcmVmZXJlbmNlIHRvIHRoZSAuYnVmZmVyIHByb3BlcnR5IG9mIGFcbiAgICogVHlwZWRBcnJheSBpbnN0YW5jZSwgdGhlIG5ld2x5IGNyZWF0ZWQgQnVmZmVyIHdpbGwgc2hhcmUgdGhlIHNhbWUgYWxsb2NhdGVkXG4gICAqIG1lbW9yeSBhcyB0aGUgVHlwZWRBcnJheS5cbiAgICovXG4gIHN0YXRpYyBmcm9tKFxuICAgIGFycmF5QnVmZmVyOiBBcnJheUJ1ZmZlciB8IFNoYXJlZEFycmF5QnVmZmVyLFxuICAgIGJ5dGVPZmZzZXQ/OiBudW1iZXIsXG4gICAgbGVuZ3RoPzogbnVtYmVyLFxuICApOiBCdWZmZXI7XG4gIC8qKlxuICAgKiBDb3BpZXMgdGhlIHBhc3NlZCBidWZmZXIgZGF0YSBvbnRvIGEgbmV3IEJ1ZmZlciBpbnN0YW5jZS5cbiAgICovXG4gIHN0YXRpYyBmcm9tKGJ1ZmZlcjogQnVmZmVyIHwgVWludDhBcnJheSk6IEJ1ZmZlcjtcbiAgLyoqXG4gICAqIENyZWF0ZXMgYSBuZXcgQnVmZmVyIGNvbnRhaW5pbmcgc3RyaW5nLlxuICAgKi9cbiAgc3RhdGljIGZyb20oc3RyaW5nOiBzdHJpbmcsIGVuY29kaW5nPzogc3RyaW5nKTogQnVmZmVyO1xuICBzdGF0aWMgZnJvbShcbiAgICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICAgIHZhbHVlOiBhbnksXG4gICAgb2Zmc2V0T3JFbmNvZGluZz86IG51bWJlciB8IHN0cmluZyxcbiAgICBsZW5ndGg/OiBudW1iZXIsXG4gICk6IEJ1ZmZlciB7XG4gICAgY29uc3Qgb2Zmc2V0ID0gdHlwZW9mIG9mZnNldE9yRW5jb2RpbmcgPT09IFwic3RyaW5nXCJcbiAgICAgID8gdW5kZWZpbmVkXG4gICAgICA6IG9mZnNldE9yRW5jb2Rpbmc7XG4gICAgbGV0IGVuY29kaW5nID0gdHlwZW9mIG9mZnNldE9yRW5jb2RpbmcgPT09IFwic3RyaW5nXCJcbiAgICAgID8gb2Zmc2V0T3JFbmNvZGluZ1xuICAgICAgOiB1bmRlZmluZWQ7XG5cbiAgICBpZiAodHlwZW9mIHZhbHVlID09IFwic3RyaW5nXCIpIHtcbiAgICAgIGVuY29kaW5nID0gY2hlY2tFbmNvZGluZyhlbmNvZGluZywgZmFsc2UpO1xuICAgICAgaWYgKGVuY29kaW5nID09PSBcImhleFwiKSB7XG4gICAgICAgIHJldHVybiBuZXcgQnVmZmVyKGhleC5kZWNvZGUobmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKHZhbHVlKSkuYnVmZmVyKTtcbiAgICAgIH1cbiAgICAgIGlmIChlbmNvZGluZyA9PT0gXCJiYXNlNjRcIikgcmV0dXJuIG5ldyBCdWZmZXIoYmFzZTY0LmRlY29kZSh2YWx1ZSkuYnVmZmVyKTtcbiAgICAgIHJldHVybiBuZXcgQnVmZmVyKG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZSh2YWx1ZSkuYnVmZmVyKTtcbiAgICB9XG5cbiAgICAvLyB3b3JrYXJvdW5kIGZvciBodHRwczovL2dpdGh1Yi5jb20vbWljcm9zb2Z0L1R5cGVTY3JpcHQvaXNzdWVzLzM4NDQ2XG4gICAgcmV0dXJuIG5ldyBCdWZmZXIodmFsdWUsIG9mZnNldCEsIGxlbmd0aCk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyB0cnVlIGlmIG9iaiBpcyBhIEJ1ZmZlciwgZmFsc2Ugb3RoZXJ3aXNlLlxuICAgKi9cbiAgc3RhdGljIGlzQnVmZmVyKG9iajogdW5rbm93bik6IG9iaiBpcyBCdWZmZXIge1xuICAgIHJldHVybiBvYmogaW5zdGFuY2VvZiBCdWZmZXI7XG4gIH1cblxuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBzdGF0aWMgaXNFbmNvZGluZyhlbmNvZGluZzogYW55KTogYm9vbGVhbiB7XG4gICAgcmV0dXJuIChcbiAgICAgIHR5cGVvZiBlbmNvZGluZyA9PT0gXCJzdHJpbmdcIiAmJlxuICAgICAgZW5jb2RpbmcubGVuZ3RoICE9PSAwICYmXG4gICAgICBub3JtYWxpemVFbmNvZGluZyhlbmNvZGluZykgIT09IHVuZGVmaW5lZFxuICAgICk7XG4gIH1cblxuICAvKipcbiAgICogQ29waWVzIGRhdGEgZnJvbSBhIHJlZ2lvbiBvZiBidWYgdG8gYSByZWdpb24gaW4gdGFyZ2V0LCBldmVuIGlmIHRoZSB0YXJnZXRcbiAgICogbWVtb3J5IHJlZ2lvbiBvdmVybGFwcyB3aXRoIGJ1Zi5cbiAgICovXG4gIGNvcHkoXG4gICAgdGFyZ2V0QnVmZmVyOiBCdWZmZXIgfCBVaW50OEFycmF5LFxuICAgIHRhcmdldFN0YXJ0ID0gMCxcbiAgICBzb3VyY2VTdGFydCA9IDAsXG4gICAgc291cmNlRW5kID0gdGhpcy5sZW5ndGgsXG4gICk6IG51bWJlciB7XG4gICAgY29uc3Qgc291cmNlQnVmZmVyID0gdGhpc1xuICAgICAgLnN1YmFycmF5KHNvdXJjZVN0YXJ0LCBzb3VyY2VFbmQpXG4gICAgICAuc3ViYXJyYXkoMCwgTWF0aC5tYXgoMCwgdGFyZ2V0QnVmZmVyLmxlbmd0aCAtIHRhcmdldFN0YXJ0KSk7XG5cbiAgICBpZiAoc291cmNlQnVmZmVyLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDA7XG5cbiAgICB0YXJnZXRCdWZmZXIuc2V0KHNvdXJjZUJ1ZmZlciwgdGFyZ2V0U3RhcnQpO1xuICAgIHJldHVybiBzb3VyY2VCdWZmZXIubGVuZ3RoO1xuICB9XG5cbiAgLypcbiAgICogUmV0dXJucyB0cnVlIGlmIGJvdGggYnVmIGFuZCBvdGhlckJ1ZmZlciBoYXZlIGV4YWN0bHkgdGhlIHNhbWUgYnl0ZXMsIGZhbHNlIG90aGVyd2lzZS5cbiAgICovXG4gIGVxdWFscyhvdGhlckJ1ZmZlcjogVWludDhBcnJheSB8IEJ1ZmZlcik6IGJvb2xlYW4ge1xuICAgIGlmICghKG90aGVyQnVmZmVyIGluc3RhbmNlb2YgVWludDhBcnJheSkpIHtcbiAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoXG4gICAgICAgIGBUaGUgXCJvdGhlckJ1ZmZlclwiIGFyZ3VtZW50IG11c3QgYmUgYW4gaW5zdGFuY2Ugb2YgQnVmZmVyIG9yIFVpbnQ4QXJyYXkuIFJlY2VpdmVkIHR5cGUgJHt0eXBlb2Ygb3RoZXJCdWZmZXJ9YCxcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMgPT09IG90aGVyQnVmZmVyKSByZXR1cm4gdHJ1ZTtcbiAgICBpZiAodGhpcy5ieXRlTGVuZ3RoICE9PSBvdGhlckJ1ZmZlci5ieXRlTGVuZ3RoKSByZXR1cm4gZmFsc2U7XG5cbiAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMubGVuZ3RoOyBpKyspIHtcbiAgICAgIGlmICh0aGlzW2ldICE9PSBvdGhlckJ1ZmZlcltpXSkgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgIHJldHVybiB0cnVlO1xuICB9XG5cbiAgcmVhZEJpZ0ludDY0QkUob2Zmc2V0ID0gMCk6IGJpZ2ludCB7XG4gICAgcmV0dXJuIG5ldyBEYXRhVmlldyhcbiAgICAgIHRoaXMuYnVmZmVyLFxuICAgICAgdGhpcy5ieXRlT2Zmc2V0LFxuICAgICAgdGhpcy5ieXRlTGVuZ3RoLFxuICAgICkuZ2V0QmlnSW50NjQob2Zmc2V0KTtcbiAgfVxuICByZWFkQmlnSW50NjRMRShvZmZzZXQgPSAwKTogYmlnaW50IHtcbiAgICByZXR1cm4gbmV3IERhdGFWaWV3KFxuICAgICAgdGhpcy5idWZmZXIsXG4gICAgICB0aGlzLmJ5dGVPZmZzZXQsXG4gICAgICB0aGlzLmJ5dGVMZW5ndGgsXG4gICAgKS5nZXRCaWdJbnQ2NChvZmZzZXQsIHRydWUpO1xuICB9XG5cbiAgcmVhZEJpZ1VJbnQ2NEJFKG9mZnNldCA9IDApOiBiaWdpbnQge1xuICAgIHJldHVybiBuZXcgRGF0YVZpZXcoXG4gICAgICB0aGlzLmJ1ZmZlcixcbiAgICAgIHRoaXMuYnl0ZU9mZnNldCxcbiAgICAgIHRoaXMuYnl0ZUxlbmd0aCxcbiAgICApLmdldEJpZ1VpbnQ2NChvZmZzZXQpO1xuICB9XG4gIHJlYWRCaWdVSW50NjRMRShvZmZzZXQgPSAwKTogYmlnaW50IHtcbiAgICByZXR1cm4gbmV3IERhdGFWaWV3KFxuICAgICAgdGhpcy5idWZmZXIsXG4gICAgICB0aGlzLmJ5dGVPZmZzZXQsXG4gICAgICB0aGlzLmJ5dGVMZW5ndGgsXG4gICAgKS5nZXRCaWdVaW50NjQob2Zmc2V0LCB0cnVlKTtcbiAgfVxuXG4gIHJlYWREb3VibGVCRShvZmZzZXQgPSAwKTogbnVtYmVyIHtcbiAgICByZXR1cm4gbmV3IERhdGFWaWV3KFxuICAgICAgdGhpcy5idWZmZXIsXG4gICAgICB0aGlzLmJ5dGVPZmZzZXQsXG4gICAgICB0aGlzLmJ5dGVMZW5ndGgsXG4gICAgKS5nZXRGbG9hdDY0KG9mZnNldCk7XG4gIH1cbiAgcmVhZERvdWJsZUxFKG9mZnNldCA9IDApOiBudW1iZXIge1xuICAgIHJldHVybiBuZXcgRGF0YVZpZXcoXG4gICAgICB0aGlzLmJ1ZmZlcixcbiAgICAgIHRoaXMuYnl0ZU9mZnNldCxcbiAgICAgIHRoaXMuYnl0ZUxlbmd0aCxcbiAgICApLmdldEZsb2F0NjQob2Zmc2V0LCB0cnVlKTtcbiAgfVxuXG4gIHJlYWRGbG9hdEJFKG9mZnNldCA9IDApOiBudW1iZXIge1xuICAgIHJldHVybiBuZXcgRGF0YVZpZXcoXG4gICAgICB0aGlzLmJ1ZmZlcixcbiAgICAgIHRoaXMuYnl0ZU9mZnNldCxcbiAgICAgIHRoaXMuYnl0ZUxlbmd0aCxcbiAgICApLmdldEZsb2F0MzIob2Zmc2V0KTtcbiAgfVxuICByZWFkRmxvYXRMRShvZmZzZXQgPSAwKTogbnVtYmVyIHtcbiAgICByZXR1cm4gbmV3IERhdGFWaWV3KFxuICAgICAgdGhpcy5idWZmZXIsXG4gICAgICB0aGlzLmJ5dGVPZmZzZXQsXG4gICAgICB0aGlzLmJ5dGVMZW5ndGgsXG4gICAgKS5nZXRGbG9hdDMyKG9mZnNldCwgdHJ1ZSk7XG4gIH1cblxuICByZWFkSW50OChvZmZzZXQgPSAwKTogbnVtYmVyIHtcbiAgICByZXR1cm4gbmV3IERhdGFWaWV3KHRoaXMuYnVmZmVyLCB0aGlzLmJ5dGVPZmZzZXQsIHRoaXMuYnl0ZUxlbmd0aCkuZ2V0SW50OChcbiAgICAgIG9mZnNldCxcbiAgICApO1xuICB9XG5cbiAgcmVhZEludDE2QkUob2Zmc2V0ID0gMCk6IG51bWJlciB7XG4gICAgcmV0dXJuIG5ldyBEYXRhVmlldyh0aGlzLmJ1ZmZlciwgdGhpcy5ieXRlT2Zmc2V0LCB0aGlzLmJ5dGVMZW5ndGgpLmdldEludDE2KFxuICAgICAgb2Zmc2V0LFxuICAgICk7XG4gIH1cbiAgcmVhZEludDE2TEUob2Zmc2V0ID0gMCk6IG51bWJlciB7XG4gICAgcmV0dXJuIG5ldyBEYXRhVmlldyh0aGlzLmJ1ZmZlciwgdGhpcy5ieXRlT2Zmc2V0LCB0aGlzLmJ5dGVMZW5ndGgpLmdldEludDE2KFxuICAgICAgb2Zmc2V0LFxuICAgICAgdHJ1ZSxcbiAgICApO1xuICB9XG5cbiAgcmVhZEludDMyQkUob2Zmc2V0ID0gMCk6IG51bWJlciB7XG4gICAgcmV0dXJuIG5ldyBEYXRhVmlldyh0aGlzLmJ1ZmZlciwgdGhpcy5ieXRlT2Zmc2V0LCB0aGlzLmJ5dGVMZW5ndGgpLmdldEludDMyKFxuICAgICAgb2Zmc2V0LFxuICAgICk7XG4gIH1cbiAgcmVhZEludDMyTEUob2Zmc2V0ID0gMCk6IG51bWJlciB7XG4gICAgcmV0dXJuIG5ldyBEYXRhVmlldyh0aGlzLmJ1ZmZlciwgdGhpcy5ieXRlT2Zmc2V0LCB0aGlzLmJ5dGVMZW5ndGgpLmdldEludDMyKFxuICAgICAgb2Zmc2V0LFxuICAgICAgdHJ1ZSxcbiAgICApO1xuICB9XG5cbiAgcmVhZFVJbnQ4KG9mZnNldCA9IDApOiBudW1iZXIge1xuICAgIHJldHVybiBuZXcgRGF0YVZpZXcodGhpcy5idWZmZXIsIHRoaXMuYnl0ZU9mZnNldCwgdGhpcy5ieXRlTGVuZ3RoKS5nZXRVaW50OChcbiAgICAgIG9mZnNldCxcbiAgICApO1xuICB9XG5cbiAgcmVhZFVJbnQxNkJFKG9mZnNldCA9IDApOiBudW1iZXIge1xuICAgIHJldHVybiBuZXcgRGF0YVZpZXcoXG4gICAgICB0aGlzLmJ1ZmZlcixcbiAgICAgIHRoaXMuYnl0ZU9mZnNldCxcbiAgICAgIHRoaXMuYnl0ZUxlbmd0aCxcbiAgICApLmdldFVpbnQxNihvZmZzZXQpO1xuICB9XG4gIHJlYWRVSW50MTZMRShvZmZzZXQgPSAwKTogbnVtYmVyIHtcbiAgICByZXR1cm4gbmV3IERhdGFWaWV3KFxuICAgICAgdGhpcy5idWZmZXIsXG4gICAgICB0aGlzLmJ5dGVPZmZzZXQsXG4gICAgICB0aGlzLmJ5dGVMZW5ndGgsXG4gICAgKS5nZXRVaW50MTYob2Zmc2V0LCB0cnVlKTtcbiAgfVxuXG4gIHJlYWRVSW50MzJCRShvZmZzZXQgPSAwKTogbnVtYmVyIHtcbiAgICByZXR1cm4gbmV3IERhdGFWaWV3KFxuICAgICAgdGhpcy5idWZmZXIsXG4gICAgICB0aGlzLmJ5dGVPZmZzZXQsXG4gICAgICB0aGlzLmJ5dGVMZW5ndGgsXG4gICAgKS5nZXRVaW50MzIob2Zmc2V0KTtcbiAgfVxuICByZWFkVUludDMyTEUob2Zmc2V0ID0gMCk6IG51bWJlciB7XG4gICAgcmV0dXJuIG5ldyBEYXRhVmlldyhcbiAgICAgIHRoaXMuYnVmZmVyLFxuICAgICAgdGhpcy5ieXRlT2Zmc2V0LFxuICAgICAgdGhpcy5ieXRlTGVuZ3RoLFxuICAgICkuZ2V0VWludDMyKG9mZnNldCwgdHJ1ZSk7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIG5ldyBCdWZmZXIgdGhhdCByZWZlcmVuY2VzIHRoZSBzYW1lIG1lbW9yeSBhcyB0aGUgb3JpZ2luYWwsIGJ1dFxuICAgKiBvZmZzZXQgYW5kIGNyb3BwZWQgYnkgdGhlIHN0YXJ0IGFuZCBlbmQgaW5kaWNlcy5cbiAgICovXG4gIHNsaWNlKGJlZ2luID0gMCwgZW5kID0gdGhpcy5sZW5ndGgpOiBCdWZmZXIge1xuICAgIC8vIHdvcmthcm91bmQgZm9yIGh0dHBzOi8vZ2l0aHViLmNvbS9taWNyb3NvZnQvVHlwZVNjcmlwdC9pc3N1ZXMvMzg2NjVcbiAgICByZXR1cm4gdGhpcy5zdWJhcnJheShiZWdpbiwgZW5kKSBhcyBCdWZmZXI7XG4gIH1cblxuICAvKipcbiAgICogUmV0dXJucyBhIEpTT04gcmVwcmVzZW50YXRpb24gb2YgYnVmLiBKU09OLnN0cmluZ2lmeSgpIGltcGxpY2l0bHkgY2FsbHNcbiAgICogdGhpcyBmdW5jdGlvbiB3aGVuIHN0cmluZ2lmeWluZyBhIEJ1ZmZlciBpbnN0YW5jZS5cbiAgICovXG4gIHRvSlNPTigpOiBSZWNvcmQ8c3RyaW5nLCB1bmtub3duPiB7XG4gICAgcmV0dXJuIHsgdHlwZTogXCJCdWZmZXJcIiwgZGF0YTogQXJyYXkuZnJvbSh0aGlzKSB9O1xuICB9XG5cbiAgLyoqXG4gICAqIERlY29kZXMgYnVmIHRvIGEgc3RyaW5nIGFjY29yZGluZyB0byB0aGUgc3BlY2lmaWVkIGNoYXJhY3RlciBlbmNvZGluZyBpblxuICAgKiBlbmNvZGluZy4gc3RhcnQgYW5kIGVuZCBtYXkgYmUgcGFzc2VkIHRvIGRlY29kZSBvbmx5IGEgc3Vic2V0IG9mIGJ1Zi5cbiAgICovXG4gIHRvU3RyaW5nKGVuY29kaW5nID0gXCJ1dGY4XCIsIHN0YXJ0ID0gMCwgZW5kID0gdGhpcy5sZW5ndGgpOiBzdHJpbmcge1xuICAgIGVuY29kaW5nID0gY2hlY2tFbmNvZGluZyhlbmNvZGluZyk7XG5cbiAgICBjb25zdCBiID0gdGhpcy5zdWJhcnJheShzdGFydCwgZW5kKTtcbiAgICBpZiAoZW5jb2RpbmcgPT09IFwiaGV4XCIpIHJldHVybiBuZXcgVGV4dERlY29kZXIoKS5kZWNvZGUoaGV4LmVuY29kZShiKSk7XG4gICAgaWYgKGVuY29kaW5nID09PSBcImJhc2U2NFwiKSByZXR1cm4gYmFzZTY0LmVuY29kZShiKTtcblxuICAgIHJldHVybiBuZXcgVGV4dERlY29kZXIoZW5jb2RpbmcpLmRlY29kZShiKTtcbiAgfVxuXG4gIC8qKlxuICAgKiBXcml0ZXMgc3RyaW5nIHRvIGJ1ZiBhdCBvZmZzZXQgYWNjb3JkaW5nIHRvIHRoZSBjaGFyYWN0ZXIgZW5jb2RpbmcgaW5cbiAgICogZW5jb2RpbmcuIFRoZSBsZW5ndGggcGFyYW1ldGVyIGlzIHRoZSBudW1iZXIgb2YgYnl0ZXMgdG8gd3JpdGUuIElmIGJ1ZiBkaWRcbiAgICogbm90IGNvbnRhaW4gZW5vdWdoIHNwYWNlIHRvIGZpdCB0aGUgZW50aXJlIHN0cmluZywgb25seSBwYXJ0IG9mIHN0cmluZyB3aWxsXG4gICAqIGJlIHdyaXR0ZW4uIEhvd2V2ZXIsIHBhcnRpYWxseSBlbmNvZGVkIGNoYXJhY3RlcnMgd2lsbCBub3QgYmUgd3JpdHRlbi5cbiAgICovXG4gIHdyaXRlKHN0cmluZzogc3RyaW5nLCBvZmZzZXQgPSAwLCBsZW5ndGggPSB0aGlzLmxlbmd0aCk6IG51bWJlciB8IHVuZGVmaW5lZCB7XG4gICAgcmV0dXJuIG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZUludG8oXG4gICAgICBzdHJpbmcsXG4gICAgICB0aGlzLnN1YmFycmF5KG9mZnNldCwgb2Zmc2V0ICsgbGVuZ3RoKSxcbiAgICApLndyaXR0ZW47XG4gIH1cblxuICB3cml0ZUJpZ0ludDY0QkUodmFsdWU6IGJpZ2ludCwgb2Zmc2V0ID0gMCk6IG51bWJlciB7XG4gICAgbmV3IERhdGFWaWV3KHRoaXMuYnVmZmVyLCB0aGlzLmJ5dGVPZmZzZXQsIHRoaXMuYnl0ZUxlbmd0aCkuc2V0QmlnSW50NjQoXG4gICAgICBvZmZzZXQsXG4gICAgICB2YWx1ZSxcbiAgICApO1xuICAgIHJldHVybiBvZmZzZXQgKyA0O1xuICB9XG4gIHdyaXRlQmlnSW50NjRMRSh2YWx1ZTogYmlnaW50LCBvZmZzZXQgPSAwKTogbnVtYmVyIHtcbiAgICBuZXcgRGF0YVZpZXcodGhpcy5idWZmZXIsIHRoaXMuYnl0ZU9mZnNldCwgdGhpcy5ieXRlTGVuZ3RoKS5zZXRCaWdJbnQ2NChcbiAgICAgIG9mZnNldCxcbiAgICAgIHZhbHVlLFxuICAgICAgdHJ1ZSxcbiAgICApO1xuICAgIHJldHVybiBvZmZzZXQgKyA0O1xuICB9XG5cbiAgd3JpdGVCaWdVSW50NjRCRSh2YWx1ZTogYmlnaW50LCBvZmZzZXQgPSAwKTogbnVtYmVyIHtcbiAgICBuZXcgRGF0YVZpZXcodGhpcy5idWZmZXIsIHRoaXMuYnl0ZU9mZnNldCwgdGhpcy5ieXRlTGVuZ3RoKS5zZXRCaWdVaW50NjQoXG4gICAgICBvZmZzZXQsXG4gICAgICB2YWx1ZSxcbiAgICApO1xuICAgIHJldHVybiBvZmZzZXQgKyA0O1xuICB9XG4gIHdyaXRlQmlnVUludDY0TEUodmFsdWU6IGJpZ2ludCwgb2Zmc2V0ID0gMCk6IG51bWJlciB7XG4gICAgbmV3IERhdGFWaWV3KHRoaXMuYnVmZmVyLCB0aGlzLmJ5dGVPZmZzZXQsIHRoaXMuYnl0ZUxlbmd0aCkuc2V0QmlnVWludDY0KFxuICAgICAgb2Zmc2V0LFxuICAgICAgdmFsdWUsXG4gICAgICB0cnVlLFxuICAgICk7XG4gICAgcmV0dXJuIG9mZnNldCArIDQ7XG4gIH1cblxuICB3cml0ZURvdWJsZUJFKHZhbHVlOiBudW1iZXIsIG9mZnNldCA9IDApOiBudW1iZXIge1xuICAgIG5ldyBEYXRhVmlldyh0aGlzLmJ1ZmZlciwgdGhpcy5ieXRlT2Zmc2V0LCB0aGlzLmJ5dGVMZW5ndGgpLnNldEZsb2F0NjQoXG4gICAgICBvZmZzZXQsXG4gICAgICB2YWx1ZSxcbiAgICApO1xuICAgIHJldHVybiBvZmZzZXQgKyA4O1xuICB9XG4gIHdyaXRlRG91YmxlTEUodmFsdWU6IG51bWJlciwgb2Zmc2V0ID0gMCk6IG51bWJlciB7XG4gICAgbmV3IERhdGFWaWV3KHRoaXMuYnVmZmVyLCB0aGlzLmJ5dGVPZmZzZXQsIHRoaXMuYnl0ZUxlbmd0aCkuc2V0RmxvYXQ2NChcbiAgICAgIG9mZnNldCxcbiAgICAgIHZhbHVlLFxuICAgICAgdHJ1ZSxcbiAgICApO1xuICAgIHJldHVybiBvZmZzZXQgKyA4O1xuICB9XG5cbiAgd3JpdGVGbG9hdEJFKHZhbHVlOiBudW1iZXIsIG9mZnNldCA9IDApOiBudW1iZXIge1xuICAgIG5ldyBEYXRhVmlldyh0aGlzLmJ1ZmZlciwgdGhpcy5ieXRlT2Zmc2V0LCB0aGlzLmJ5dGVMZW5ndGgpLnNldEZsb2F0MzIoXG4gICAgICBvZmZzZXQsXG4gICAgICB2YWx1ZSxcbiAgICApO1xuICAgIHJldHVybiBvZmZzZXQgKyA0O1xuICB9XG4gIHdyaXRlRmxvYXRMRSh2YWx1ZTogbnVtYmVyLCBvZmZzZXQgPSAwKTogbnVtYmVyIHtcbiAgICBuZXcgRGF0YVZpZXcodGhpcy5idWZmZXIsIHRoaXMuYnl0ZU9mZnNldCwgdGhpcy5ieXRlTGVuZ3RoKS5zZXRGbG9hdDMyKFxuICAgICAgb2Zmc2V0LFxuICAgICAgdmFsdWUsXG4gICAgICB0cnVlLFxuICAgICk7XG4gICAgcmV0dXJuIG9mZnNldCArIDQ7XG4gIH1cblxuICB3cml0ZUludDgodmFsdWU6IG51bWJlciwgb2Zmc2V0ID0gMCk6IG51bWJlciB7XG4gICAgbmV3IERhdGFWaWV3KHRoaXMuYnVmZmVyLCB0aGlzLmJ5dGVPZmZzZXQsIHRoaXMuYnl0ZUxlbmd0aCkuc2V0SW50OChcbiAgICAgIG9mZnNldCxcbiAgICAgIHZhbHVlLFxuICAgICk7XG4gICAgcmV0dXJuIG9mZnNldCArIDE7XG4gIH1cblxuICB3cml0ZUludDE2QkUodmFsdWU6IG51bWJlciwgb2Zmc2V0ID0gMCk6IG51bWJlciB7XG4gICAgbmV3IERhdGFWaWV3KHRoaXMuYnVmZmVyLCB0aGlzLmJ5dGVPZmZzZXQsIHRoaXMuYnl0ZUxlbmd0aCkuc2V0SW50MTYoXG4gICAgICBvZmZzZXQsXG4gICAgICB2YWx1ZSxcbiAgICApO1xuICAgIHJldHVybiBvZmZzZXQgKyAyO1xuICB9XG4gIHdyaXRlSW50MTZMRSh2YWx1ZTogbnVtYmVyLCBvZmZzZXQgPSAwKTogbnVtYmVyIHtcbiAgICBuZXcgRGF0YVZpZXcodGhpcy5idWZmZXIsIHRoaXMuYnl0ZU9mZnNldCwgdGhpcy5ieXRlTGVuZ3RoKS5zZXRJbnQxNihcbiAgICAgIG9mZnNldCxcbiAgICAgIHZhbHVlLFxuICAgICAgdHJ1ZSxcbiAgICApO1xuICAgIHJldHVybiBvZmZzZXQgKyAyO1xuICB9XG5cbiAgd3JpdGVJbnQzMkJFKHZhbHVlOiBudW1iZXIsIG9mZnNldCA9IDApOiBudW1iZXIge1xuICAgIG5ldyBEYXRhVmlldyh0aGlzLmJ1ZmZlciwgdGhpcy5ieXRlT2Zmc2V0LCB0aGlzLmJ5dGVMZW5ndGgpLnNldFVpbnQzMihcbiAgICAgIG9mZnNldCxcbiAgICAgIHZhbHVlLFxuICAgICk7XG4gICAgcmV0dXJuIG9mZnNldCArIDQ7XG4gIH1cbiAgd3JpdGVJbnQzMkxFKHZhbHVlOiBudW1iZXIsIG9mZnNldCA9IDApOiBudW1iZXIge1xuICAgIG5ldyBEYXRhVmlldyh0aGlzLmJ1ZmZlciwgdGhpcy5ieXRlT2Zmc2V0LCB0aGlzLmJ5dGVMZW5ndGgpLnNldEludDMyKFxuICAgICAgb2Zmc2V0LFxuICAgICAgdmFsdWUsXG4gICAgICB0cnVlLFxuICAgICk7XG4gICAgcmV0dXJuIG9mZnNldCArIDQ7XG4gIH1cblxuICB3cml0ZVVJbnQ4KHZhbHVlOiBudW1iZXIsIG9mZnNldCA9IDApOiBudW1iZXIge1xuICAgIG5ldyBEYXRhVmlldyh0aGlzLmJ1ZmZlciwgdGhpcy5ieXRlT2Zmc2V0LCB0aGlzLmJ5dGVMZW5ndGgpLnNldFVpbnQ4KFxuICAgICAgb2Zmc2V0LFxuICAgICAgdmFsdWUsXG4gICAgKTtcbiAgICByZXR1cm4gb2Zmc2V0ICsgMTtcbiAgfVxuXG4gIHdyaXRlVUludDE2QkUodmFsdWU6IG51bWJlciwgb2Zmc2V0ID0gMCk6IG51bWJlciB7XG4gICAgbmV3IERhdGFWaWV3KHRoaXMuYnVmZmVyLCB0aGlzLmJ5dGVPZmZzZXQsIHRoaXMuYnl0ZUxlbmd0aCkuc2V0VWludDE2KFxuICAgICAgb2Zmc2V0LFxuICAgICAgdmFsdWUsXG4gICAgKTtcbiAgICByZXR1cm4gb2Zmc2V0ICsgMjtcbiAgfVxuICB3cml0ZVVJbnQxNkxFKHZhbHVlOiBudW1iZXIsIG9mZnNldCA9IDApOiBudW1iZXIge1xuICAgIG5ldyBEYXRhVmlldyh0aGlzLmJ1ZmZlciwgdGhpcy5ieXRlT2Zmc2V0LCB0aGlzLmJ5dGVMZW5ndGgpLnNldFVpbnQxNihcbiAgICAgIG9mZnNldCxcbiAgICAgIHZhbHVlLFxuICAgICAgdHJ1ZSxcbiAgICApO1xuICAgIHJldHVybiBvZmZzZXQgKyAyO1xuICB9XG5cbiAgd3JpdGVVSW50MzJCRSh2YWx1ZTogbnVtYmVyLCBvZmZzZXQgPSAwKTogbnVtYmVyIHtcbiAgICBuZXcgRGF0YVZpZXcodGhpcy5idWZmZXIsIHRoaXMuYnl0ZU9mZnNldCwgdGhpcy5ieXRlTGVuZ3RoKS5zZXRVaW50MzIoXG4gICAgICBvZmZzZXQsXG4gICAgICB2YWx1ZSxcbiAgICApO1xuICAgIHJldHVybiBvZmZzZXQgKyA0O1xuICB9XG4gIHdyaXRlVUludDMyTEUodmFsdWU6IG51bWJlciwgb2Zmc2V0ID0gMCk6IG51bWJlciB7XG4gICAgbmV3IERhdGFWaWV3KHRoaXMuYnVmZmVyLCB0aGlzLmJ5dGVPZmZzZXQsIHRoaXMuYnl0ZUxlbmd0aCkuc2V0VWludDMyKFxuICAgICAgb2Zmc2V0LFxuICAgICAgdmFsdWUsXG4gICAgICB0cnVlLFxuICAgICk7XG4gICAgcmV0dXJuIG9mZnNldCArIDQ7XG4gIH1cbn1cblxuZXhwb3J0IGNvbnN0IGtNYXhMZW5ndGggPSA0Mjk0OTY3Mjk2O1xuZXhwb3J0IGNvbnN0IGtTdHJpbmdNYXhMZW5ndGggPSA1MzY4NzA4ODg7XG5leHBvcnQgY29uc3QgY29uc3RhbnRzID0ge1xuICBNQVhfTEVOR1RIOiBrTWF4TGVuZ3RoLFxuICBNQVhfU1RSSU5HX0xFTkdUSDoga1N0cmluZ01heExlbmd0aCxcbn07XG5cbmV4cG9ydCBjb25zdCBhdG9iID0gZ2xvYmFsVGhpcy5hdG9iO1xuZXhwb3J0IGNvbnN0IGJ0b2EgPSBnbG9iYWxUaGlzLmJ0b2E7XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgQnVmZmVyLFxuICBrTWF4TGVuZ3RoLFxuICBrU3RyaW5nTWF4TGVuZ3RoLFxuICBjb25zdGFudHMsXG4gIGF0b2IsXG4gIGJ0b2EsXG59O1xuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEVBQTBFLEFBQTFFLHdFQUEwRTtBQUMxRSxNQUFNLE1BQU0sR0FBRyxNQUFNLENBQW9CO0FBQ3pDLE1BQU0sTUFBTSxNQUFNLE1BQU0sQ0FB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