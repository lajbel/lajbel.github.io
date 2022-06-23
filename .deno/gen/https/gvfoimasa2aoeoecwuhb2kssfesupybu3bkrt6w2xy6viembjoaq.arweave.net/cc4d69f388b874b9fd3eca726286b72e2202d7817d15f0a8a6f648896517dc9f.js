import { Buffer } from "./buffer.ts";
import { copy } from "../bytes/mod.ts";
import { assert } from "../testing/asserts.ts";
const DEFAULT_BUFFER_SIZE = 32 * 1024;
/** Read Reader `r` until EOF (`null`) and resolve to the content as
 * Uint8Array`.
 *
 * ```ts
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
 * // Read the first 10 bytes of a file
 * const file = await Deno.open("example.txt", { read: true });
 * const bytes = await readRange(file, { start: 0, end: 9 });
 * assert(bytes.length, 10);
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
        copy(p, result, off);
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
 * // Read the first 10 bytes of a file
 * const file = Deno.openSync("example.txt", { read: true });
 * const bytes = readRangeSync(file, { start: 0, end: 9 });
 * assert(bytes.length, 10);
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
        copy(p, result, off);
        off += nread;
        length -= nread;
        assert(length >= 0, "Unexpected length remaining after reading range.");
    }
    return result;
}
/** Write all the content of the array buffer (`arr`) to the writer (`w`).
 *
 * ```ts
 * // Example writing to stdout
 * const contentBytes = new TextEncoder().encode("Hello World");
 * await writeAll(Deno.stdout, contentBytes);
 *
 * // Example writing to file
 * const contentBytes = new TextEncoder().encode("Hello World");
 * const file = await Deno.open('test.file', {write: true});
 * await writeAll(file, contentBytes);
 * Deno.close(file.rid);
 *
 * // Example writing to buffer
 * const contentBytes = new TextEncoder().encode("Hello World");
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
 * // Example writing to stdout
 * const contentBytes = new TextEncoder().encode("Hello World");
 * writeAllSync(Deno.stdout, contentBytes);
 *
 * // Example writing to file
 * const contentBytes = new TextEncoder().encode("Hello World");
 * const file = Deno.openSync('test.file', {write: true});
 * writeAllSync(file, contentBytes);
 * Deno.close(file.rid);
 *
 * // Example writing to buffer
 * const contentBytes = new TextEncoder().encode("Hello World");
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
 * let f = await Deno.open("/etc/passwd");
 * const iter = iter(f, {
 *   bufSize: 1024 * 1024
 * });
 * for await (const chunk of iter) {
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZ3Zmb2ltYXNhMmFvZW9lY3d1aGIya3NzZmVzdXB5YnUzYmtydDZ3Mnh5NnZpZW1iam9hcS5hcndlYXZlLm5ldC9OVXJrTUJJR2dPSTRnclVPSFNwU0tTVkg0RFRZVlJuNjJyNDlWQkdCUzRFL2lvL3V0aWwudHMiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQnVmZmVyIH0gZnJvbSBcIi4vYnVmZmVyLnRzXCI7XG5pbXBvcnQgeyBjb3B5IH0gZnJvbSBcIi4uL2J5dGVzL21vZC50c1wiO1xuaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcIi4uL3Rlc3RpbmcvYXNzZXJ0cy50c1wiO1xuXG5jb25zdCBERUZBVUxUX0JVRkZFUl9TSVpFID0gMzIgKiAxMDI0O1xuXG4vKiogUmVhZCBSZWFkZXIgYHJgIHVudGlsIEVPRiAoYG51bGxgKSBhbmQgcmVzb2x2ZSB0byB0aGUgY29udGVudCBhc1xuICogVWludDhBcnJheWAuXG4gKlxuICogYGBgdHNcbiAqXG4gKiAvLyBFeGFtcGxlIGZyb20gc3RkaW5cbiAqIGNvbnN0IHN0ZGluQ29udGVudCA9IGF3YWl0IHJlYWRBbGwoRGVuby5zdGRpbik7XG4gKlxuICogLy8gRXhhbXBsZSBmcm9tIGZpbGVcbiAqIGNvbnN0IGZpbGUgPSBhd2FpdCBEZW5vLm9wZW4oXCJteV9maWxlLnR4dFwiLCB7cmVhZDogdHJ1ZX0pO1xuICogY29uc3QgbXlGaWxlQ29udGVudCA9IGF3YWl0IHJlYWRBbGwoZmlsZSk7XG4gKiBEZW5vLmNsb3NlKGZpbGUucmlkKTtcbiAqXG4gKiAvLyBFeGFtcGxlIGZyb20gYnVmZmVyXG4gKiBjb25zdCBteURhdGEgPSBuZXcgVWludDhBcnJheSgxMDApO1xuICogLy8gLi4uIGZpbGwgbXlEYXRhIGFycmF5IHdpdGggZGF0YVxuICogY29uc3QgcmVhZGVyID0gbmV3IEJ1ZmZlcihteURhdGEuYnVmZmVyKTtcbiAqIGNvbnN0IGJ1ZmZlckNvbnRlbnQgPSBhd2FpdCByZWFkQWxsKHJlYWRlcik7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHJlYWRBbGwocjogRGVuby5SZWFkZXIpOiBQcm9taXNlPFVpbnQ4QXJyYXk+IHtcbiAgY29uc3QgYnVmID0gbmV3IEJ1ZmZlcigpO1xuICBhd2FpdCBidWYucmVhZEZyb20ocik7XG4gIHJldHVybiBidWYuYnl0ZXMoKTtcbn1cblxuLyoqIFN5bmNocm9ub3VzbHkgcmVhZHMgUmVhZGVyIGByYCB1bnRpbCBFT0YgKGBudWxsYCkgYW5kIHJldHVybnMgdGhlIGNvbnRlbnRcbiAqIGFzIGBVaW50OEFycmF5YC5cbiAqXG4gKiBgYGB0c1xuICogLy8gRXhhbXBsZSBmcm9tIHN0ZGluXG4gKiBjb25zdCBzdGRpbkNvbnRlbnQgPSByZWFkQWxsU3luYyhEZW5vLnN0ZGluKTtcbiAqXG4gKiAvLyBFeGFtcGxlIGZyb20gZmlsZVxuICogY29uc3QgZmlsZSA9IERlbm8ub3BlblN5bmMoXCJteV9maWxlLnR4dFwiLCB7cmVhZDogdHJ1ZX0pO1xuICogY29uc3QgbXlGaWxlQ29udGVudCA9IHJlYWRBbGxTeW5jKGZpbGUpO1xuICogRGVuby5jbG9zZShmaWxlLnJpZCk7XG4gKlxuICogLy8gRXhhbXBsZSBmcm9tIGJ1ZmZlclxuICogY29uc3QgbXlEYXRhID0gbmV3IFVpbnQ4QXJyYXkoMTAwKTtcbiAqIC8vIC4uLiBmaWxsIG15RGF0YSBhcnJheSB3aXRoIGRhdGFcbiAqIGNvbnN0IHJlYWRlciA9IG5ldyBCdWZmZXIobXlEYXRhLmJ1ZmZlcik7XG4gKiBjb25zdCBidWZmZXJDb250ZW50ID0gcmVhZEFsbFN5bmMocmVhZGVyKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZEFsbFN5bmMocjogRGVuby5SZWFkZXJTeW5jKTogVWludDhBcnJheSB7XG4gIGNvbnN0IGJ1ZiA9IG5ldyBCdWZmZXIoKTtcbiAgYnVmLnJlYWRGcm9tU3luYyhyKTtcbiAgcmV0dXJuIGJ1Zi5ieXRlcygpO1xufVxuXG5leHBvcnQgaW50ZXJmYWNlIEJ5dGVSYW5nZSB7XG4gIC8qKiBUaGUgMCBiYXNlZCBpbmRleCBvZiB0aGUgc3RhcnQgYnl0ZSBmb3IgYSByYW5nZS4gKi9cbiAgc3RhcnQ6IG51bWJlcjtcblxuICAvKiogVGhlIDAgYmFzZWQgaW5kZXggb2YgdGhlIGVuZCBieXRlIGZvciBhIHJhbmdlLCB3aGljaCBpcyBpbmNsdXNpdmUuICovXG4gIGVuZDogbnVtYmVyO1xufVxuXG4vKipcbiAqIFJlYWQgYSByYW5nZSBvZiBieXRlcyBmcm9tIGEgZmlsZSBvciBvdGhlciByZXNvdXJjZSB0aGF0IGlzIHJlYWRhYmxlIGFuZFxuICogc2Vla2FibGUuICBUaGUgcmFuZ2Ugc3RhcnQgYW5kIGVuZCBhcmUgaW5jbHVzaXZlIG9mIHRoZSBieXRlcyB3aXRoaW4gdGhhdFxuICogcmFuZ2UuXG4gKlxuICogYGBgdHNcbiAqIC8vIFJlYWQgdGhlIGZpcnN0IDEwIGJ5dGVzIG9mIGEgZmlsZVxuICogY29uc3QgZmlsZSA9IGF3YWl0IERlbm8ub3BlbihcImV4YW1wbGUudHh0XCIsIHsgcmVhZDogdHJ1ZSB9KTtcbiAqIGNvbnN0IGJ5dGVzID0gYXdhaXQgcmVhZFJhbmdlKGZpbGUsIHsgc3RhcnQ6IDAsIGVuZDogOSB9KTtcbiAqIGFzc2VydChieXRlcy5sZW5ndGgsIDEwKTtcbiAqIGBgYFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZFJhbmdlKFxuICByOiBEZW5vLlJlYWRlciAmIERlbm8uU2Vla2VyLFxuICByYW5nZTogQnl0ZVJhbmdlLFxuKTogUHJvbWlzZTxVaW50OEFycmF5PiB7XG4gIC8vIGJ5dGUgcmFuZ2VzIGFyZSBpbmNsdXNpdmUsIHNvIHdlIGhhdmUgdG8gYWRkIG9uZSB0byB0aGUgZW5kXG4gIGxldCBsZW5ndGggPSByYW5nZS5lbmQgLSByYW5nZS5zdGFydCArIDE7XG4gIGFzc2VydChsZW5ndGggPiAwLCBcIkludmFsaWQgYnl0ZSByYW5nZSB3YXMgcGFzc2VkLlwiKTtcbiAgYXdhaXQgci5zZWVrKHJhbmdlLnN0YXJ0LCBEZW5vLlNlZWtNb2RlLlN0YXJ0KTtcbiAgY29uc3QgcmVzdWx0ID0gbmV3IFVpbnQ4QXJyYXkobGVuZ3RoKTtcbiAgbGV0IG9mZiA9IDA7XG4gIHdoaWxlIChsZW5ndGgpIHtcbiAgICBjb25zdCBwID0gbmV3IFVpbnQ4QXJyYXkoTWF0aC5taW4obGVuZ3RoLCBERUZBVUxUX0JVRkZFUl9TSVpFKSk7XG4gICAgY29uc3QgbnJlYWQgPSBhd2FpdCByLnJlYWQocCk7XG4gICAgYXNzZXJ0KG5yZWFkICE9PSBudWxsLCBcIlVuZXhwZWN0ZWQgRU9GIHJlYWNoIHdoaWxlIHJlYWRpbmcgYSByYW5nZS5cIik7XG4gICAgYXNzZXJ0KG5yZWFkID4gMCwgXCJVbmV4cGVjdGVkIHJlYWQgb2YgMCBieXRlcyB3aGlsZSByZWFkaW5nIGEgcmFuZ2UuXCIpO1xuICAgIGNvcHkocCwgcmVzdWx0LCBvZmYpO1xuICAgIG9mZiArPSBucmVhZDtcbiAgICBsZW5ndGggLT0gbnJlYWQ7XG4gICAgYXNzZXJ0KGxlbmd0aCA+PSAwLCBcIlVuZXhwZWN0ZWQgbGVuZ3RoIHJlbWFpbmluZyBhZnRlciByZWFkaW5nIHJhbmdlLlwiKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKipcbiAqIFJlYWQgYSByYW5nZSBvZiBieXRlcyBzeW5jaHJvbm91c2x5IGZyb20gYSBmaWxlIG9yIG90aGVyIHJlc291cmNlIHRoYXQgaXNcbiAqIHJlYWRhYmxlIGFuZCBzZWVrYWJsZS4gIFRoZSByYW5nZSBzdGFydCBhbmQgZW5kIGFyZSBpbmNsdXNpdmUgb2YgdGhlIGJ5dGVzXG4gKiB3aXRoaW4gdGhhdCByYW5nZS5cbiAqXG4gKiBgYGB0c1xuICogLy8gUmVhZCB0aGUgZmlyc3QgMTAgYnl0ZXMgb2YgYSBmaWxlXG4gKiBjb25zdCBmaWxlID0gRGVuby5vcGVuU3luYyhcImV4YW1wbGUudHh0XCIsIHsgcmVhZDogdHJ1ZSB9KTtcbiAqIGNvbnN0IGJ5dGVzID0gcmVhZFJhbmdlU3luYyhmaWxlLCB7IHN0YXJ0OiAwLCBlbmQ6IDkgfSk7XG4gKiBhc3NlcnQoYnl0ZXMubGVuZ3RoLCAxMCk7XG4gKiBgYGBcbiAqL1xuZXhwb3J0IGZ1bmN0aW9uIHJlYWRSYW5nZVN5bmMoXG4gIHI6IERlbm8uUmVhZGVyU3luYyAmIERlbm8uU2Vla2VyU3luYyxcbiAgcmFuZ2U6IEJ5dGVSYW5nZSxcbik6IFVpbnQ4QXJyYXkge1xuICAvLyBieXRlIHJhbmdlcyBhcmUgaW5jbHVzaXZlLCBzbyB3ZSBoYXZlIHRvIGFkZCBvbmUgdG8gdGhlIGVuZFxuICBsZXQgbGVuZ3RoID0gcmFuZ2UuZW5kIC0gcmFuZ2Uuc3RhcnQgKyAxO1xuICBhc3NlcnQobGVuZ3RoID4gMCwgXCJJbnZhbGlkIGJ5dGUgcmFuZ2Ugd2FzIHBhc3NlZC5cIik7XG4gIHIuc2Vla1N5bmMocmFuZ2Uuc3RhcnQsIERlbm8uU2Vla01vZGUuU3RhcnQpO1xuICBjb25zdCByZXN1bHQgPSBuZXcgVWludDhBcnJheShsZW5ndGgpO1xuICBsZXQgb2ZmID0gMDtcbiAgd2hpbGUgKGxlbmd0aCkge1xuICAgIGNvbnN0IHAgPSBuZXcgVWludDhBcnJheShNYXRoLm1pbihsZW5ndGgsIERFRkFVTFRfQlVGRkVSX1NJWkUpKTtcbiAgICBjb25zdCBucmVhZCA9IHIucmVhZFN5bmMocCk7XG4gICAgYXNzZXJ0KG5yZWFkICE9PSBudWxsLCBcIlVuZXhwZWN0ZWQgRU9GIHJlYWNoIHdoaWxlIHJlYWRpbmcgYSByYW5nZS5cIik7XG4gICAgYXNzZXJ0KG5yZWFkID4gMCwgXCJVbmV4cGVjdGVkIHJlYWQgb2YgMCBieXRlcyB3aGlsZSByZWFkaW5nIGEgcmFuZ2UuXCIpO1xuICAgIGNvcHkocCwgcmVzdWx0LCBvZmYpO1xuICAgIG9mZiArPSBucmVhZDtcbiAgICBsZW5ndGggLT0gbnJlYWQ7XG4gICAgYXNzZXJ0KGxlbmd0aCA+PSAwLCBcIlVuZXhwZWN0ZWQgbGVuZ3RoIHJlbWFpbmluZyBhZnRlciByZWFkaW5nIHJhbmdlLlwiKTtcbiAgfVxuICByZXR1cm4gcmVzdWx0O1xufVxuXG4vKiogV3JpdGUgYWxsIHRoZSBjb250ZW50IG9mIHRoZSBhcnJheSBidWZmZXIgKGBhcnJgKSB0byB0aGUgd3JpdGVyIChgd2ApLlxuICpcbiAqIGBgYHRzXG4gKiAvLyBFeGFtcGxlIHdyaXRpbmcgdG8gc3Rkb3V0XG4gKiBjb25zdCBjb250ZW50Qnl0ZXMgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJIZWxsbyBXb3JsZFwiKTtcbiAqIGF3YWl0IHdyaXRlQWxsKERlbm8uc3Rkb3V0LCBjb250ZW50Qnl0ZXMpO1xuICpcbiAqIC8vIEV4YW1wbGUgd3JpdGluZyB0byBmaWxlXG4gKiBjb25zdCBjb250ZW50Qnl0ZXMgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJIZWxsbyBXb3JsZFwiKTtcbiAqIGNvbnN0IGZpbGUgPSBhd2FpdCBEZW5vLm9wZW4oJ3Rlc3QuZmlsZScsIHt3cml0ZTogdHJ1ZX0pO1xuICogYXdhaXQgd3JpdGVBbGwoZmlsZSwgY29udGVudEJ5dGVzKTtcbiAqIERlbm8uY2xvc2UoZmlsZS5yaWQpO1xuICpcbiAqIC8vIEV4YW1wbGUgd3JpdGluZyB0byBidWZmZXJcbiAqIGNvbnN0IGNvbnRlbnRCeXRlcyA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIkhlbGxvIFdvcmxkXCIpO1xuICogY29uc3Qgd3JpdGVyID0gbmV3IEJ1ZmZlcigpO1xuICogYXdhaXQgd3JpdGVBbGwod3JpdGVyLCBjb250ZW50Qnl0ZXMpO1xuICogY29uc29sZS5sb2cod3JpdGVyLmJ5dGVzKCkubGVuZ3RoKTsgIC8vIDExXG4gKiBgYGBcbiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uIHdyaXRlQWxsKHc6IERlbm8uV3JpdGVyLCBhcnI6IFVpbnQ4QXJyYXkpIHtcbiAgbGV0IG53cml0dGVuID0gMDtcbiAgd2hpbGUgKG53cml0dGVuIDwgYXJyLmxlbmd0aCkge1xuICAgIG53cml0dGVuICs9IGF3YWl0IHcud3JpdGUoYXJyLnN1YmFycmF5KG53cml0dGVuKSk7XG4gIH1cbn1cblxuLyoqIFN5bmNocm9ub3VzbHkgd3JpdGUgYWxsIHRoZSBjb250ZW50IG9mIHRoZSBhcnJheSBidWZmZXIgKGBhcnJgKSB0byB0aGVcbiAqIHdyaXRlciAoYHdgKS5cbiAqXG4gKiBgYGB0c1xuICogLy8gRXhhbXBsZSB3cml0aW5nIHRvIHN0ZG91dFxuICogY29uc3QgY29udGVudEJ5dGVzID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiSGVsbG8gV29ybGRcIik7XG4gKiB3cml0ZUFsbFN5bmMoRGVuby5zdGRvdXQsIGNvbnRlbnRCeXRlcyk7XG4gKlxuICogLy8gRXhhbXBsZSB3cml0aW5nIHRvIGZpbGVcbiAqIGNvbnN0IGNvbnRlbnRCeXRlcyA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIkhlbGxvIFdvcmxkXCIpO1xuICogY29uc3QgZmlsZSA9IERlbm8ub3BlblN5bmMoJ3Rlc3QuZmlsZScsIHt3cml0ZTogdHJ1ZX0pO1xuICogd3JpdGVBbGxTeW5jKGZpbGUsIGNvbnRlbnRCeXRlcyk7XG4gKiBEZW5vLmNsb3NlKGZpbGUucmlkKTtcbiAqXG4gKiAvLyBFeGFtcGxlIHdyaXRpbmcgdG8gYnVmZmVyXG4gKiBjb25zdCBjb250ZW50Qnl0ZXMgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJIZWxsbyBXb3JsZFwiKTtcbiAqIGNvbnN0IHdyaXRlciA9IG5ldyBCdWZmZXIoKTtcbiAqIHdyaXRlQWxsU3luYyh3cml0ZXIsIGNvbnRlbnRCeXRlcyk7XG4gKiBjb25zb2xlLmxvZyh3cml0ZXIuYnl0ZXMoKS5sZW5ndGgpOyAgLy8gMTFcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gd3JpdGVBbGxTeW5jKHc6IERlbm8uV3JpdGVyU3luYywgYXJyOiBVaW50OEFycmF5KTogdm9pZCB7XG4gIGxldCBud3JpdHRlbiA9IDA7XG4gIHdoaWxlIChud3JpdHRlbiA8IGFyci5sZW5ndGgpIHtcbiAgICBud3JpdHRlbiArPSB3LndyaXRlU3luYyhhcnIuc3ViYXJyYXkobndyaXR0ZW4pKTtcbiAgfVxufVxuXG4vKiogVHVybnMgYSBSZWFkZXIsIGByYCwgaW50byBhbiBhc3luYyBpdGVyYXRvci5cbiAqXG4gKiBgYGB0c1xuICogbGV0IGYgPSBhd2FpdCBEZW5vLm9wZW4oXCIvZXRjL3Bhc3N3ZFwiKTtcbiAqIGZvciBhd2FpdCAoY29uc3QgY2h1bmsgb2YgaXRlcihmKSkge1xuICogICBjb25zb2xlLmxvZyhjaHVuayk7XG4gKiB9XG4gKiBmLmNsb3NlKCk7XG4gKiBgYGBcbiAqXG4gKiBTZWNvbmQgYXJndW1lbnQgY2FuIGJlIHVzZWQgdG8gdHVuZSBzaXplIG9mIGEgYnVmZmVyLlxuICogRGVmYXVsdCBzaXplIG9mIHRoZSBidWZmZXIgaXMgMzJrQi5cbiAqXG4gKiBgYGB0c1xuICogbGV0IGYgPSBhd2FpdCBEZW5vLm9wZW4oXCIvZXRjL3Bhc3N3ZFwiKTtcbiAqIGNvbnN0IGl0ZXIgPSBpdGVyKGYsIHtcbiAqICAgYnVmU2l6ZTogMTAyNCAqIDEwMjRcbiAqIH0pO1xuICogZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiBpdGVyKSB7XG4gKiAgIGNvbnNvbGUubG9nKGNodW5rKTtcbiAqIH1cbiAqIGYuY2xvc2UoKTtcbiAqIGBgYFxuICpcbiAqIEl0ZXJhdG9yIHVzZXMgYW4gaW50ZXJuYWwgYnVmZmVyIG9mIGZpeGVkIHNpemUgZm9yIGVmZmljaWVuY3k7IGl0IHJldHVybnNcbiAqIGEgdmlldyBvbiB0aGF0IGJ1ZmZlciBvbiBlYWNoIGl0ZXJhdGlvbi4gSXQgaXMgdGhlcmVmb3JlIGNhbGxlcidzXG4gKiByZXNwb25zaWJpbGl0eSB0byBjb3B5IGNvbnRlbnRzIG9mIHRoZSBidWZmZXIgaWYgbmVlZGVkOyBvdGhlcndpc2UgdGhlXG4gKiBuZXh0IGl0ZXJhdGlvbiB3aWxsIG92ZXJ3cml0ZSBjb250ZW50cyBvZiBwcmV2aW91c2x5IHJldHVybmVkIGNodW5rLlxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24qIGl0ZXIoXG4gIHI6IERlbm8uUmVhZGVyLFxuICBvcHRpb25zPzoge1xuICAgIGJ1ZlNpemU/OiBudW1iZXI7XG4gIH0sXG4pOiBBc3luY0l0ZXJhYmxlSXRlcmF0b3I8VWludDhBcnJheT4ge1xuICBjb25zdCBidWZTaXplID0gb3B0aW9ucz8uYnVmU2l6ZSA/PyBERUZBVUxUX0JVRkZFUl9TSVpFO1xuICBjb25zdCBiID0gbmV3IFVpbnQ4QXJyYXkoYnVmU2l6ZSk7XG4gIHdoaWxlICh0cnVlKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgci5yZWFkKGIpO1xuICAgIGlmIChyZXN1bHQgPT09IG51bGwpIHtcbiAgICAgIGJyZWFrO1xuICAgIH1cblxuICAgIHlpZWxkIGIuc3ViYXJyYXkoMCwgcmVzdWx0KTtcbiAgfVxufVxuXG4vKiogVHVybnMgYSBSZWFkZXJTeW5jLCBgcmAsIGludG8gYW4gaXRlcmF0b3IuXG4gKlxuICogYGBgdHNcbiAqIGxldCBmID0gRGVuby5vcGVuU3luYyhcIi9ldGMvcGFzc3dkXCIpO1xuICogZm9yIChjb25zdCBjaHVuayBvZiBpdGVyU3luYyhmKSkge1xuICogICBjb25zb2xlLmxvZyhjaHVuayk7XG4gKiB9XG4gKiBmLmNsb3NlKCk7XG4gKiBgYGBcbiAqXG4gKiBTZWNvbmQgYXJndW1lbnQgY2FuIGJlIHVzZWQgdG8gdHVuZSBzaXplIG9mIGEgYnVmZmVyLlxuICogRGVmYXVsdCBzaXplIG9mIHRoZSBidWZmZXIgaXMgMzJrQi5cbiAqXG4gKiBgYGB0c1xuICogbGV0IGYgPSBhd2FpdCBEZW5vLm9wZW4oXCIvZXRjL3Bhc3N3ZFwiKTtcbiAqIGNvbnN0IGl0ZXIgPSBpdGVyU3luYyhmLCB7XG4gKiAgIGJ1ZlNpemU6IDEwMjQgKiAxMDI0XG4gKiB9KTtcbiAqIGZvciAoY29uc3QgY2h1bmsgb2YgaXRlcikge1xuICogICBjb25zb2xlLmxvZyhjaHVuayk7XG4gKiB9XG4gKiBmLmNsb3NlKCk7XG4gKiBgYGBcbiAqXG4gKiBJdGVyYXRvciB1c2VzIGFuIGludGVybmFsIGJ1ZmZlciBvZiBmaXhlZCBzaXplIGZvciBlZmZpY2llbmN5OyBpdCByZXR1cm5zXG4gKiBhIHZpZXcgb24gdGhhdCBidWZmZXIgb24gZWFjaCBpdGVyYXRpb24uIEl0IGlzIHRoZXJlZm9yZSBjYWxsZXInc1xuICogcmVzcG9uc2liaWxpdHkgdG8gY29weSBjb250ZW50cyBvZiB0aGUgYnVmZmVyIGlmIG5lZWRlZDsgb3RoZXJ3aXNlIHRoZVxuICogbmV4dCBpdGVyYXRpb24gd2lsbCBvdmVyd3JpdGUgY29udGVudHMgb2YgcHJldmlvdXNseSByZXR1cm5lZCBjaHVuay5cbiAqL1xuZXhwb3J0IGZ1bmN0aW9uKiBpdGVyU3luYyhcbiAgcjogRGVuby5SZWFkZXJTeW5jLFxuICBvcHRpb25zPzoge1xuICAgIGJ1ZlNpemU/OiBudW1iZXI7XG4gIH0sXG4pOiBJdGVyYWJsZUl0ZXJhdG9yPFVpbnQ4QXJyYXk+IHtcbiAgY29uc3QgYnVmU2l6ZSA9IG9wdGlvbnM/LmJ1ZlNpemUgPz8gREVGQVVMVF9CVUZGRVJfU0laRTtcbiAgY29uc3QgYiA9IG5ldyBVaW50OEFycmF5KGJ1ZlNpemUpO1xuICB3aGlsZSAodHJ1ZSkge1xuICAgIGNvbnN0IHJlc3VsdCA9IHIucmVhZFN5bmMoYik7XG4gICAgaWYgKHJlc3VsdCA9PT0gbnVsbCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgeWllbGQgYi5zdWJhcnJheSgwLCByZXN1bHQpO1xuICB9XG59XG4iXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsTUFBTSxHQUFHLE1BQU0sUUFBUSxDQUFhO0FBQ3BDLE1BQU0sR0FBRyxJQUFJLFFBQVEsQ0FBaUI7QUFDdEMsTUFBTSxHQUFHLE1BQU0sUUFBUSxDQUF1QjtBQUU5QyxLQUFLLENBQUMsbUJBQW1CLEdBQUcsRUFBRSxHQUFHLElBQUk7QUFFckMsRUFtQkcsQUFuQkg7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FtQkcsQUFuQkgsRUFtQkcsQ0FDSCxNQUFNLGdCQUFnQixPQUFPLENBQUMsQ0FBYyxFQUF1QixDQUFDO0lBQ2xFLEtBQUssQ0FBQyxHQUFHLEdBQUcs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