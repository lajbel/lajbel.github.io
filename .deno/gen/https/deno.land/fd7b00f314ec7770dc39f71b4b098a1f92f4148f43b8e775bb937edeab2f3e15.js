// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { assert } from "../_util/assert.ts";
import { copy } from "../bytes/mod.ts";
// MIN_READ is the minimum ArrayBuffer size passed to a read call by
// buffer.ReadFrom. As long as the Buffer has at least MIN_READ bytes beyond
// what is required to hold the contents of r, readFrom() will not grow the
// underlying buffer.
const MIN_READ = 32 * 1024;
const MAX_SIZE = 2 ** 32 - 2;
/** A variable-sized buffer of bytes with `read()` and `write()` methods.
 *
 * Buffer is almost always used with some I/O like files and sockets. It allows
 * one to buffer up a download from a socket. Buffer grows and shrinks as
 * necessary.
 *
 * Buffer is NOT the same thing as Node's Buffer. Node's Buffer was created in
 * 2009 before JavaScript had the concept of ArrayBuffers. It's simply a
 * non-standard ArrayBuffer.
 *
 * ArrayBuffer is a fixed memory allocation. Buffer is implemented on top of
 * ArrayBuffer.
 *
 * Based on [Go Buffer](https://golang.org/pkg/bytes/#Buffer). */ export class Buffer {
    #buf;
    #off = 0;
    constructor(ab){
        this.#buf = ab === undefined ? new Uint8Array(0) : new Uint8Array(ab);
    }
    /** Returns a slice holding the unread portion of the buffer.
   *
   * The slice is valid for use only until the next buffer modification (that
   * is, only until the next call to a method like `read()`, `write()`,
   * `reset()`, or `truncate()`). If `options.copy` is false the slice aliases the buffer content at
   * least until the next buffer modification, so immediate changes to the
   * slice will affect the result of future reads.
   * @param options Defaults to `{ copy: true }`
   */ bytes(options = {
        copy: true
    }) {
        if (options.copy === false) return this.#buf.subarray(this.#off);
        return this.#buf.slice(this.#off);
    }
    /** Returns whether the unread portion of the buffer is empty. */ empty() {
        return this.#buf.byteLength <= this.#off;
    }
    /** A read only number of bytes of the unread portion of the buffer. */ get length() {
        return this.#buf.byteLength - this.#off;
    }
    /** The read only capacity of the buffer's underlying byte slice, that is,
   * the total space allocated for the buffer's data. */ get capacity() {
        return this.#buf.buffer.byteLength;
    }
    /** Discards all but the first `n` unread bytes from the buffer but
   * continues to use the same allocated storage. It throws if `n` is
   * negative or greater than the length of the buffer. */ truncate(n) {
        if (n === 0) {
            this.reset();
            return;
        }
        if (n < 0 || n > this.length) {
            throw Error("bytes.Buffer: truncation out of range");
        }
        this.#reslice(this.#off + n);
    }
    reset() {
        this.#reslice(0);
        this.#off = 0;
    }
    #tryGrowByReslice = (n)=>{
        const l = this.#buf.byteLength;
        if (n <= this.capacity - l) {
            this.#reslice(l + n);
            return l;
        }
        return -1;
    };
    #reslice = (len)=>{
        assert(len <= this.#buf.buffer.byteLength);
        this.#buf = new Uint8Array(this.#buf.buffer, 0, len);
    };
    /** Reads the next `p.length` bytes from the buffer or until the buffer is
   * drained. Returns the number of bytes read. If the buffer has no data to
   * return, the return is EOF (`null`). */ readSync(p) {
        if (this.empty()) {
            // Buffer is empty, reset to recover space.
            this.reset();
            if (p.byteLength === 0) {
                // this edge case is tested in 'bufferReadEmptyAtEOF' test
                return 0;
            }
            return null;
        }
        const nread = copy(this.#buf.subarray(this.#off), p);
        this.#off += nread;
        return nread;
    }
    /** Reads the next `p.length` bytes from the buffer or until the buffer is
   * drained. Resolves to the number of bytes read. If the buffer has no
   * data to return, resolves to EOF (`null`).
   *
   * NOTE: This methods reads bytes synchronously; it's provided for
   * compatibility with `Reader` interfaces.
   */ read(p) {
        const rr = this.readSync(p);
        return Promise.resolve(rr);
    }
    writeSync(p) {
        const m = this.#grow(p.byteLength);
        return copy(p, this.#buf, m);
    }
    /** NOTE: This methods writes bytes synchronously; it's provided for
   * compatibility with `Writer` interface. */ write(p) {
        const n = this.writeSync(p);
        return Promise.resolve(n);
    }
    #grow = (n)=>{
        const m = this.length;
        // If buffer is empty, reset to recover space.
        if (m === 0 && this.#off !== 0) {
            this.reset();
        }
        // Fast: Try to grow by means of a reslice.
        const i = this.#tryGrowByReslice(n);
        if (i >= 0) {
            return i;
        }
        const c = this.capacity;
        if (n <= Math.floor(c / 2) - m) {
            // We can slide things down instead of allocating a new
            // ArrayBuffer. We only need m+n <= c to slide, but
            // we instead let capacity get twice as large so we
            // don't spend all our time copying.
            copy(this.#buf.subarray(this.#off), this.#buf);
        } else if (c + n > MAX_SIZE) {
            throw new Error("The buffer cannot be grown beyond the maximum size.");
        } else {
            // Not enough space anywhere, we need to allocate.
            const buf = new Uint8Array(Math.min(2 * c + n, MAX_SIZE));
            copy(this.#buf.subarray(this.#off), buf);
            this.#buf = buf;
        }
        // Restore this.#off and len(this.#buf).
        this.#off = 0;
        this.#reslice(Math.min(m + n, MAX_SIZE));
        return m;
    };
    /** Grows the buffer's capacity, if necessary, to guarantee space for
   * another `n` bytes. After `.grow(n)`, at least `n` bytes can be written to
   * the buffer without another allocation. If `n` is negative, `.grow()` will
   * throw. If the buffer can't grow it will throw an error.
   *
   * Based on Go Lang's
   * [Buffer.Grow](https://golang.org/pkg/bytes/#Buffer.Grow). */ grow(n) {
        if (n < 0) {
            throw Error("Buffer.grow: negative count");
        }
        const m = this.#grow(n);
        this.#reslice(m);
    }
    /** Reads data from `r` until EOF (`null`) and appends it to the buffer,
   * growing the buffer as needed. It resolves to the number of bytes read.
   * If the buffer becomes too large, `.readFrom()` will reject with an error.
   *
   * Based on Go Lang's
   * [Buffer.ReadFrom](https://golang.org/pkg/bytes/#Buffer.ReadFrom). */ async readFrom(r) {
        let n = 0;
        const tmp = new Uint8Array(MIN_READ);
        while(true){
            const shouldGrow = this.capacity - this.length < MIN_READ;
            // read into tmp buffer if there's not enough room
            // otherwise read directly into the internal buffer
            const buf = shouldGrow ? tmp : new Uint8Array(this.#buf.buffer, this.length);
            const nread = await r.read(buf);
            if (nread === null) {
                return n;
            }
            // write will grow if needed
            if (shouldGrow) this.writeSync(buf.subarray(0, nread));
            else this.#reslice(this.length + nread);
            n += nread;
        }
    }
    /** Reads data from `r` until EOF (`null`) and appends it to the buffer,
   * growing the buffer as needed. It returns the number of bytes read. If the
   * buffer becomes too large, `.readFromSync()` will throw an error.
   *
   * Based on Go Lang's
   * [Buffer.ReadFrom](https://golang.org/pkg/bytes/#Buffer.ReadFrom). */ readFromSync(r) {
        let n = 0;
        const tmp = new Uint8Array(MIN_READ);
        while(true){
            const shouldGrow = this.capacity - this.length < MIN_READ;
            // read into tmp buffer if there's not enough room
            // otherwise read directly into the internal buffer
            const buf = shouldGrow ? tmp : new Uint8Array(this.#buf.buffer, this.length);
            const nread = r.readSync(buf);
            if (nread === null) {
                return n;
            }
            // write will grow if needed
            if (shouldGrow) this.writeSync(buf.subarray(0, nread));
            else this.#reslice(this.length + nread);
            n += nread;
        }
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjk3LjAvaW8vYnVmZmVyLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjEgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi4vX3V0aWwvYXNzZXJ0LnRzXCI7XG5pbXBvcnQgeyBjb3B5IH0gZnJvbSBcIi4uL2J5dGVzL21vZC50c1wiO1xuaW1wb3J0IHR5cGUgeyBSZWFkZXIsIFJlYWRlclN5bmMgfSBmcm9tIFwiLi90eXBlcy5kLnRzXCI7XG5cbi8vIE1JTl9SRUFEIGlzIHRoZSBtaW5pbXVtIEFycmF5QnVmZmVyIHNpemUgcGFzc2VkIHRvIGEgcmVhZCBjYWxsIGJ5XG4vLyBidWZmZXIuUmVhZEZyb20uIEFzIGxvbmcgYXMgdGhlIEJ1ZmZlciBoYXMgYXQgbGVhc3QgTUlOX1JFQUQgYnl0ZXMgYmV5b25kXG4vLyB3aGF0IGlzIHJlcXVpcmVkIHRvIGhvbGQgdGhlIGNvbnRlbnRzIG9mIHIsIHJlYWRGcm9tKCkgd2lsbCBub3QgZ3JvdyB0aGVcbi8vIHVuZGVybHlpbmcgYnVmZmVyLlxuY29uc3QgTUlOX1JFQUQgPSAzMiAqIDEwMjQ7XG5jb25zdCBNQVhfU0laRSA9IDIgKiogMzIgLSAyO1xuXG4vKiogQSB2YXJpYWJsZS1zaXplZCBidWZmZXIgb2YgYnl0ZXMgd2l0aCBgcmVhZCgpYCBhbmQgYHdyaXRlKClgIG1ldGhvZHMuXG4gKlxuICogQnVmZmVyIGlzIGFsbW9zdCBhbHdheXMgdXNlZCB3aXRoIHNvbWUgSS9PIGxpa2UgZmlsZXMgYW5kIHNvY2tldHMuIEl0IGFsbG93c1xuICogb25lIHRvIGJ1ZmZlciB1cCBhIGRvd25sb2FkIGZyb20gYSBzb2NrZXQuIEJ1ZmZlciBncm93cyBhbmQgc2hyaW5rcyBhc1xuICogbmVjZXNzYXJ5LlxuICpcbiAqIEJ1ZmZlciBpcyBOT1QgdGhlIHNhbWUgdGhpbmcgYXMgTm9kZSdzIEJ1ZmZlci4gTm9kZSdzIEJ1ZmZlciB3YXMgY3JlYXRlZCBpblxuICogMjAwOSBiZWZvcmUgSmF2YVNjcmlwdCBoYWQgdGhlIGNvbmNlcHQgb2YgQXJyYXlCdWZmZXJzLiBJdCdzIHNpbXBseSBhXG4gKiBub24tc3RhbmRhcmQgQXJyYXlCdWZmZXIuXG4gKlxuICogQXJyYXlCdWZmZXIgaXMgYSBmaXhlZCBtZW1vcnkgYWxsb2NhdGlvbi4gQnVmZmVyIGlzIGltcGxlbWVudGVkIG9uIHRvcCBvZlxuICogQXJyYXlCdWZmZXIuXG4gKlxuICogQmFzZWQgb24gW0dvIEJ1ZmZlcl0oaHR0cHM6Ly9nb2xhbmcub3JnL3BrZy9ieXRlcy8jQnVmZmVyKS4gKi9cblxuZXhwb3J0IGNsYXNzIEJ1ZmZlciB7XG4gICNidWY6IFVpbnQ4QXJyYXk7IC8vIGNvbnRlbnRzIGFyZSB0aGUgYnl0ZXMgYnVmW29mZiA6IGxlbihidWYpXVxuICAjb2ZmID0gMDsgLy8gcmVhZCBhdCBidWZbb2ZmXSwgd3JpdGUgYXQgYnVmW2J1Zi5ieXRlTGVuZ3RoXVxuXG4gIGNvbnN0cnVjdG9yKGFiPzogQXJyYXlCdWZmZXJMaWtlIHwgQXJyYXlMaWtlPG51bWJlcj4pIHtcbiAgICB0aGlzLiNidWYgPSBhYiA9PT0gdW5kZWZpbmVkID8gbmV3IFVpbnQ4QXJyYXkoMCkgOiBuZXcgVWludDhBcnJheShhYik7XG4gIH1cblxuICAvKiogUmV0dXJucyBhIHNsaWNlIGhvbGRpbmcgdGhlIHVucmVhZCBwb3J0aW9uIG9mIHRoZSBidWZmZXIuXG4gICAqXG4gICAqIFRoZSBzbGljZSBpcyB2YWxpZCBmb3IgdXNlIG9ubHkgdW50aWwgdGhlIG5leHQgYnVmZmVyIG1vZGlmaWNhdGlvbiAodGhhdFxuICAgKiBpcywgb25seSB1bnRpbCB0aGUgbmV4dCBjYWxsIHRvIGEgbWV0aG9kIGxpa2UgYHJlYWQoKWAsIGB3cml0ZSgpYCxcbiAgICogYHJlc2V0KClgLCBvciBgdHJ1bmNhdGUoKWApLiBJZiBgb3B0aW9ucy5jb3B5YCBpcyBmYWxzZSB0aGUgc2xpY2UgYWxpYXNlcyB0aGUgYnVmZmVyIGNvbnRlbnQgYXRcbiAgICogbGVhc3QgdW50aWwgdGhlIG5leHQgYnVmZmVyIG1vZGlmaWNhdGlvbiwgc28gaW1tZWRpYXRlIGNoYW5nZXMgdG8gdGhlXG4gICAqIHNsaWNlIHdpbGwgYWZmZWN0IHRoZSByZXN1bHQgb2YgZnV0dXJlIHJlYWRzLlxuICAgKiBAcGFyYW0gb3B0aW9ucyBEZWZhdWx0cyB0byBgeyBjb3B5OiB0cnVlIH1gXG4gICAqL1xuICBieXRlcyhvcHRpb25zID0geyBjb3B5OiB0cnVlIH0pOiBVaW50OEFycmF5IHtcbiAgICBpZiAob3B0aW9ucy5jb3B5ID09PSBmYWxzZSkgcmV0dXJuIHRoaXMuI2J1Zi5zdWJhcnJheSh0aGlzLiNvZmYpO1xuICAgIHJldHVybiB0aGlzLiNidWYuc2xpY2UodGhpcy4jb2ZmKTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHdoZXRoZXIgdGhlIHVucmVhZCBwb3J0aW9uIG9mIHRoZSBidWZmZXIgaXMgZW1wdHkuICovXG4gIGVtcHR5KCk6IGJvb2xlYW4ge1xuICAgIHJldHVybiB0aGlzLiNidWYuYnl0ZUxlbmd0aCA8PSB0aGlzLiNvZmY7XG4gIH1cblxuICAvKiogQSByZWFkIG9ubHkgbnVtYmVyIG9mIGJ5dGVzIG9mIHRoZSB1bnJlYWQgcG9ydGlvbiBvZiB0aGUgYnVmZmVyLiAqL1xuICBnZXQgbGVuZ3RoKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuI2J1Zi5ieXRlTGVuZ3RoIC0gdGhpcy4jb2ZmO1xuICB9XG5cbiAgLyoqIFRoZSByZWFkIG9ubHkgY2FwYWNpdHkgb2YgdGhlIGJ1ZmZlcidzIHVuZGVybHlpbmcgYnl0ZSBzbGljZSwgdGhhdCBpcyxcbiAgICogdGhlIHRvdGFsIHNwYWNlIGFsbG9jYXRlZCBmb3IgdGhlIGJ1ZmZlcidzIGRhdGEuICovXG4gIGdldCBjYXBhY2l0eSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLiNidWYuYnVmZmVyLmJ5dGVMZW5ndGg7XG4gIH1cblxuICAvKiogRGlzY2FyZHMgYWxsIGJ1dCB0aGUgZmlyc3QgYG5gIHVucmVhZCBieXRlcyBmcm9tIHRoZSBidWZmZXIgYnV0XG4gICAqIGNvbnRpbnVlcyB0byB1c2UgdGhlIHNhbWUgYWxsb2NhdGVkIHN0b3JhZ2UuIEl0IHRocm93cyBpZiBgbmAgaXNcbiAgICogbmVnYXRpdmUgb3IgZ3JlYXRlciB0aGFuIHRoZSBsZW5ndGggb2YgdGhlIGJ1ZmZlci4gKi9cbiAgdHJ1bmNhdGUobjogbnVtYmVyKTogdm9pZCB7XG4gICAgaWYgKG4gPT09IDApIHtcbiAgICAgIHRoaXMucmVzZXQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKG4gPCAwIHx8IG4gPiB0aGlzLmxlbmd0aCkge1xuICAgICAgdGhyb3cgRXJyb3IoXCJieXRlcy5CdWZmZXI6IHRydW5jYXRpb24gb3V0IG9mIHJhbmdlXCIpO1xuICAgIH1cbiAgICB0aGlzLiNyZXNsaWNlKHRoaXMuI29mZiArIG4pO1xuICB9XG5cbiAgcmVzZXQoKTogdm9pZCB7XG4gICAgdGhpcy4jcmVzbGljZSgwKTtcbiAgICB0aGlzLiNvZmYgPSAwO1xuICB9XG5cbiAgI3RyeUdyb3dCeVJlc2xpY2UgPSAobjogbnVtYmVyKSA9PiB7XG4gICAgY29uc3QgbCA9IHRoaXMuI2J1Zi5ieXRlTGVuZ3RoO1xuICAgIGlmIChuIDw9IHRoaXMuY2FwYWNpdHkgLSBsKSB7XG4gICAgICB0aGlzLiNyZXNsaWNlKGwgKyBuKTtcbiAgICAgIHJldHVybiBsO1xuICAgIH1cbiAgICByZXR1cm4gLTE7XG4gIH07XG5cbiAgI3Jlc2xpY2UgPSAobGVuOiBudW1iZXIpID0+IHtcbiAgICBhc3NlcnQobGVuIDw9IHRoaXMuI2J1Zi5idWZmZXIuYnl0ZUxlbmd0aCk7XG4gICAgdGhpcy4jYnVmID0gbmV3IFVpbnQ4QXJyYXkodGhpcy4jYnVmLmJ1ZmZlciwgMCwgbGVuKTtcbiAgfTtcblxuICAvKiogUmVhZHMgdGhlIG5leHQgYHAubGVuZ3RoYCBieXRlcyBmcm9tIHRoZSBidWZmZXIgb3IgdW50aWwgdGhlIGJ1ZmZlciBpc1xuICAgKiBkcmFpbmVkLiBSZXR1cm5zIHRoZSBudW1iZXIgb2YgYnl0ZXMgcmVhZC4gSWYgdGhlIGJ1ZmZlciBoYXMgbm8gZGF0YSB0b1xuICAgKiByZXR1cm4sIHRoZSByZXR1cm4gaXMgRU9GIChgbnVsbGApLiAqL1xuICByZWFkU3luYyhwOiBVaW50OEFycmF5KTogbnVtYmVyIHwgbnVsbCB7XG4gICAgaWYgKHRoaXMuZW1wdHkoKSkge1xuICAgICAgLy8gQnVmZmVyIGlzIGVtcHR5LCByZXNldCB0byByZWNvdmVyIHNwYWNlLlxuICAgICAgdGhpcy5yZXNldCgpO1xuICAgICAgaWYgKHAuYnl0ZUxlbmd0aCA9PT0gMCkge1xuICAgICAgICAvLyB0aGlzIGVkZ2UgY2FzZSBpcyB0ZXN0ZWQgaW4gJ2J1ZmZlclJlYWRFbXB0eUF0RU9GJyB0ZXN0XG4gICAgICAgIHJldHVybiAwO1xuICAgICAgfVxuICAgICAgcmV0dXJuIG51bGw7XG4gICAgfVxuICAgIGNvbnN0IG5yZWFkID0gY29weSh0aGlzLiNidWYuc3ViYXJyYXkodGhpcy4jb2ZmKSwgcCk7XG4gICAgdGhpcy4jb2ZmICs9IG5yZWFkO1xuICAgIHJldHVybiBucmVhZDtcbiAgfVxuXG4gIC8qKiBSZWFkcyB0aGUgbmV4dCBgcC5sZW5ndGhgIGJ5dGVzIGZyb20gdGhlIGJ1ZmZlciBvciB1bnRpbCB0aGUgYnVmZmVyIGlzXG4gICAqIGRyYWluZWQuIFJlc29sdmVzIHRvIHRoZSBudW1iZXIgb2YgYnl0ZXMgcmVhZC4gSWYgdGhlIGJ1ZmZlciBoYXMgbm9cbiAgICogZGF0YSB0byByZXR1cm4sIHJlc29sdmVzIHRvIEVPRiAoYG51bGxgKS5cbiAgICpcbiAgICogTk9URTogVGhpcyBtZXRob2RzIHJlYWRzIGJ5dGVzIHN5bmNocm9ub3VzbHk7IGl0J3MgcHJvdmlkZWQgZm9yXG4gICAqIGNvbXBhdGliaWxpdHkgd2l0aCBgUmVhZGVyYCBpbnRlcmZhY2VzLlxuICAgKi9cbiAgcmVhZChwOiBVaW50OEFycmF5KTogUHJvbWlzZTxudW1iZXIgfCBudWxsPiB7XG4gICAgY29uc3QgcnIgPSB0aGlzLnJlYWRTeW5jKHApO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUocnIpO1xuICB9XG5cbiAgd3JpdGVTeW5jKHA6IFVpbnQ4QXJyYXkpOiBudW1iZXIge1xuICAgIGNvbnN0IG0gPSB0aGlzLiNncm93KHAuYnl0ZUxlbmd0aCk7XG4gICAgcmV0dXJuIGNvcHkocCwgdGhpcy4jYnVmLCBtKTtcbiAgfVxuXG4gIC8qKiBOT1RFOiBUaGlzIG1ldGhvZHMgd3JpdGVzIGJ5dGVzIHN5bmNocm9ub3VzbHk7IGl0J3MgcHJvdmlkZWQgZm9yXG4gICAqIGNvbXBhdGliaWxpdHkgd2l0aCBgV3JpdGVyYCBpbnRlcmZhY2UuICovXG4gIHdyaXRlKHA6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGNvbnN0IG4gPSB0aGlzLndyaXRlU3luYyhwKTtcbiAgICByZXR1cm4gUHJvbWlzZS5yZXNvbHZlKG4pO1xuICB9XG5cbiAgI2dyb3cgPSAobjogbnVtYmVyKSA9PiB7XG4gICAgY29uc3QgbSA9IHRoaXMubGVuZ3RoO1xuICAgIC8vIElmIGJ1ZmZlciBpcyBlbXB0eSwgcmVzZXQgdG8gcmVjb3ZlciBzcGFjZS5cbiAgICBpZiAobSA9PT0gMCAmJiB0aGlzLiNvZmYgIT09IDApIHtcbiAgICAgIHRoaXMucmVzZXQoKTtcbiAgICB9XG4gICAgLy8gRmFzdDogVHJ5IHRvIGdyb3cgYnkgbWVhbnMgb2YgYSByZXNsaWNlLlxuICAgIGNvbnN0IGkgPSB0aGlzLiN0cnlHcm93QnlSZXNsaWNlKG4pO1xuICAgIGlmIChpID49IDApIHtcbiAgICAgIHJldHVybiBpO1xuICAgIH1cbiAgICBjb25zdCBjID0gdGhpcy5jYXBhY2l0eTtcbiAgICBpZiAobiA8PSBNYXRoLmZsb29yKGMgLyAyKSAtIG0pIHtcbiAgICAgIC8vIFdlIGNhbiBzbGlkZSB0aGluZ3MgZG93biBpbnN0ZWFkIG9mIGFsbG9jYXRpbmcgYSBuZXdcbiAgICAgIC8vIEFycmF5QnVmZmVyLiBXZSBvbmx5IG5lZWQgbStuIDw9IGMgdG8gc2xpZGUsIGJ1dFxuICAgICAgLy8gd2UgaW5zdGVhZCBsZXQgY2FwYWNpdHkgZ2V0IHR3aWNlIGFzIGxhcmdlIHNvIHdlXG4gICAgICAvLyBkb24ndCBzcGVuZCBhbGwgb3VyIHRpbWUgY29weWluZy5cbiAgICAgIGNvcHkodGhpcy4jYnVmLnN1YmFycmF5KHRoaXMuI29mZiksIHRoaXMuI2J1Zik7XG4gICAgfSBlbHNlIGlmIChjICsgbiA+IE1BWF9TSVpFKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJUaGUgYnVmZmVyIGNhbm5vdCBiZSBncm93biBiZXlvbmQgdGhlIG1heGltdW0gc2l6ZS5cIik7XG4gICAgfSBlbHNlIHtcbiAgICAgIC8vIE5vdCBlbm91Z2ggc3BhY2UgYW55d2hlcmUsIHdlIG5lZWQgdG8gYWxsb2NhdGUuXG4gICAgICBjb25zdCBidWYgPSBuZXcgVWludDhBcnJheShNYXRoLm1pbigyICogYyArIG4sIE1BWF9TSVpFKSk7XG4gICAgICBjb3B5KHRoaXMuI2J1Zi5zdWJhcnJheSh0aGlzLiNvZmYpLCBidWYpO1xuICAgICAgdGhpcy4jYnVmID0gYnVmO1xuICAgIH1cbiAgICAvLyBSZXN0b3JlIHRoaXMuI29mZiBhbmQgbGVuKHRoaXMuI2J1ZikuXG4gICAgdGhpcy4jb2ZmID0gMDtcbiAgICB0aGlzLiNyZXNsaWNlKE1hdGgubWluKG0gKyBuLCBNQVhfU0laRSkpO1xuICAgIHJldHVybiBtO1xuICB9O1xuXG4gIC8qKiBHcm93cyB0aGUgYnVmZmVyJ3MgY2FwYWNpdHksIGlmIG5lY2Vzc2FyeSwgdG8gZ3VhcmFudGVlIHNwYWNlIGZvclxuICAgKiBhbm90aGVyIGBuYCBieXRlcy4gQWZ0ZXIgYC5ncm93KG4pYCwgYXQgbGVhc3QgYG5gIGJ5dGVzIGNhbiBiZSB3cml0dGVuIHRvXG4gICAqIHRoZSBidWZmZXIgd2l0aG91dCBhbm90aGVyIGFsbG9jYXRpb24uIElmIGBuYCBpcyBuZWdhdGl2ZSwgYC5ncm93KClgIHdpbGxcbiAgICogdGhyb3cuIElmIHRoZSBidWZmZXIgY2FuJ3QgZ3JvdyBpdCB3aWxsIHRocm93IGFuIGVycm9yLlxuICAgKlxuICAgKiBCYXNlZCBvbiBHbyBMYW5nJ3NcbiAgICogW0J1ZmZlci5Hcm93XShodHRwczovL2dvbGFuZy5vcmcvcGtnL2J5dGVzLyNCdWZmZXIuR3JvdykuICovXG4gIGdyb3cobjogbnVtYmVyKTogdm9pZCB7XG4gICAgaWYgKG4gPCAwKSB7XG4gICAgICB0aHJvdyBFcnJvcihcIkJ1ZmZlci5ncm93OiBuZWdhdGl2ZSBjb3VudFwiKTtcbiAgICB9XG4gICAgY29uc3QgbSA9IHRoaXMuI2dyb3cobik7XG4gICAgdGhpcy4jcmVzbGljZShtKTtcbiAgfVxuXG4gIC8qKiBSZWFkcyBkYXRhIGZyb20gYHJgIHVudGlsIEVPRiAoYG51bGxgKSBhbmQgYXBwZW5kcyBpdCB0byB0aGUgYnVmZmVyLFxuICAgKiBncm93aW5nIHRoZSBidWZmZXIgYXMgbmVlZGVkLiBJdCByZXNvbHZlcyB0byB0aGUgbnVtYmVyIG9mIGJ5dGVzIHJlYWQuXG4gICAqIElmIHRoZSBidWZmZXIgYmVjb21lcyB0b28gbGFyZ2UsIGAucmVhZEZyb20oKWAgd2lsbCByZWplY3Qgd2l0aCBhbiBlcnJvci5cbiAgICpcbiAgICogQmFzZWQgb24gR28gTGFuZydzXG4gICAqIFtCdWZmZXIuUmVhZEZyb21dKGh0dHBzOi8vZ29sYW5nLm9yZy9wa2cvYnl0ZXMvI0J1ZmZlci5SZWFkRnJvbSkuICovXG4gIGFzeW5jIHJlYWRGcm9tKHI6IFJlYWRlcik6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgbGV0IG4gPSAwO1xuICAgIGNvbnN0IHRtcCA9IG5ldyBVaW50OEFycmF5KE1JTl9SRUFEKTtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgY29uc3Qgc2hvdWxkR3JvdyA9IHRoaXMuY2FwYWNpdHkgLSB0aGlzLmxlbmd0aCA8IE1JTl9SRUFEO1xuICAgICAgLy8gcmVhZCBpbnRvIHRtcCBidWZmZXIgaWYgdGhlcmUncyBub3QgZW5vdWdoIHJvb21cbiAgICAgIC8vIG90aGVyd2lzZSByZWFkIGRpcmVjdGx5IGludG8gdGhlIGludGVybmFsIGJ1ZmZlclxuICAgICAgY29uc3QgYnVmID0gc2hvdWxkR3Jvd1xuICAgICAgICA/IHRtcFxuICAgICAgICA6IG5ldyBVaW50OEFycmF5KHRoaXMuI2J1Zi5idWZmZXIsIHRoaXMubGVuZ3RoKTtcblxuICAgICAgY29uc3QgbnJlYWQgPSBhd2FpdCByLnJlYWQoYnVmKTtcbiAgICAgIGlmIChucmVhZCA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbjtcbiAgICAgIH1cblxuICAgICAgLy8gd3JpdGUgd2lsbCBncm93IGlmIG5lZWRlZFxuICAgICAgaWYgKHNob3VsZEdyb3cpIHRoaXMud3JpdGVTeW5jKGJ1Zi5zdWJhcnJheSgwLCBucmVhZCkpO1xuICAgICAgZWxzZSB0aGlzLiNyZXNsaWNlKHRoaXMubGVuZ3RoICsgbnJlYWQpO1xuXG4gICAgICBuICs9IG5yZWFkO1xuICAgIH1cbiAgfVxuXG4gIC8qKiBSZWFkcyBkYXRhIGZyb20gYHJgIHVudGlsIEVPRiAoYG51bGxgKSBhbmQgYXBwZW5kcyBpdCB0byB0aGUgYnVmZmVyLFxuICAgKiBncm93aW5nIHRoZSBidWZmZXIgYXMgbmVlZGVkLiBJdCByZXR1cm5zIHRoZSBudW1iZXIgb2YgYnl0ZXMgcmVhZC4gSWYgdGhlXG4gICAqIGJ1ZmZlciBiZWNvbWVzIHRvbyBsYXJnZSwgYC5yZWFkRnJvbVN5bmMoKWAgd2lsbCB0aHJvdyBhbiBlcnJvci5cbiAgICpcbiAgICogQmFzZWQgb24gR28gTGFuZydzXG4gICAqIFtCdWZmZXIuUmVhZEZyb21dKGh0dHBzOi8vZ29sYW5nLm9yZy9wa2cvYnl0ZXMvI0J1ZmZlci5SZWFkRnJvbSkuICovXG4gIHJlYWRGcm9tU3luYyhyOiBSZWFkZXJTeW5jKTogbnVtYmVyIHtcbiAgICBsZXQgbiA9IDA7XG4gICAgY29uc3QgdG1wID0gbmV3IFVpbnQ4QXJyYXkoTUlOX1JFQUQpO1xuICAgIHdoaWxlICh0cnVlKSB7XG4gICAgICBjb25zdCBzaG91bGRHcm93ID0gdGhpcy5jYXBhY2l0eSAtIHRoaXMubGVuZ3RoIDwgTUlOX1JFQUQ7XG4gICAgICAvLyByZWFkIGludG8gdG1wIGJ1ZmZlciBpZiB0aGVyZSdzIG5vdCBlbm91Z2ggcm9vbVxuICAgICAgLy8gb3RoZXJ3aXNlIHJlYWQgZGlyZWN0bHkgaW50byB0aGUgaW50ZXJuYWwgYnVmZmVyXG4gICAgICBjb25zdCBidWYgPSBzaG91bGRHcm93XG4gICAgICAgID8gdG1wXG4gICAgICAgIDogbmV3IFVpbnQ4QXJyYXkodGhpcy4jYnVmLmJ1ZmZlciwgdGhpcy5sZW5ndGgpO1xuXG4gICAgICBjb25zdCBucmVhZCA9IHIucmVhZFN5bmMoYnVmKTtcbiAgICAgIGlmIChucmVhZCA9PT0gbnVsbCkge1xuICAgICAgICByZXR1cm4gbjtcbiAgICAgIH1cblxuICAgICAgLy8gd3JpdGUgd2lsbCBncm93IGlmIG5lZWRlZFxuICAgICAgaWYgKHNob3VsZEdyb3cpIHRoaXMud3JpdGVTeW5jKGJ1Zi5zdWJhcnJheSgwLCBucmVhZCkpO1xuICAgICAgZWxzZSB0aGlzLiNyZXNsaWNlKHRoaXMubGVuZ3RoICsgbnJlYWQpO1xuXG4gICAgICBuICs9IG5yZWFkO1xuICAgIH1cbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEVBQTBFLEFBQTFFLHdFQUEwRTtBQUMxRSxNQUFNLEdBQUcsTUFBTSxRQUFRLENBQW9CO0FBQzNDLE1BQU0sR0FBRyxJQUFJLFFBQVEsQ0FBaUI7QUFHdEMsRUFBb0UsQUFBcEUsa0VBQW9FO0FBQ3BFLEVBQTRFLEFBQTVFLDBFQUE0RTtBQUM1RSxFQUEyRSxBQUEzRSx5RUFBMkU7QUFDM0UsRUFBcUIsQUFBckIsbUJBQXFCO0FBQ3JCLEtBQUssQ0FBQyxRQUFRLEdBQUcsRUFBRSxHQUFHLElBQUk7QUFDMUIsS0FBSyxD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