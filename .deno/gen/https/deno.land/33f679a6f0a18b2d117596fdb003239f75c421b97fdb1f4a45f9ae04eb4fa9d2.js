import { Buffer } from "./buffer.ts";
import { copy as copyBytes } from "../bytes/mod.ts";
import { assert } from "../testing/asserts.ts";
const DEFAULT_BUFFER_SIZE = 32 * 1024;
/** Read Reader `r` until EOF (`null`) and resolve to the content as
 * Uint8Array`.
 *
 * ```ts
 * import { readAll } from "./util.ts";
 * import { Buffer } from "./buffer.ts";
 *
 * // Example from stdin
 * const stdinContent = await readAll(Deno.stdin);
 *
 * // Example from file
 * const file = await Deno.open("my_file.txt", {read: true});
 * const myFileContent = await readAll(file);
 * Deno.close(file.rid);
 *
 * // Example from buffer
 * const myData = new Uint8Array(100);
 * // ... fill myData array with data
 * const reader = new Buffer(myData.buffer);
 * const bufferContent = await readAll(reader);
 * ```
 */ export async function readAll(r) {
    const buf = new Buffer();
    await buf.readFrom(r);
    return buf.bytes();
}
/** Synchronously reads Reader `r` until EOF (`null`) and returns the content
 * as `Uint8Array`.
 *
 * ```ts
 * import { readAllSync } from "./util.ts";
 * import { Buffer } from "./buffer.ts";
 *
 * // Example from stdin
 * const stdinContent = readAllSync(Deno.stdin);
 *
 * // Example from file
 * const file = Deno.openSync("my_file.txt", {read: true});
 * const myFileContent = readAllSync(file);
 * Deno.close(file.rid);
 *
 * // Example from buffer
 * const myData = new Uint8Array(100);
 * // ... fill myData array with data
 * const reader = new Buffer(myData.buffer);
 * const bufferContent = readAllSync(reader);
 * ```
 */ export function readAllSync(r) {
    const buf = new Buffer();
    buf.readFromSync(r);
    return buf.bytes();
}
/**
 * Read a range of bytes from a file or other resource that is readable and
 * seekable.  The range start and end are inclusive of the bytes within that
 * range.
 *
 * ```ts
 * import { assertEquals } from "../testing/asserts.ts";
 * import { readRange } from "./util.ts";
 *
 * // Read the first 10 bytes of a file
 * const file = await Deno.open("example.txt", { read: true });
 * const bytes = await readRange(file, { start: 0, end: 9 });
 * assertEquals(bytes.length, 10);
 * ```
 */ export async function readRange(r, range) {
    // byte ranges are inclusive, so we have to add one to the end
    let length = range.end - range.start + 1;
    assert(length > 0, "Invalid byte range was passed.");
    await r.seek(range.start, Deno.SeekMode.Start);
    const result = new Uint8Array(length);
    let off = 0;
    while(length){
        const p = new Uint8Array(Math.min(length, DEFAULT_BUFFER_SIZE));
        const nread = await r.read(p);
        assert(nread !== null, "Unexpected EOF reach while reading a range.");
        assert(nread > 0, "Unexpected read of 0 bytes while reading a range.");
        copyBytes(p, result, off);
        off += nread;
        length -= nread;
        assert(length >= 0, "Unexpected length remaining after reading range.");
    }
    return result;
}
/**
 * Read a range of bytes synchronously from a file or other resource that is
 * readable and seekable.  The range start and end are inclusive of the bytes
 * within that range.
 *
 * ```ts
 * import { assertEquals } from "../testing/asserts.ts";
 * import { readRangeSync } from "./util.ts";
 *
 * // Read the first 10 bytes of a file
 * const file = Deno.openSync("example.txt", { read: true });
 * const bytes = readRangeSync(file, { start: 0, end: 9 });
 * assertEquals(bytes.length, 10);
 * ```
 */ export function readRangeSync(r, range) {
    // byte ranges are inclusive, so we have to add one to the end
    let length = range.end - range.start + 1;
    assert(length > 0, "Invalid byte range was passed.");
    r.seekSync(range.start, Deno.SeekMode.Start);
    const result = new Uint8Array(length);
    let off = 0;
    while(length){
        const p = new Uint8Array(Math.min(length, DEFAULT_BUFFER_SIZE));
        const nread = r.readSync(p);
        assert(nread !== null, "Unexpected EOF reach while reading a range.");
        assert(nread > 0, "Unexpected read of 0 bytes while reading a range.");
        copyBytes(p, result, off);
        off += nread;
        length -= nread;
        assert(length >= 0, "Unexpected length remaining after reading range.");
    }
    return result;
}
/** Write all the content of the array buffer (`arr`) to the writer (`w`).
 *
 * ```ts
 * import { Buffer } from "./buffer.ts";
 * import { writeAll } from "./util.ts";

 * // Example writing to stdout
 * let contentBytes = new TextEncoder().encode("Hello World");
 * await writeAll(Deno.stdout, contentBytes);
 *
 * // Example writing to file
 * contentBytes = new TextEncoder().encode("Hello World");
 * const file = await Deno.open('test.file', {write: true});
 * await writeAll(file, contentBytes);
 * Deno.close(file.rid);
 *
 * // Example writing to buffer
 * contentBytes = new TextEncoder().encode("Hello World");
 * const writer = new Buffer();
 * await writeAll(writer, contentBytes);
 * console.log(writer.bytes().length);  // 11
 * ```
 */ export async function writeAll(w, arr) {
    let nwritten = 0;
    while(nwritten < arr.length){
        nwritten += await w.write(arr.subarray(nwritten));
    }
}
/** Synchronously write all the content of the array buffer (`arr`) to the
 * writer (`w`).
 *
 * ```ts
 * import { Buffer } from "./buffer.ts";
 * import { writeAllSync } from "./util.ts";
 *
 * // Example writing to stdout
 * let contentBytes = new TextEncoder().encode("Hello World");
 * writeAllSync(Deno.stdout, contentBytes);
 *
 * // Example writing to file
 * contentBytes = new TextEncoder().encode("Hello World");
 * const file = Deno.openSync('test.file', {write: true});
 * writeAllSync(file, contentBytes);
 * Deno.close(file.rid);
 *
 * // Example writing to buffer
 * contentBytes = new TextEncoder().encode("Hello World");
 * const writer = new Buffer();
 * writeAllSync(writer, contentBytes);
 * console.log(writer.bytes().length);  // 11
 * ```
 */ export function writeAllSync(w, arr) {
    let nwritten = 0;
    while(nwritten < arr.length){
        nwritten += w.writeSync(arr.subarray(nwritten));
    }
}
/** Turns a Reader, `r`, into an async iterator.
 *
 * ```ts
 * import { iter } from "./util.ts";
 *
 * let f = await Deno.open("/etc/passwd");
 * for await (const chunk of iter(f)) {
 *   console.log(chunk);
 * }
 * f.close();
 * ```
 *
 * Second argument can be used to tune size of a buffer.
 * Default size of the buffer is 32kB.
 *
 * ```ts
 * import { iter } from "./util.ts";
 *
 * let f = await Deno.open("/etc/passwd");
 * const it = iter(f, {
 *   bufSize: 1024 * 1024
 * });
 * for await (const chunk of it) {
 *   console.log(chunk);
 * }
 * f.close();
 * ```
 *
 * Iterator uses an internal buffer of fixed size for efficiency; it returns
 * a view on that buffer on each iteration. It is therefore caller's
 * responsibility to copy contents of the buffer if needed; otherwise the
 * next iteration will overwrite contents of previously returned chunk.
 */ export async function* iter(r, options) {
    const bufSize = options?.bufSize ?? DEFAULT_BUFFER_SIZE;
    const b = new Uint8Array(bufSize);
    while(true){
        const result = await r.read(b);
        if (result === null) {
            break;
        }
        yield b.subarray(0, result);
    }
}
/** Turns a ReaderSync, `r`, into an iterator.
 *
 * ```ts
 * import { iterSync } from "./util.ts";
 *
 * let f = Deno.openSync("/etc/passwd");
 * for (const chunk of iterSync(f)) {
 *   console.log(chunk);
 * }
 * f.close();
 * ```
 *
 * Second argument can be used to tune size of a buffer.
 * Default size of the buffer is 32kB.
 *
 * ```ts
 * import { iterSync } from "./util.ts";

 * let f = await Deno.open("/etc/passwd");
 * const iter = iterSync(f, {
 *   bufSize: 1024 * 1024
 * });
 * for (const chunk of iter) {
 *   console.log(chunk);
 * }
 * f.close();
 * ```
 *
 * Iterator uses an internal buffer of fixed size for efficiency; it returns
 * a view on that buffer on each iteration. It is therefore caller's
 * responsibility to copy contents of the buffer if needed; otherwise the
 * next iteration will overwrite contents of previously returned chunk.
 */ export function* iterSync(r, options) {
    const bufSize = options?.bufSize ?? DEFAULT_BUFFER_SIZE;
    const b = new Uint8Array(bufSize);
    while(true){
        const result = r.readSync(b);
        if (result === null) {
            break;
        }
        yield b.subarray(0, result);
    }
}
/** Copies from `src` to `dst` until either EOF (`null`) is read from `src` or
 * an error occurs. It resolves to the number of bytes copied or rejects with
 * the first error encountered while copying.
 *
 * ```ts
 * import { copy } from "./util.ts";
 *
 * const source = await Deno.open("my_file.txt");
 * const bytesCopied1 = await copy(source, Deno.stdout);
 * const destination = await Deno.create("my_file_2.txt");
 * const bytesCopied2 = await copy(source, destination);
 * ```
 *
 * @param src The source to copy from
 * @param dst The destination to copy to
 * @param options Can be used to tune size of the buffer. Default size is 32kB
 */ export async function copy(src, dst, options) {
    let n = 0;
    const bufSize = options?.bufSize ?? DEFAULT_BUFFER_SIZE;
    const b = new Uint8Array(bufSize);
    let gotEOF = false;
    while(gotEOF === false){
        const result = await src.read(b);
        if (result === null) {
            gotEOF = true;
        } else {
            let nwritten = 0;
            while(nwritten < result){
                nwritten += await dst.write(b.subarray(nwritten, result));
            }
            n += nwritten;
        }
    }
    return n;
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEwOS4wL2lvL3V0aWwudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcIi4vYnVmZmVyLnRzXCI7XG5pbXBvcnQgeyBjb3B5IGFzIGNvcHlCeXRlcyB9IGZyb20gXCIuLi9ieXRlcy9tb2QudHNcIjtcbmltcG9ydCB7IGFzc2VydCB9IGZyb20gXCIuLi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcblxuY29uc3QgREVGQVVMVF9CVUZGRVJfU0laRSA9IDMyICogMTAyNDtcblxuLyoqIFJlYWQgUmVhZGVyIGByYCB1bnRpbCBFT0YgKGBudWxsYCkgYW5kIHJlc29sdmUgdG8gdGhlIGNvbnRlbnQgYXNcbiAqIFVpbnQ4QXJyYXlgLlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyByZWFkQWxsIH0gZnJvbSBcIi4vdXRpbC50c1wiO1xuICogaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcIi4vYnVmZmVyLnRzXCI7XG4gKlxuICogLy8gRXhhbXBsZSBmcm9tIHN0ZGluXG4gKiBjb25zdCBzdGRpbkNvbnRlbnQgPSBhd2FpdCByZWFkQWxsKERlbm8uc3RkaW4pO1xuICpcbiAqIC8vIEV4YW1wbGUgZnJvbSBmaWxlXG4gKiBjb25zdCBmaWxlID0gYXdhaXQgRGVuby5vcGVuKFwibXlfZmlsZS50eHRcIiwge3JlYWQ6IHRydWV9KTtcbiAqIGNvbnN0IG15RmlsZUNvbnRlbnQgPSBhd2FpdCByZWFkQWxsKGZpbGUpO1xuICogRGVuby5jbG9zZShmaWxlLnJpZCk7XG4gKlxuICogLy8gRXhhbXBsZSBmcm9tIGJ1ZmZlclxuICogY29uc3QgbXlEYXRhID0gbmV3IFVpbnQ4QXJyYXkoMTAwKTtcbiAqIC8vIC4uLiBmaWxsIG15RGF0YSBhcnJheSB3aXRoIGRhdGFcbiAqIGNvbnN0IHJlYWRlciA9IG5ldyBCdWZmZXIobXlEYXRhLmJ1ZmZlcik7XG4gKiBjb25zdCBidWZmZXJDb250ZW50ID0gYXdhaXQgcmVhZEFsbChyZWFkZXIpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkQWxsKHI6IERlbm8uUmVhZGVyKTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG4gIGNvbnN0IGJ1ZiA9IG5ldyBCdWZmZXIoKTtcbiAgYXdhaXQgYnVmLnJlYWRGcm9tKHIpO1xuICByZXR1cm4gYnVmLmJ5dGVzKCk7XG59XG5cbi8qKiBTeW5jaHJvbm91c2x5IHJlYWRzIFJlYWRlciBgcmAgdW50aWwgRU9GIChgbnVsbGApIGFuZCByZXR1cm5zIHRoZSBjb250ZW50XG4gKiBhcyBgVWludDhBcnJheWAuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IHJlYWRBbGxTeW5jIH0gZnJvbSBcIi4vdXRpbC50c1wiO1xuICogaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcIi4vYnVmZmVyLnRzXCI7XG4gKlxuICogLy8gRXhhbXBsZSBmcm9tIHN0ZGluXG4gKiBjb25zdCBzdGRpbkNvbnRlbnQgPSByZWFkQWxsU3luYyhEZW5vLnN0ZGluKTtcbiAqXG4gKiAvLyBFeGFtcGxlIGZyb20gZmlsZVxuICogY29uc3QgZmlsZSA9IERlbm8ub3BlblN5bmMoXCJteV9maWxlLnR4dFwiLCB7cmVhZDogdHJ1ZX0pO1xuICogY29uc3QgbXlGaWxlQ29udGVudCA9IHJlYWRBbGxTeW5jKGZpbGUpO1xuICogRGVuby5jbG9zZShmaWxlLnJpZCk7XG4gKlxuICogLy8gRXhhbXBsZSBmcm9tIGJ1ZmZlclxuICogY29uc3QgbXlEYXRhID0gbmV3IFVpbnQ4QXJyYXkoMTAwKTtcbiAqIC8vIC4uLiBmaWxsIG15RGF0YSBhcnJheSB3aXRoIGRhdGFcbiAqIGNvbnN0IHJlYWRlciA9IG5ldyBCdWZmZXIobXlEYXRhLmJ1ZmZlcik7XG4gKiBjb25zdCBidWZmZXJDb250ZW50ID0gcmVhZEFsbFN5bmMocmVhZGVyKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZEFsbFN5bmMocjogRGVuby5SZWFkZXJTeW5jKTogVWludDhBcnJheSB7XG4gIGNvbnN0IGJ1ZiA9IG5ldyBCdWZmZXIoKTtcbiAgYnVmLnJlYWRGcm9tU3luYyhyKTtcbiAgcmV0dXJuIGJ1Zi5ieXRlcygpO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJ5dGVSYW5nZSB7XG4gIC8qKiBUaGUgMCBiYXNlZCBpbmRleCBvZiB0aGUgc3RhcnQgYnl0ZSBmb3IgYSByYW5nZS4gKi9cbiAgc3RhcnQ6IG51bWJlcjtcblxuICAvKiogVGhlIDAgYmFzZWQgaW5kZXggb2YgdGhlIGVuZCBieXRlIGZvciBhIHJhbmdlLCB3aGljaCBpcyBpbmNsdXNpdmUuICovXG4gIGVuZDogbnVtYmVyO1xufVxuXG4vKipcbiAqIFJlYWQgYSByYW5nZSBvZiBieXRlcyBmcm9tIGEgZmlsZSBvciBvdGhlciByZXNvdXJjZSB0aGF0IGlzIHJlYWRhYmxlIGFuZFxuICogc2Vla2FibGUuICBUaGUgcmFuZ2Ugc3RhcnQgYW5kIGVuZCBhcmUgaW5jbHVzaXZlIG9mIHRoZSBieXRlcyB3aXRoaW4gdGhhdFxuICogcmFuZ2UuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGFzc2VydEVxdWFscyB9IGZyb20gXCIuLi90ZXN0aW5nL2Fzc2VydHMudHNcIjtcbiAqIGltcG9ydCB7IHJlYWRSYW5nZSB9IGZyb20gXCIuL3V0aWwudHNcIjtcbiAqXG4gKiAvLyBSZWFkIHRoZSBmaXJzdCAxMCBieXRlcyBvZiBhIGZpbGVcbiAqIGNvbnN0IGZpbGUgPSBhd2FpdCBEZW5vLm9wZW4oXCJleGFtcGxlLnR4dFwiLCB7IHJlYWQ6IHRydWUgfSk7XG4gKiBjb25zdCBieXRlcyA9IGF3YWl0IHJlYWRSYW5nZShmaWxlLCB7IHN0YXJ0OiAwLCBlbmQ6IDkgfSk7XG4gKiBhc3NlcnRFcXVhbHMoYnl0ZXMubGVuZ3RoLCAxMCk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRSYW5nZShcbiAgcjogRGVuby5SZWFkZXIgJiBEZW5vLlNlZWtlcixcbiAgcmFuZ2U6IEJ5dGVSYW5nZSxcbik6IFByb21pc2U8VWludDhBcnJheT4ge1xuICAvLyBieXRlIHJhbmdlcyBhcmUgaW5jbHVzaXZlLCBzbyB3ZSBoYXZlIHRvIGFkZCBvbmUgdG8gdGhlIGVuZFxuICBsZXQgbGVuZ3RoID0gcmFuZ2UuZW5kIC0gcmFuZ2Uuc3RhcnQgKyAxO1xuICBhc3NlcnQobGVuZ3RoID4gMCwgXCJJbnZhbGlkIGJ5dGUgcmFuZ2Ugd2FzIHBhc3NlZC5cIik7XG4gIGF3YWl0IHIuc2VlayhyYW5nZS5zdGFydCwgRGVuby5TZWVrTW9kZS5TdGFydCk7XG4gIGNvbnN0IHJlc3VsdCA9IG5ldyBVaW50OEFycmF5KGxlbmd0aCk7XG4gIGxldCBvZmYgPSAwO1xuICB3aGlsZSAobGVuZ3RoKSB7XG4gICAgY29uc3QgcCA9IG5ldyBVaW50OEFycmF5KE1hdGgubWluKGxlbmd0aCwgREVGQVVMVF9CVUZGRVJfU0laRSkpO1xuICAgIGNvbnN0IG5yZWFkID0gYXdhaXQgci5yZWFkKHApO1xuICAgIGFzc2VydChucmVhZCAhPT0gbnVsbCwgXCJVbmV4cGVjdGVkIEVPRiByZWFjaCB3aGlsZSByZWFkaW5nIGEgcmFuZ2UuXCIpO1xuICAgIGFzc2VydChucmVhZCA+IDAsIFwiVW5leHBlY3RlZCByZWFkIG9mIDAgYnl0ZXMgd2hpbGUgcmVhZGluZyBhIHJhbmdlLlwiKTtcbiAgICBjb3B5Qnl0ZXMocCwgcmVzdWx0LCBvZmYpO1xuICAgIG9mZiArPSBucmVhZDtcbiAgICBsZW5ndGggLT0gbnJlYWQ7XG4gICAgYXNzZXJ0KGxlbmd0aCA+PSAwLCBcIlVuZXhwZWN0ZWQgbGVuZ3RoIHJlbWFpbmluZyBhZnRlciByZWFkaW5nIHJhbmdlLlwiKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIFJlYWQgYSByYW5nZSBvZiBieXRlcyBzeW5jaHJvbm91c2x5IGZyb20gYSBmaWxlIG9yIG90aGVyIHJlc291cmNlIHRoYXQgaXNcbiAqIHJlYWRhYmxlIGFuZCBzZWVrYWJsZS4gIFRoZSByYW5nZSBzdGFydCBhbmQgZW5kIGFyZSBpbmNsdXNpdmUgb2YgdGhlIGJ5dGVzXG4gKiB3aXRoaW4gdGhhdCByYW5nZS5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgYXNzZXJ0RXF1YWxzIH0gZnJvbSBcIi4uL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuICogaW1wb3J0IHsgcmVhZFJhbmdlU3luYyB9IGZyb20gXCIuL3V0aWwudHNcIjtcbiAqXG4gKiAvLyBSZWFkIHRoZSBmaXJzdCAxMCBieXRlcyBvZiBhIGZpbGVcbiAqIGNvbnN0IGZpbGUgPSBEZW5vLm9wZW5TeW5jKFwiZXhhbXBsZS50eHRcIiwgeyByZWFkOiB0cnVlIH0pO1xuICogY29uc3QgYnl0ZXMgPSByZWFkUmFuZ2VTeW5jKGZpbGUsIHsgc3RhcnQ6IDAsIGVuZDogOSB9KTtcbiAqIGFzc2VydEVxdWFscyhieXRlcy5sZW5ndGgsIDEwKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZFJhbmdlU3luYyhcbiAgcjogRGVuby5SZWFkZXJTeW5jICYgRGVuby5TZWVrZXJTeW5jLFxuICByYW5nZTogQnl0ZVJhbmdlLFxuKTogVWludDhBcnJheSB7XG4gIC8vIGJ5dGUgcmFuZ2VzIGFyZSBpbmNsdXNpdmUsIHNvIHdlIGhhdmUgdG8gYWRkIG9uZSB0byB0aGUgZW5kXG4gIGxldCBsZW5ndGggPSByYW5nZS5lbmQgLSByYW5nZS5zdGFydCArIDE7XG4gIGFzc2VydChsZW5ndGggPiAwLCBcIkludmFsaWQgYnl0ZSByYW5nZSB3YXMgcGFzc2VkLlwiKTtcbiAgci5zZWVrU3luYyhyYW5nZS5zdGFydCwgRGVuby5TZWVrTW9kZS5TdGFydCk7XG4gIGNvbnN0IHJlc3VsdCA9IG5ldyBVaW50OEFycmF5KGxlbmd0aCk7XG4gIGxldCBvZmYgPSAwO1xuICB3aGlsZSAobGVuZ3RoKSB7XG4gICAgY29uc3QgcCA9IG5ldyBVaW50OEFycmF5KE1hdGgubWluKGxlbmd0aCwgREVGQVVMVF9CVUZGRVJfU0laRSkpO1xuICAgIGNvbnN0IG5yZWFkID0gci5yZWFkU3luYyhwKTtcbiAgICBhc3NlcnQobnJlYWQgIT09IG51bGwsIFwiVW5leHBlY3RlZCBFT0YgcmVhY2ggd2hpbGUgcmVhZGluZyBhIHJhbmdlLlwiKTtcbiAgICBhc3NlcnQobnJlYWQgPiAwLCBcIlVuZXhwZWN0ZWQgcmVhZCBvZiAwIGJ5dGVzIHdoaWxlIHJlYWRpbmcgYSByYW5nZS5cIik7XG4gICAgY29weUJ5dGVzKHAsIHJlc3VsdCwgb2ZmKTtcbiAgICBvZmYgKz0gbnJlYWQ7XG4gICAgbGVuZ3RoIC09IG5yZWFkO1xuICAgIGFzc2VydChsZW5ndGggPj0gMCwgXCJVbmV4cGVjdGVkIGxlbmd0aCByZW1haW5pbmcgYWZ0ZXIgcmVhZGluZyByYW5nZS5cIik7XG4gIH1cbiAgcmV0dXJuIHJlc3VsdDtcbn1cblxuLyoqIFdyaXRlIGFsbCB0aGUgY29udGVudCBvZiB0aGUgYXJyYXkgYnVmZmVyIChgYXJyYCkgdG8gdGhlIHdyaXRlciAoYHdgKS5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcIi4vYnVmZmVyLnRzXCI7XG4gKiBpbXBvcnQgeyB3cml0ZUFsbCB9IGZyb20gXCIuL3V0aWwudHNcIjtcblxuICogLy8gRXhhbXBsZSB3cml0aW5nIHRvIHN0ZG91dFxuICogbGV0IGNvbnRlbnRCeXRlcyA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIkhlbGxvIFdvcmxkXCIpO1xuICogYXdhaXQgd3JpdGVBbGwoRGVuby5zdGRvdXQsIGNvbnRlbnRCeXRlcyk7XG4gKlxuICogLy8gRXhhbXBsZSB3cml0aW5nIHRvIGZpbGVcbiAqIGNvbnRlbnRCeXRlcyA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIkhlbGxvIFdvcmxkXCIpO1xuICogY29uc3QgZmlsZSA9IGF3YWl0IERlbm8ub3BlbigndGVzdC5maWxlJywge3dyaXRlOiB0cnVlfSk7XG4gKiBhd2FpdCB3cml0ZUFsbChmaWxlLCBjb250ZW50Qnl0ZXMpO1xuICogRGVuby5jbG9zZShmaWxlLnJpZCk7XG4gKlxuICogLy8gRXhhbXBsZSB3cml0aW5nIHRvIGJ1ZmZlclxuICogY29udGVudEJ5dGVzID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiSGVsbG8gV29ybGRcIik7XG4gKiBjb25zdCB3cml0ZXIgPSBuZXcgQnVmZmVyKCk7XG4gKiBhd2FpdCB3cml0ZUFsbCh3cml0ZXIsIGNvbnRlbnRCeXRlcyk7XG4gKiBjb25zb2xlLmxvZyh3cml0ZXIuYnl0ZXMoKS5sZW5ndGgpOyAgLy8gMTFcbiAqIGBgYFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd3JpdGVBbGwodzogRGVuby5Xcml0ZXIsIGFycjogVWludDhBcnJheSkge1xuICBsZXQgbndyaXR0ZW4gPSAwO1xuICB3aGlsZSAobndyaXR0ZW4gPCBhcnIubGVuZ3RoKSB7XG4gICAgbndyaXR0ZW4gKz0gYXdhaXQgdy53cml0ZShhcnIuc3ViYXJyYXkobndyaXR0ZW4pKTtcbiAgfVxufVxuXG4vKiogU3luY2hyb25vdXNseSB3cml0ZSBhbGwgdGhlIGNvbnRlbnQgb2YgdGhlIGFycmF5IGJ1ZmZlciAoYGFycmApIHRvIHRoZVxuICogd3JpdGVyIChgd2ApLlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiLi9idWZmZXIudHNcIjtcbiAqIGltcG9ydCB7IHdyaXRlQWxsU3luYyB9IGZyb20gXCIuL3V0aWwudHNcIjtcbiAqXG4gKiAvLyBFeGFtcGxlIHdyaXRpbmcgdG8gc3Rkb3V0XG4gKiBsZXQgY29udGVudEJ5dGVzID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiSGVsbG8gV29ybGRcIik7XG4gKiB3cml0ZUFsbFN5bmMoRGVuby5zdGRvdXQsIGNvbnRlbnRCeXRlcyk7XG4gKlxuICogLy8gRXhhbXBsZSB3cml0aW5nIHRvIGZpbGVcbiAqIGNvbnRlbnRCeXRlcyA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIkhlbGxvIFdvcmxkXCIpO1xuICogY29uc3QgZmlsZSA9IERlbm8ub3BlblN5bmMoJ3Rlc3QuZmlsZScsIHt3cml0ZTogdHJ1ZX0pO1xuICogd3JpdGVBbGxTeW5jKGZpbGUsIGNvbnRlbnRCeXRlcyk7XG4gKiBEZW5vLmNsb3NlKGZpbGUucmlkKTtcbiAqXG4gKiAvLyBFeGFtcGxlIHdyaXRpbmcgdG8gYnVmZmVyXG4gKiBjb250ZW50Qnl0ZXMgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJIZWxsbyBXb3JsZFwiKTtcbiAqIGNvbnN0IHdyaXRlciA9IG5ldyBCdWZmZXIoKTtcbiAqIHdyaXRlQWxsU3luYyh3cml0ZXIsIGNvbnRlbnRCeXRlcyk7XG4gKiBjb25zb2xlLmxvZyh3cml0ZXIuYnl0ZXMoKS5sZW5ndGgpOyAgLy8gMTFcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVBbGxTeW5jKHc6IERlbm8uV3JpdGVyU3luYywgYXJyOiBVaW50OEFycmF5KTogdm9pZCB7XG4gIGxldCBud3JpdHRlbiA9IDA7XG4gIHdoaWxlIChud3JpdHRlbiA8IGFyci5sZW5ndGgpIHtcbiAgICBud3JpdHRlbiArPSB3LndyaXRlU3luYyhhcnIuc3ViYXJyYXkobndyaXR0ZW4pKTtcbiAgfVxufVxuXG4vKiogVHVybnMgYSBSZWFkZXIsIGByYCwgaW50byBhbiBhc3luYyBpdGVyYXRvci5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgaXRlciB9IGZyb20gXCIuL3V0aWwudHNcIjtcbiAqXG4gKiBsZXQgZiA9IGF3YWl0IERlbm8ub3BlbihcIi9ldGMvcGFzc3dkXCIpO1xuICogZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiBpdGVyKGYpKSB7XG4gKiAgIGNvbnNvbGUubG9nKGNodW5rKTtcbiAqIH1cbiAqIGYuY2xvc2UoKTtcbiAqIGBgYFxuICpcbiAqIFNlY29uZCBhcmd1bWVudCBjYW4gYmUgdXNlZCB0byB0dW5lIHNpemUgb2YgYSBidWZmZXIuXG4gKiBEZWZhdWx0IHNpemUgb2YgdGhlIGJ1ZmZlciBpcyAzMmtCLlxuICpcbiAqIGBgYHRzXG4gKiBpbXBvcnQgeyBpdGVyIH0gZnJvbSBcIi4vdXRpbC50c1wiO1xuICpcbiAqIGxldCBmID0gYXdhaXQgRGVuby5vcGVuKFwiL2V0Yy9wYXNzd2RcIik7XG4gKiBjb25zdCBpdCA9IGl0ZXIoZiwge1xuICogICBidWZTaXplOiAxMDI0ICogMTAyNFxuICogfSk7XG4gKiBmb3IgYXdhaXQgKGNvbnN0IGNodW5rIG9mIGl0KSB7XG4gKiAgIGNvbnNvbGUubG9nKGNodW5rKTtcbiAqIH1cbiAqIGYuY2xvc2UoKTtcbiAqIGBgYFxuICpcbiAqIEl0ZXJhdG9yIHVzZXMgYW4gaW50ZXJuYWwgYnVmZmVyIG9mIGZpeGVkIHNpemUgZm9yIGVmZmljaWVuY3k7IGl0IHJldHVybnNcbiAqIGEgdmlldyBvbiB0aGF0IGJ1ZmZlciBvbiBlYWNoIGl0ZXJhdGlvbi4gSXQgaXMgdGhlcmVmb3JlIGNhbGxlcidzXG4gKiByZXNwb25zaWJpbGl0eSB0byBjb3B5IGNvbnRlbnRzIG9mIHRoZSBidWZmZXIgaWYgbmVlZGVkOyBvdGhlcndpc2UgdGhlXG4gKiBuZXh0IGl0ZXJhdGlvbiB3aWxsIG92ZXJ3cml0ZSBjb250ZW50cyBvZiBwcmV2aW91c2x5IHJldHVybmVkIGNodW5rLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24qIGl0ZXIoXG4gIHI6IERlbm8uUmVhZGVyLFxuICBvcHRpb25zPzoge1xuICAgIGJ1ZlNpemU/OiBudW1iZXI7XG4gIH0sXG4pOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8VWludDhBcnJheT4ge1xuICBjb25zdCBidWZTaXplID0gb3B0aW9ucz8uYnVmU2l6ZSA/PyBERUZBVUxUX0JVRkZFUl9TSVpFO1xuICBjb25zdCBiID0gbmV3IFVpbnQ4QXJyYXkoYnVmU2l6ZSk7XG4gIHdoaWxlICh0cnVlKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgci5yZWFkKGIpO1xuICAgIGlmIChyZXN1bHQgPT09IG51bGwpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHlpZWxkIGIuc3ViYXJyYXkoMCwgcmVzdWx0KTtcbiAgfVxufVxuXG4vKiogVHVybnMgYSBSZWFkZXJTeW5jLCBgcmAsIGludG8gYW4gaXRlcmF0b3IuXG4gKlxuICogYGBgdHNcbiAqIGltcG9ydCB7IGl0ZXJTeW5jIH0gZnJvbSBcIi4vdXRpbC50c1wiO1xuICpcbiAqIGxldCBmID0gRGVuby5vcGVuU3luYyhcIi9ldGMvcGFzc3dkXCIpO1xuICogZm9yIChjb25zdCBjaHVuayBvZiBpdGVyU3luYyhmKSkge1xuICogICBjb25zb2xlLmxvZyhjaHVuayk7XG4gKiB9XG4gKiBmLmNsb3NlKCk7XG4gKiBgYGBcbiAqXG4gKiBTZWNvbmQgYXJndW1lbnQgY2FuIGJlIHVzZWQgdG8gdHVuZSBzaXplIG9mIGEgYnVmZmVyLlxuICogRGVmYXVsdCBzaXplIG9mIHRoZSBidWZmZXIgaXMgMzJrQi5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgaXRlclN5bmMgfSBmcm9tIFwiLi91dGlsLnRzXCI7XG5cbiAqIGxldCBmID0gYXdhaXQgRGVuby5vcGVuKFwiL2V0Yy9wYXNzd2RcIik7XG4gKiBjb25zdCBpdGVyID0gaXRlclN5bmMoZiwge1xuICogICBidWZTaXplOiAxMDI0ICogMTAyNFxuICogfSk7XG4gKiBmb3IgKGNvbnN0IGNodW5rIG9mIGl0ZXIpIHtcbiAqICAgY29uc29sZS5sb2coY2h1bmspO1xuICogfVxuICogZi5jbG9zZSgpO1xuICogYGBgXG4gKlxuICogSXRlcmF0b3IgdXNlcyBhbiBpbnRlcm5hbCBidWZmZXIgb2YgZml4ZWQgc2l6ZSBmb3IgZWZmaWNpZW5jeTsgaXQgcmV0dXJuc1xuICogYSB2aWV3IG9uIHRoYXQgYnVmZmVyIG9uIGVhY2ggaXRlcmF0aW9uLiBJdCBpcyB0aGVyZWZvcmUgY2FsbGVyJ3NcbiAqIHJlc3BvbnNpYmlsaXR5IHRvIGNvcHkgY29udGVudHMgb2YgdGhlIGJ1ZmZlciBpZiBuZWVkZWQ7IG90aGVyd2lzZSB0aGVcbiAqIG5leHQgaXRlcmF0aW9uIHdpbGwgb3ZlcndyaXRlIGNvbnRlbnRzIG9mIHByZXZpb3VzbHkgcmV0dXJuZWQgY2h1bmsuXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiogaXRlclN5bmMoXG4gIHI6IERlbm8uUmVhZGVyU3luYyxcbiAgb3B0aW9ucz86IHtcbiAgICBidWZTaXplPzogbnVtYmVyO1xuICB9LFxuKTogSXRlcmFibGVJdGVyYXRvcjxVaW50OEFycmF5PiB7XG4gIGNvbnN0IGJ1ZlNpemUgPSBvcHRpb25zPy5idWZTaXplID8/IERFRkFVTFRfQlVGRkVSX1NJWkU7XG4gIGNvbnN0IGIgPSBuZXcgVWludDhBcnJheShidWZTaXplKTtcbiAgd2hpbGUgKHRydWUpIHtcbiAgICBjb25zdCByZXN1bHQgPSByLnJlYWRTeW5jKGIpO1xuICAgIGlmIChyZXN1bHQgPT09IG51bGwpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHlpZWxkIGIuc3ViYXJyYXkoMCwgcmVzdWx0KTtcbiAgfVxufVxuXG4vKiogQ29waWVzIGZyb20gYHNyY2AgdG8gYGRzdGAgdW50aWwgZWl0aGVyIEVPRiAoYG51bGxgKSBpcyByZWFkIGZyb20gYHNyY2Agb3JcbiAqIGFuIGVycm9yIG9jY3Vycy4gSXQgcmVzb2x2ZXMgdG8gdGhlIG51bWJlciBvZiBieXRlcyBjb3BpZWQgb3IgcmVqZWN0cyB3aXRoXG4gKiB0aGUgZmlyc3QgZXJyb3IgZW5jb3VudGVyZWQgd2hpbGUgY29weWluZy5cbiAqXG4gKiBgYGB0c1xuICogaW1wb3J0IHsgY29weSB9IGZyb20gXCIuL3V0aWwudHNcIjtcbiAqXG4gKiBjb25zdCBzb3VyY2UgPSBhd2FpdCBEZW5vLm9wZW4oXCJteV9maWxlLnR4dFwiKTtcbiAqIGNvbnN0IGJ5dGVzQ29waWVkMSA9IGF3YWl0IGNvcHkoc291cmNlLCBEZW5vLnN0ZG91dCk7XG4gKiBjb25zdCBkZXN0aW5hdGlvbiA9IGF3YWl0IERlbm8uY3JlYXRlKFwibXlfZmlsZV8yLnR4dFwiKTtcbiAqIGNvbnN0IGJ5dGVzQ29waWVkMiA9IGF3YWl0IGNvcHkoc291cmNlLCBkZXN0aW5hdGlvbik7XG4gKiBgYGBcbiAqXG4gKiBAcGFyYW0gc3JjIFRoZSBzb3VyY2UgdG8gY29weSBmcm9tXG4gKiBAcGFyYW0gZHN0IFRoZSBkZXN0aW5hdGlvbiB0byBjb3B5IHRvXG4gKiBAcGFyYW0gb3B0aW9ucyBDYW4gYmUgdXNlZCB0byB0dW5lIHNpemUgb2YgdGhlIGJ1ZmZlci4gRGVmYXVsdCBzaXplIGlzIDMya0JcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIGNvcHkoXG4gIHNyYzogRGVuby5SZWFkZXIsXG4gIGRzdDogRGVuby5Xcml0ZXIsXG4gIG9wdGlvbnM/OiB7XG4gICAgYnVmU2l6ZT86IG51bWJlcjtcbiAgfSxcbik6IFByb21pc2U8bnVtYmVyPiB7XG4gIGxldCBuID0gMDtcbiAgY29uc3QgYnVmU2l6ZSA9IG9wdGlvbnM/LmJ1ZlNpemUgPz8gREVGQVVMVF9CVUZGRVJfU0laRTtcbiAgY29uc3QgYiA9IG5ldyBVaW50OEFycmF5KGJ1ZlNpemUpO1xuICBsZXQgZ290RU9GID0gZmFsc2U7XG4gIHdoaWxlIChnb3RFT0YgPT09IGZhbHNlKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgc3JjLnJlYWQoYik7XG4gICAgaWYgKHJlc3VsdCA9PT0gbnVsbCkge1xuICAgICAgZ290RU9GID0gdHJ1ZTtcbiAgICB9IGVsc2Uge1xuICAgICAgbGV0IG53cml0dGVuID0gMDtcbiAgICAgIHdoaWxlIChud3JpdHRlbiA8IHJlc3VsdCkge1xuICAgICAgICBud3JpdHRlbiArPSBhd2FpdCBkc3Qud3JpdGUoYi5zdWJhcnJheShud3JpdHRlbiwgcmVzdWx0KSk7XG4gICAgICB9XG4gICAgICBuICs9IG53cml0dGVuO1xuICAgIH1cbiAgfVxuICByZXR1cm4gbjtcbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLEdBQUcsTUFBTSxRQUFRLENBQWE7QUFDcEMsTUFBTSxHQUFHLElBQUksSUFBSSxTQUFTLFFBQVEsQ0FBaUI7QUFDbkQsTUFBTSxHQUFHLE1BQU0sUUFBUSxDQUF1QjtB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