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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjk3LjAvaW8vdXRpbC50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBCdWZmZXIgfSBmcm9tIFwiLi9idWZmZXIudHNcIjtcbmltcG9ydCB7IGNvcHkgfSBmcm9tIFwiLi4vYnl0ZXMvbW9kLnRzXCI7XG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi4vdGVzdGluZy9hc3NlcnRzLnRzXCI7XG5cbmNvbnN0IERFRkFVTFRfQlVGRkVSX1NJWkUgPSAzMiAqIDEwMjQ7XG5cbi8qKiBSZWFkIFJlYWRlciBgcmAgdW50aWwgRU9GIChgbnVsbGApIGFuZCByZXNvbHZlIHRvIHRoZSBjb250ZW50IGFzXG4gKiBVaW50OEFycmF5YC5cbiAqXG4gKiBgYGB0c1xuICpcbiAqIC8vIEV4YW1wbGUgZnJvbSBzdGRpblxuICogY29uc3Qgc3RkaW5Db250ZW50ID0gYXdhaXQgcmVhZEFsbChEZW5vLnN0ZGluKTtcbiAqXG4gKiAvLyBFeGFtcGxlIGZyb20gZmlsZVxuICogY29uc3QgZmlsZSA9IGF3YWl0IERlbm8ub3BlbihcIm15X2ZpbGUudHh0XCIsIHtyZWFkOiB0cnVlfSk7XG4gKiBjb25zdCBteUZpbGVDb250ZW50ID0gYXdhaXQgcmVhZEFsbChmaWxlKTtcbiAqIERlbm8uY2xvc2UoZmlsZS5yaWQpO1xuICpcbiAqIC8vIEV4YW1wbGUgZnJvbSBidWZmZXJcbiAqIGNvbnN0IG15RGF0YSA9IG5ldyBVaW50OEFycmF5KDEwMCk7XG4gKiAvLyAuLi4gZmlsbCBteURhdGEgYXJyYXkgd2l0aCBkYXRhXG4gKiBjb25zdCByZWFkZXIgPSBuZXcgQnVmZmVyKG15RGF0YS5idWZmZXIpO1xuICogY29uc3QgYnVmZmVyQ29udGVudCA9IGF3YWl0IHJlYWRBbGwocmVhZGVyKTtcbiAqIGBgYFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gcmVhZEFsbChyOiBEZW5vLlJlYWRlcik6IFByb21pc2U8VWludDhBcnJheT4ge1xuICBjb25zdCBidWYgPSBuZXcgQnVmZmVyKCk7XG4gIGF3YWl0IGJ1Zi5yZWFkRnJvbShyKTtcbiAgcmV0dXJuIGJ1Zi5ieXRlcygpO1xufVxuXG4vKiogU3luY2hyb25vdXNseSByZWFkcyBSZWFkZXIgYHJgIHVudGlsIEVPRiAoYG51bGxgKSBhbmQgcmV0dXJucyB0aGUgY29udGVudFxuICogYXMgYFVpbnQ4QXJyYXlgLlxuICpcbiAqIGBgYHRzXG4gKiAvLyBFeGFtcGxlIGZyb20gc3RkaW5cbiAqIGNvbnN0IHN0ZGluQ29udGVudCA9IHJlYWRBbGxTeW5jKERlbm8uc3RkaW4pO1xuICpcbiAqIC8vIEV4YW1wbGUgZnJvbSBmaWxlXG4gKiBjb25zdCBmaWxlID0gRGVuby5vcGVuU3luYyhcIm15X2ZpbGUudHh0XCIsIHtyZWFkOiB0cnVlfSk7XG4gKiBjb25zdCBteUZpbGVDb250ZW50ID0gcmVhZEFsbFN5bmMoZmlsZSk7XG4gKiBEZW5vLmNsb3NlKGZpbGUucmlkKTtcbiAqXG4gKiAvLyBFeGFtcGxlIGZyb20gYnVmZmVyXG4gKiBjb25zdCBteURhdGEgPSBuZXcgVWludDhBcnJheSgxMDApO1xuICogLy8gLi4uIGZpbGwgbXlEYXRhIGFycmF5IHdpdGggZGF0YVxuICogY29uc3QgcmVhZGVyID0gbmV3IEJ1ZmZlcihteURhdGEuYnVmZmVyKTtcbiAqIGNvbnN0IGJ1ZmZlckNvbnRlbnQgPSByZWFkQWxsU3luYyhyZWFkZXIpO1xuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiByZWFkQWxsU3luYyhyOiBEZW5vLlJlYWRlclN5bmMpOiBVaW50OEFycmF5IHtcbiAgY29uc3QgYnVmID0gbmV3IEJ1ZmZlcigpO1xuICBidWYucmVhZEZyb21TeW5jKHIpO1xuICByZXR1cm4gYnVmLmJ5dGVzKCk7XG59XG5cbmV4cG9ydCBpbnRlcmZhY2UgQnl0ZVJhbmdlIHtcbiAgLyoqIFRoZSAwIGJhc2VkIGluZGV4IG9mIHRoZSBzdGFydCBieXRlIGZvciBhIHJhbmdlLiAqL1xuICBzdGFydDogbnVtYmVyO1xuXG4gIC8qKiBUaGUgMCBiYXNlZCBpbmRleCBvZiB0aGUgZW5kIGJ5dGUgZm9yIGEgcmFuZ2UsIHdoaWNoIGlzIGluY2x1c2l2ZS4gKi9cbiAgZW5kOiBudW1iZXI7XG59XG5cbi8qKlxuICogUmVhZCBhIHJhbmdlIG9mIGJ5dGVzIGZyb20gYSBmaWxlIG9yIG90aGVyIHJlc291cmNlIHRoYXQgaXMgcmVhZGFibGUgYW5kXG4gKiBzZWVrYWJsZS4gIFRoZSByYW5nZSBzdGFydCBhbmQgZW5kIGFyZSBpbmNsdXNpdmUgb2YgdGhlIGJ5dGVzIHdpdGhpbiB0aGF0XG4gKiByYW5nZS5cbiAqXG4gKiBgYGB0c1xuICogLy8gUmVhZCB0aGUgZmlyc3QgMTAgYnl0ZXMgb2YgYSBmaWxlXG4gKiBjb25zdCBmaWxlID0gYXdhaXQgRGVuby5vcGVuKFwiZXhhbXBsZS50eHRcIiwgeyByZWFkOiB0cnVlIH0pO1xuICogY29uc3QgYnl0ZXMgPSBhd2FpdCByZWFkUmFuZ2UoZmlsZSwgeyBzdGFydDogMCwgZW5kOiA5IH0pO1xuICogYXNzZXJ0KGJ5dGVzLmxlbmd0aCwgMTApO1xuICogYGBgXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiByZWFkUmFuZ2UoXG4gIHI6IERlbm8uUmVhZGVyICYgRGVuby5TZWVrZXIsXG4gIHJhbmdlOiBCeXRlUmFuZ2UsXG4pOiBQcm9taXNlPFVpbnQ4QXJyYXk+IHtcbiAgLy8gYnl0ZSByYW5nZXMgYXJlIGluY2x1c2l2ZSwgc28gd2UgaGF2ZSB0byBhZGQgb25lIHRvIHRoZSBlbmRcbiAgbGV0IGxlbmd0aCA9IHJhbmdlLmVuZCAtIHJhbmdlLnN0YXJ0ICsgMTtcbiAgYXNzZXJ0KGxlbmd0aCA+IDAsIFwiSW52YWxpZCBieXRlIHJhbmdlIHdhcyBwYXNzZWQuXCIpO1xuICBhd2FpdCByLnNlZWsocmFuZ2Uuc3RhcnQsIERlbm8uU2Vla01vZGUuU3RhcnQpO1xuICBjb25zdCByZXN1bHQgPSBuZXcgVWludDhBcnJheShsZW5ndGgpO1xuICBsZXQgb2ZmID0gMDtcbiAgd2hpbGUgKGxlbmd0aCkge1xuICAgIGNvbnN0IHAgPSBuZXcgVWludDhBcnJheShNYXRoLm1pbihsZW5ndGgsIERFRkFVTFRfQlVGRkVSX1NJWkUpKTtcbiAgICBjb25zdCBucmVhZCA9IGF3YWl0IHIucmVhZChwKTtcbiAgICBhc3NlcnQobnJlYWQgIT09IG51bGwsIFwiVW5leHBlY3RlZCBFT0YgcmVhY2ggd2hpbGUgcmVhZGluZyBhIHJhbmdlLlwiKTtcbiAgICBhc3NlcnQobnJlYWQgPiAwLCBcIlVuZXhwZWN0ZWQgcmVhZCBvZiAwIGJ5dGVzIHdoaWxlIHJlYWRpbmcgYSByYW5nZS5cIik7XG4gICAgY29weShwLCByZXN1bHQsIG9mZik7XG4gICAgb2ZmICs9IG5yZWFkO1xuICAgIGxlbmd0aCAtPSBucmVhZDtcbiAgICBhc3NlcnQobGVuZ3RoID49IDAsIFwiVW5leHBlY3RlZCBsZW5ndGggcmVtYWluaW5nIGFmdGVyIHJlYWRpbmcgcmFuZ2UuXCIpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKlxuICogUmVhZCBhIHJhbmdlIG9mIGJ5dGVzIHN5bmNocm9ub3VzbHkgZnJvbSBhIGZpbGUgb3Igb3RoZXIgcmVzb3VyY2UgdGhhdCBpc1xuICogcmVhZGFibGUgYW5kIHNlZWthYmxlLiAgVGhlIHJhbmdlIHN0YXJ0IGFuZCBlbmQgYXJlIGluY2x1c2l2ZSBvZiB0aGUgYnl0ZXNcbiAqIHdpdGhpbiB0aGF0IHJhbmdlLlxuICpcbiAqIGBgYHRzXG4gKiAvLyBSZWFkIHRoZSBmaXJzdCAxMCBieXRlcyBvZiBhIGZpbGVcbiAqIGNvbnN0IGZpbGUgPSBEZW5vLm9wZW5TeW5jKFwiZXhhbXBsZS50eHRcIiwgeyByZWFkOiB0cnVlIH0pO1xuICogY29uc3QgYnl0ZXMgPSByZWFkUmFuZ2VTeW5jKGZpbGUsIHsgc3RhcnQ6IDAsIGVuZDogOSB9KTtcbiAqIGFzc2VydChieXRlcy5sZW5ndGgsIDEwKTtcbiAqIGBgYFxuICovXG5leHBvcnQgZnVuY3Rpb24gcmVhZFJhbmdlU3luYyhcbiAgcjogRGVuby5SZWFkZXJTeW5jICYgRGVuby5TZWVrZXJTeW5jLFxuICByYW5nZTogQnl0ZVJhbmdlLFxuKTogVWludDhBcnJheSB7XG4gIC8vIGJ5dGUgcmFuZ2VzIGFyZSBpbmNsdXNpdmUsIHNvIHdlIGhhdmUgdG8gYWRkIG9uZSB0byB0aGUgZW5kXG4gIGxldCBsZW5ndGggPSByYW5nZS5lbmQgLSByYW5nZS5zdGFydCArIDE7XG4gIGFzc2VydChsZW5ndGggPiAwLCBcIkludmFsaWQgYnl0ZSByYW5nZSB3YXMgcGFzc2VkLlwiKTtcbiAgci5zZWVrU3luYyhyYW5nZS5zdGFydCwgRGVuby5TZWVrTW9kZS5TdGFydCk7XG4gIGNvbnN0IHJlc3VsdCA9IG5ldyBVaW50OEFycmF5KGxlbmd0aCk7XG4gIGxldCBvZmYgPSAwO1xuICB3aGlsZSAobGVuZ3RoKSB7XG4gICAgY29uc3QgcCA9IG5ldyBVaW50OEFycmF5KE1hdGgubWluKGxlbmd0aCwgREVGQVVMVF9CVUZGRVJfU0laRSkpO1xuICAgIGNvbnN0IG5yZWFkID0gci5yZWFkU3luYyhwKTtcbiAgICBhc3NlcnQobnJlYWQgIT09IG51bGwsIFwiVW5leHBlY3RlZCBFT0YgcmVhY2ggd2hpbGUgcmVhZGluZyBhIHJhbmdlLlwiKTtcbiAgICBhc3NlcnQobnJlYWQgPiAwLCBcIlVuZXhwZWN0ZWQgcmVhZCBvZiAwIGJ5dGVzIHdoaWxlIHJlYWRpbmcgYSByYW5nZS5cIik7XG4gICAgY29weShwLCByZXN1bHQsIG9mZik7XG4gICAgb2ZmICs9IG5yZWFkO1xuICAgIGxlbmd0aCAtPSBucmVhZDtcbiAgICBhc3NlcnQobGVuZ3RoID49IDAsIFwiVW5leHBlY3RlZCBsZW5ndGggcmVtYWluaW5nIGFmdGVyIHJlYWRpbmcgcmFuZ2UuXCIpO1xuICB9XG4gIHJldHVybiByZXN1bHQ7XG59XG5cbi8qKiBXcml0ZSBhbGwgdGhlIGNvbnRlbnQgb2YgdGhlIGFycmF5IGJ1ZmZlciAoYGFycmApIHRvIHRoZSB3cml0ZXIgKGB3YCkuXG4gKlxuICogYGBgdHNcbiAqIC8vIEV4YW1wbGUgd3JpdGluZyB0byBzdGRvdXRcbiAqIGNvbnN0IGNvbnRlbnRCeXRlcyA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIkhlbGxvIFdvcmxkXCIpO1xuICogYXdhaXQgd3JpdGVBbGwoRGVuby5zdGRvdXQsIGNvbnRlbnRCeXRlcyk7XG4gKlxuICogLy8gRXhhbXBsZSB3cml0aW5nIHRvIGZpbGVcbiAqIGNvbnN0IGNvbnRlbnRCeXRlcyA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIkhlbGxvIFdvcmxkXCIpO1xuICogY29uc3QgZmlsZSA9IGF3YWl0IERlbm8ub3BlbigndGVzdC5maWxlJywge3dyaXRlOiB0cnVlfSk7XG4gKiBhd2FpdCB3cml0ZUFsbChmaWxlLCBjb250ZW50Qnl0ZXMpO1xuICogRGVuby5jbG9zZShmaWxlLnJpZCk7XG4gKlxuICogLy8gRXhhbXBsZSB3cml0aW5nIHRvIGJ1ZmZlclxuICogY29uc3QgY29udGVudEJ5dGVzID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiSGVsbG8gV29ybGRcIik7XG4gKiBjb25zdCB3cml0ZXIgPSBuZXcgQnVmZmVyKCk7XG4gKiBhd2FpdCB3cml0ZUFsbCh3cml0ZXIsIGNvbnRlbnRCeXRlcyk7XG4gKiBjb25zb2xlLmxvZyh3cml0ZXIuYnl0ZXMoKS5sZW5ndGgpOyAgLy8gMTFcbiAqIGBgYFxuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gd3JpdGVBbGwodzogRGVuby5Xcml0ZXIsIGFycjogVWludDhBcnJheSkge1xuICBsZXQgbndyaXR0ZW4gPSAwO1xuICB3aGlsZSAobndyaXR0ZW4gPCBhcnIubGVuZ3RoKSB7XG4gICAgbndyaXR0ZW4gKz0gYXdhaXQgdy53cml0ZShhcnIuc3ViYXJyYXkobndyaXR0ZW4pKTtcbiAgfVxufVxuXG4vKiogU3luY2hyb25vdXNseSB3cml0ZSBhbGwgdGhlIGNvbnRlbnQgb2YgdGhlIGFycmF5IGJ1ZmZlciAoYGFycmApIHRvIHRoZVxuICogd3JpdGVyIChgd2ApLlxuICpcbiAqIGBgYHRzXG4gKiAvLyBFeGFtcGxlIHdyaXRpbmcgdG8gc3Rkb3V0XG4gKiBjb25zdCBjb250ZW50Qnl0ZXMgPSBuZXcgVGV4dEVuY29kZXIoKS5lbmNvZGUoXCJIZWxsbyBXb3JsZFwiKTtcbiAqIHdyaXRlQWxsU3luYyhEZW5vLnN0ZG91dCwgY29udGVudEJ5dGVzKTtcbiAqXG4gKiAvLyBFeGFtcGxlIHdyaXRpbmcgdG8gZmlsZVxuICogY29uc3QgY29udGVudEJ5dGVzID0gbmV3IFRleHRFbmNvZGVyKCkuZW5jb2RlKFwiSGVsbG8gV29ybGRcIik7XG4gKiBjb25zdCBmaWxlID0gRGVuby5vcGVuU3luYygndGVzdC5maWxlJywge3dyaXRlOiB0cnVlfSk7XG4gKiB3cml0ZUFsbFN5bmMoZmlsZSwgY29udGVudEJ5dGVzKTtcbiAqIERlbm8uY2xvc2UoZmlsZS5yaWQpO1xuICpcbiAqIC8vIEV4YW1wbGUgd3JpdGluZyB0byBidWZmZXJcbiAqIGNvbnN0IGNvbnRlbnRCeXRlcyA9IG5ldyBUZXh0RW5jb2RlcigpLmVuY29kZShcIkhlbGxvIFdvcmxkXCIpO1xuICogY29uc3Qgd3JpdGVyID0gbmV3IEJ1ZmZlcigpO1xuICogd3JpdGVBbGxTeW5jKHdyaXRlciwgY29udGVudEJ5dGVzKTtcbiAqIGNvbnNvbGUubG9nKHdyaXRlci5ieXRlcygpLmxlbmd0aCk7ICAvLyAxMVxuICogYGBgXG4gKi9cbmV4cG9ydCBmdW5jdGlvbiB3cml0ZUFsbFN5bmModzogRGVuby5Xcml0ZXJTeW5jLCBhcnI6IFVpbnQ4QXJyYXkpOiB2b2lkIHtcbiAgbGV0IG53cml0dGVuID0gMDtcbiAgd2hpbGUgKG53cml0dGVuIDwgYXJyLmxlbmd0aCkge1xuICAgIG53cml0dGVuICs9IHcud3JpdGVTeW5jKGFyci5zdWJhcnJheShud3JpdHRlbikpO1xuICB9XG59XG5cbi8qKiBUdXJucyBhIFJlYWRlciwgYHJgLCBpbnRvIGFuIGFzeW5jIGl0ZXJhdG9yLlxuICpcbiAqIGBgYHRzXG4gKiBsZXQgZiA9IGF3YWl0IERlbm8ub3BlbihcIi9ldGMvcGFzc3dkXCIpO1xuICogZm9yIGF3YWl0IChjb25zdCBjaHVuayBvZiBpdGVyKGYpKSB7XG4gKiAgIGNvbnNvbGUubG9nKGNodW5rKTtcbiAqIH1cbiAqIGYuY2xvc2UoKTtcbiAqIGBgYFxuICpcbiAqIFNlY29uZCBhcmd1bWVudCBjYW4gYmUgdXNlZCB0byB0dW5lIHNpemUgb2YgYSBidWZmZXIuXG4gKiBEZWZhdWx0IHNpemUgb2YgdGhlIGJ1ZmZlciBpcyAzMmtCLlxuICpcbiAqIGBgYHRzXG4gKiBsZXQgZiA9IGF3YWl0IERlbm8ub3BlbihcIi9ldGMvcGFzc3dkXCIpO1xuICogY29uc3QgaXRlciA9IGl0ZXIoZiwge1xuICogICBidWZTaXplOiAxMDI0ICogMTAyNFxuICogfSk7XG4gKiBmb3IgYXdhaXQgKGNvbnN0IGNodW5rIG9mIGl0ZXIpIHtcbiAqICAgY29uc29sZS5sb2coY2h1bmspO1xuICogfVxuICogZi5jbG9zZSgpO1xuICogYGBgXG4gKlxuICogSXRlcmF0b3IgdXNlcyBhbiBpbnRlcm5hbCBidWZmZXIgb2YgZml4ZWQgc2l6ZSBmb3IgZWZmaWNpZW5jeTsgaXQgcmV0dXJuc1xuICogYSB2aWV3IG9uIHRoYXQgYnVmZmVyIG9uIGVhY2ggaXRlcmF0aW9uLiBJdCBpcyB0aGVyZWZvcmUgY2FsbGVyJ3NcbiAqIHJlc3BvbnNpYmlsaXR5IHRvIGNvcHkgY29udGVudHMgb2YgdGhlIGJ1ZmZlciBpZiBuZWVkZWQ7IG90aGVyd2lzZSB0aGVcbiAqIG5leHQgaXRlcmF0aW9uIHdpbGwgb3ZlcndyaXRlIGNvbnRlbnRzIG9mIHByZXZpb3VzbHkgcmV0dXJuZWQgY2h1bmsuXG4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiogaXRlcihcbiAgcjogRGVuby5SZWFkZXIsXG4gIG9wdGlvbnM/OiB7XG4gICAgYnVmU2l6ZT86IG51bWJlcjtcbiAgfSxcbik6IEFzeW5jSXRlcmFibGVJdGVyYXRvcjxVaW50OEFycmF5PiB7XG4gIGNvbnN0IGJ1ZlNpemUgPSBvcHRpb25zPy5idWZTaXplID8/IERFRkFVTFRfQlVGRkVSX1NJWkU7XG4gIGNvbnN0IGIgPSBuZXcgVWludDhBcnJheShidWZTaXplKTtcbiAgd2hpbGUgKHRydWUpIHtcbiAgICBjb25zdCByZXN1bHQgPSBhd2FpdCByLnJlYWQoYik7XG4gICAgaWYgKHJlc3VsdCA9PT0gbnVsbCkge1xuICAgICAgYnJlYWs7XG4gICAgfVxuXG4gICAgeWllbGQgYi5zdWJhcnJheSgwLCByZXN1bHQpO1xuICB9XG59XG5cbi8qKiBUdXJucyBhIFJlYWRlclN5bmMsIGByYCwgaW50byBhbiBpdGVyYXRvci5cbiAqXG4gKiBgYGB0c1xuICogbGV0IGYgPSBEZW5vLm9wZW5TeW5jKFwiL2V0Yy9wYXNzd2RcIik7XG4gKiBmb3IgKGNvbnN0IGNodW5rIG9mIGl0ZXJTeW5jKGYpKSB7XG4gKiAgIGNvbnNvbGUubG9nKGNodW5rKTtcbiAqIH1cbiAqIGYuY2xvc2UoKTtcbiAqIGBgYFxuICpcbiAqIFNlY29uZCBhcmd1bWVudCBjYW4gYmUgdXNlZCB0byB0dW5lIHNpemUgb2YgYSBidWZmZXIuXG4gKiBEZWZhdWx0IHNpemUgb2YgdGhlIGJ1ZmZlciBpcyAzMmtCLlxuICpcbiAqIGBgYHRzXG4gKiBsZXQgZiA9IGF3YWl0IERlbm8ub3BlbihcIi9ldGMvcGFzc3dkXCIpO1xuICogY29uc3QgaXRlciA9IGl0ZXJTeW5jKGYsIHtcbiAqICAgYnVmU2l6ZTogMTAyNCAqIDEwMjRcbiAqIH0pO1xuICogZm9yIChjb25zdCBjaHVuayBvZiBpdGVyKSB7XG4gKiAgIGNvbnNvbGUubG9nKGNodW5rKTtcbiAqIH1cbiAqIGYuY2xvc2UoKTtcbiAqIGBgYFxuICpcbiAqIEl0ZXJhdG9yIHVzZXMgYW4gaW50ZXJuYWwgYnVmZmVyIG9mIGZpeGVkIHNpemUgZm9yIGVmZmljaWVuY3k7IGl0IHJldHVybnNcbiAqIGEgdmlldyBvbiB0aGF0IGJ1ZmZlciBvbiBlYWNoIGl0ZXJhdGlvbi4gSXQgaXMgdGhlcmVmb3JlIGNhbGxlcidzXG4gKiByZXNwb25zaWJpbGl0eSB0byBjb3B5IGNvbnRlbnRzIG9mIHRoZSBidWZmZXIgaWYgbmVlZGVkOyBvdGhlcndpc2UgdGhlXG4gKiBuZXh0IGl0ZXJhdGlvbiB3aWxsIG92ZXJ3cml0ZSBjb250ZW50cyBvZiBwcmV2aW91c2x5IHJldHVybmVkIGNodW5rLlxuICovXG5leHBvcnQgZnVuY3Rpb24qIGl0ZXJTeW5jKFxuICByOiBEZW5vLlJlYWRlclN5bmMsXG4gIG9wdGlvbnM/OiB7XG4gICAgYnVmU2l6ZT86IG51bWJlcjtcbiAgfSxcbik6IEl0ZXJhYmxlSXRlcmF0b3I8VWludDhBcnJheT4ge1xuICBjb25zdCBidWZTaXplID0gb3B0aW9ucz8uYnVmU2l6ZSA/PyBERUZBVUxUX0JVRkZFUl9TSVpFO1xuICBjb25zdCBiID0gbmV3IFVpbnQ4QXJyYXkoYnVmU2l6ZSk7XG4gIHdoaWxlICh0cnVlKSB7XG4gICAgY29uc3QgcmVzdWx0ID0gci5yZWFkU3luYyhiKTtcbiAgICBpZiAocmVzdWx0ID09PSBudWxsKSB7XG4gICAgICBicmVhaztcbiAgICB9XG5cbiAgICB5aWVsZCBiLnN1YmFycmF5KDAsIHJlc3VsdCk7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxNQUFNLEdBQUcsTUFBTSxRQUFRLENBQWE7QUFDcEMsTUFBTSxHQUFHLElBQUksUUFBUSxDQUFpQjtBQUN0QyxNQUFNLEdBQUcsTUFBTSxRQUFRLENBQXVCO0FBRTlDLEtBQUssQ0FBQyxtQkFBbUIsR0FBRyxFQUFFLEdBQUcsSUFBSTtBQUVyQyxFQW1CRyxBQW5CSDs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW1CRyxBQW5CSCxFQW1CRyxDQUNILE1BQU0sZ0JBQWdCLE9BQU8sQ0FBQyxDQUFjLEVBQXVCLENBQUM7SUFDbEUsS0FBSyxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUMsTUFBTTtJQUN0QixLQUFLLENBQUMsR0FBRyxDQUFDLFFBQVEsQ0FBQyxDQUFDO0lBQ3BCLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSztBQUNsQixDQUFDO0FBRUQsRUFrQkcsQUFsQkg7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQWtCRyxBQWxCSCxFQWtCRyxDQUNILE1BQU0sVUFBVSxXQUFXLENBQUMsQ0FBa0IsRUFBYyxDQUFDO0lBQzNELEtBQUssQ0FBQyxHQUFHLEdBQUcsR0FBRyxDQUFDLE1BQU07SUFDdEIsR0FBRyxDQUFDLFlBQVksQ0FBQyxDQUFDO0lBQ2xCLE1BQU0sQ0FBQyxHQUFHLENBQUMsS0FBSztBQUNsQixDQUFDO0FBVUQsRUFXRyxBQVhIOzs7Ozs7Ozs7OztDQVdHLEFBWEgsRUFXRyxDQUNILE1BQU0sZ0JBQWdCLFNBQVMsQ0FDN0IsQ0FBNEIsRUFDNUIsS0FBZ0IsRUFDSyxDQUFDO0lBQ3RCLEVBQThELEFBQTlELDREQUE4RDtJQUM5RCxHQUFHLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxHQUFHLEdBQUcsS0FBSyxDQUFDLEtBQUssR0FBRyxDQUFDO0lBQ3hDLE1BQU0sQ0FBQyxNQUFNLEdBQUcsQ0FBQyxFQUFFLENBQWdDO0lBQ25ELEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLO0lBQzdDLEtBQUssQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNO0lBQ3BDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQztVQUNKLE1BQU0sQ0FBRSxDQUFDO1FBQ2QsS0FBSyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLG1CQUFtQjtRQUM3RCxLQUFLLENBQUMsS0FBSyxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDNUIsTUFBTSxDQUFDLEtBQUssS0FBSyxJQUFJLEVBQUUsQ0FBNkM7UUFDcEUsTUFBTSxDQUFDLEtBQUssR0FBRyxDQUFDLEVBQUUsQ0FBbUQ7UUFDckUsSUFBSSxDQUFDLENBQUMsRUFBRSxNQUFNLEVBQUUsR0FBRztRQUNuQixHQUFHLElBQUksS0FBSztRQUNaLE1BQU0sSUFBSSxLQUFLO1FBQ2YsTUFBTSxDQUFDLE1BQU0sSUFBSSxDQUFDLEVBQUUsQ0FBa0Q7SUFDeEUsQ0FBQztJQUNELE1BQU0sQ0FBQyxNQUFNO0FBQ2YsQ0FBQztBQUVELEVBV0csQUFYSDs7Ozs7Ozs7Ozs7Q0FXRyxBQVhILEVBV0csQ0FDSCxNQUFNLFVBQVUsYUFBYSxDQUMzQixDQUFvQyxFQUNwQyxLQUFnQixFQUNKLENBQUM7SUFDYixFQUE4RCxBQUE5RCw0REFBOEQ7SUFDOUQsR0FBRyxDQUFDLE1BQU0sR0FBRyxLQUFLLENBQUMsR0FBRyxHQUFHLEtBQUssQ0FBQyxLQUFLLEdBQUcsQ0FBQztJQUN4QyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUMsRUFBRSxDQUFnQztJQUNuRCxDQUFDLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxLQUFLLEVBQUUsSUFBSSxDQUFDLFFBQVEsQ0FBQyxLQUFLO0lBQzNDLEtBQUssQ0FBQyxNQUFNLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQyxNQUFNO0lBQ3BDLEdBQUcsQ0FBQyxHQUFHLEdBQUcsQ0FBQztVQUNKLE1BQU0sQ0FBRSxDQUFDO1FBQ2QsS0FBSyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLENBQUMsTUFBTSxFQUFFLG1CQUFtQjtRQUM3RCxLQUFLLENBQUMsS0FBSyxHQUFHLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQztRQUMxQixNQUFNLENBQUMsS0FBSyxLQUFLLElBQUksRUFBRSxDQUE2QztRQUNwRSxNQUFNLENBQUMsS0FBSyxHQUFHLENBQUMsRUFBRSxDQUFtRDtRQUNyRSxJQUFJLENBQUMsQ0FBQyxFQUFFLE1BQU0sRUFBRSxHQUFHO1FBQ25CLEdBQUcsSUFBSSxLQUFLO1FBQ1osTUFBTSxJQUFJLEtBQUs7UUFDZixNQUFNLENBQUMsTUFBTSxJQUFJLENBQUMsRUFBRSxDQUFrRDtJQUN4RSxDQUFDO0lBQ0QsTUFBTSxDQUFDLE1BQU07QUFDZixDQUFDO0FBRUQsRUFtQkcsQUFuQkg7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FtQkcsQUFuQkgsRUFtQkcsQ0FDSCxNQUFNLGdCQUFnQixRQUFRLENBQUMsQ0FBYyxFQUFFLEdBQWUsRUFBRSxDQUFDO0lBQy9ELEdBQUcsQ0FBQyxRQUFRLEdBQUcsQ0FBQztVQUNULFFBQVEsR0FBRyxHQUFHLENBQUMsTUFBTSxDQUFFLENBQUM7UUFDN0IsUUFBUSxJQUFJLEtBQUssQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsUUFBUTtJQUNqRCxDQUFDO0FBQ0gsQ0FBQztBQUVELEVBb0JHLEFBcEJIOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW9CRyxBQXBCSCxFQW9CRyxDQUNILE1BQU0sVUFBVSxZQUFZLENBQUMsQ0FBa0IsRUFBRSxHQUFlLEVBQVEsQ0FBQztJQUN2RSxHQUFHLENBQUMsUUFBUSxHQUFHLENBQUM7VUFDVCxRQUFRLEdBQUcsR0FBRyxDQUFDLE1BQU0sQ0FBRSxDQUFDO1FBQzdCLFFBQVEsSUFBSSxDQUFDLENBQUMsU0FBUyxDQUFDLEdBQUcsQ0FBQyxRQUFRLENBQUMsUUFBUTtJQUMvQyxDQUFDO0FBQ0gsQ0FBQztBQUVELEVBNEJHLEFBNUJIOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBNEJHLEFBNUJILEVBNEJHLENBQ0gsTUFBTSxpQkFBaUIsSUFBSSxDQUN6QixDQUFjLEVBQ2QsT0FFQyxFQUNrQyxDQUFDO0lBQ3BDLEtBQUssQ0FBQyxPQUFPLEdBQUcsT0FBTyxFQUFFLE9BQU8sSUFBSSxtQkFBbUI7SUFDdkQsS0FBSyxDQUFDLENBQUMsR0FBRyxHQUFHLENBQUMsVUFBVSxDQUFDLE9BQU87VUFDekIsSUFBSSxDQUFFLENBQUM7UUFDWixLQUFLLENBQUMsTUFBTSxHQUFHLEtBQUssQ0FBQyxDQUFDLENBQUMsSUFBSSxDQUFDLENBQUM7UUFDN0IsRUFBRSxFQUFFLE1BQU0sS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUNwQixLQUFLO1FBQ1AsQ0FBQztjQUVLLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLE1BQU07SUFDNUIsQ0FBQztBQUNILENBQUM7QUFFRCxFQTRCRyxBQTVCSDs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQTRCRyxBQTVCSCxFQTRCRyxDQUNILE1BQU0sV0FBVyxRQUFRLENBQ3ZCLENBQWtCLEVBQ2xCLE9BRUMsRUFDNkIsQ0FBQztJQUMvQixLQUFLLENBQUMsT0FBTyxHQUFHLE9BQU8sRUFBRSxPQUFPLElBQUksbUJBQW1CO0lBQ3ZELEtBQUssQ0FBQyxDQUFDLEdBQUcsR0FBRyxDQUFDLFVBQVUsQ0FBQyxPQUFPO1VBQ3pCLElBQUksQ0FBRSxDQUFDO1FBQ1osS0FBSyxDQUFDLE1BQU0sR0FBRyxDQUFDLENBQUMsUUFBUSxDQUFDLENBQUM7UUFDM0IsRUFBRSxFQUFFLE1BQU0sS0FBSyxJQUFJLEVBQUUsQ0FBQztZQUNwQixLQUFLO1FBQ1AsQ0FBQztjQUVLLENBQUMsQ0FBQyxRQUFRLENBQUMsQ0FBQyxFQUFFLE1BQU07SUFDNUIsQ0FBQztBQUNILENBQUMifQ==