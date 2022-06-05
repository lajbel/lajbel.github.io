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
     #tryGrowByReslice(n) {
        const l = this.#buf.byteLength;
        if (n <= this.capacity - l) {
            this.#reslice(l + n);
            return l;
        }
        return -1;
    }
     #reslice(len) {
        assert(len <= this.#buf.buffer.byteLength);
        this.#buf = new Uint8Array(this.#buf.buffer, 0, len);
    }
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
     #grow(n) {
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
    }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEwOS4wL2lvL2J1ZmZlci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0IHsgYXNzZXJ0IH0gZnJvbSBcIi4uL191dGlsL2Fzc2VydC50c1wiO1xuaW1wb3J0IHsgY29weSB9IGZyb20gXCIuLi9ieXRlcy9tb2QudHNcIjtcbmltcG9ydCB0eXBlIHsgUmVhZGVyLCBSZWFkZXJTeW5jIH0gZnJvbSBcIi4vdHlwZXMuZC50c1wiO1xuXG4vLyBNSU5fUkVBRCBpcyB0aGUgbWluaW11bSBBcnJheUJ1ZmZlciBzaXplIHBhc3NlZCB0byBhIHJlYWQgY2FsbCBieVxuLy8gYnVmZmVyLlJlYWRGcm9tLiBBcyBsb25nIGFzIHRoZSBCdWZmZXIgaGFzIGF0IGxlYXN0IE1JTl9SRUFEIGJ5dGVzIGJleW9uZFxuLy8gd2hhdCBpcyByZXF1aXJlZCB0byBob2xkIHRoZSBjb250ZW50cyBvZiByLCByZWFkRnJvbSgpIHdpbGwgbm90IGdyb3cgdGhlXG4vLyB1bmRlcmx5aW5nIGJ1ZmZlci5cbmNvbnN0IE1JTl9SRUFEID0gMzIgKiAxMDI0O1xuY29uc3QgTUFYX1NJWkUgPSAyICoqIDMyIC0gMjtcblxuLyoqIEEgdmFyaWFibGUtc2l6ZWQgYnVmZmVyIG9mIGJ5dGVzIHdpdGggYHJlYWQoKWAgYW5kIGB3cml0ZSgpYCBtZXRob2RzLlxuICpcbiAqIEJ1ZmZlciBpcyBhbG1vc3QgYWx3YXlzIHVzZWQgd2l0aCBzb21lIEkvTyBsaWtlIGZpbGVzIGFuZCBzb2NrZXRzLiBJdCBhbGxvd3NcbiAqIG9uZSB0byBidWZmZXIgdXAgYSBkb3dubG9hZCBmcm9tIGEgc29ja2V0LiBCdWZmZXIgZ3Jvd3MgYW5kIHNocmlua3MgYXNcbiAqIG5lY2Vzc2FyeS5cbiAqXG4gKiBCdWZmZXIgaXMgTk9UIHRoZSBzYW1lIHRoaW5nIGFzIE5vZGUncyBCdWZmZXIuIE5vZGUncyBCdWZmZXIgd2FzIGNyZWF0ZWQgaW5cbiAqIDIwMDkgYmVmb3JlIEphdmFTY3JpcHQgaGFkIHRoZSBjb25jZXB0IG9mIEFycmF5QnVmZmVycy4gSXQncyBzaW1wbHkgYVxuICogbm9uLXN0YW5kYXJkIEFycmF5QnVmZmVyLlxuICpcbiAqIEFycmF5QnVmZmVyIGlzIGEgZml4ZWQgbWVtb3J5IGFsbG9jYXRpb24uIEJ1ZmZlciBpcyBpbXBsZW1lbnRlZCBvbiB0b3Agb2ZcbiAqIEFycmF5QnVmZmVyLlxuICpcbiAqIEJhc2VkIG9uIFtHbyBCdWZmZXJdKGh0dHBzOi8vZ29sYW5nLm9yZy9wa2cvYnl0ZXMvI0J1ZmZlcikuICovXG5cbmV4cG9ydCBjbGFzcyBCdWZmZXIge1xuICAjYnVmOiBVaW50OEFycmF5OyAvLyBjb250ZW50cyBhcmUgdGhlIGJ5dGVzIGJ1ZltvZmYgOiBsZW4oYnVmKV1cbiAgI29mZiA9IDA7IC8vIHJlYWQgYXQgYnVmW29mZl0sIHdyaXRlIGF0IGJ1ZltidWYuYnl0ZUxlbmd0aF1cblxuICBjb25zdHJ1Y3RvcihhYj86IEFycmF5QnVmZmVyTGlrZSB8IEFycmF5TGlrZTxudW1iZXI+KSB7XG4gICAgdGhpcy4jYnVmID0gYWIgPT09IHVuZGVmaW5lZCA/IG5ldyBVaW50OEFycmF5KDApIDogbmV3IFVpbnQ4QXJyYXkoYWIpO1xuICB9XG5cbiAgLyoqIFJldHVybnMgYSBzbGljZSBob2xkaW5nIHRoZSB1bnJlYWQgcG9ydGlvbiBvZiB0aGUgYnVmZmVyLlxuICAgKlxuICAgKiBUaGUgc2xpY2UgaXMgdmFsaWQgZm9yIHVzZSBvbmx5IHVudGlsIHRoZSBuZXh0IGJ1ZmZlciBtb2RpZmljYXRpb24gKHRoYXRcbiAgICogaXMsIG9ubHkgdW50aWwgdGhlIG5leHQgY2FsbCB0byBhIG1ldGhvZCBsaWtlIGByZWFkKClgLCBgd3JpdGUoKWAsXG4gICAqIGByZXNldCgpYCwgb3IgYHRydW5jYXRlKClgKS4gSWYgYG9wdGlvbnMuY29weWAgaXMgZmFsc2UgdGhlIHNsaWNlIGFsaWFzZXMgdGhlIGJ1ZmZlciBjb250ZW50IGF0XG4gICAqIGxlYXN0IHVudGlsIHRoZSBuZXh0IGJ1ZmZlciBtb2RpZmljYXRpb24sIHNvIGltbWVkaWF0ZSBjaGFuZ2VzIHRvIHRoZVxuICAgKiBzbGljZSB3aWxsIGFmZmVjdCB0aGUgcmVzdWx0IG9mIGZ1dHVyZSByZWFkcy5cbiAgICogQHBhcmFtIG9wdGlvbnMgRGVmYXVsdHMgdG8gYHsgY29weTogdHJ1ZSB9YFxuICAgKi9cbiAgYnl0ZXMob3B0aW9ucyA9IHsgY29weTogdHJ1ZSB9KTogVWludDhBcnJheSB7XG4gICAgaWYgKG9wdGlvbnMuY29weSA9PT0gZmFsc2UpIHJldHVybiB0aGlzLiNidWYuc3ViYXJyYXkodGhpcy4jb2ZmKTtcbiAgICByZXR1cm4gdGhpcy4jYnVmLnNsaWNlKHRoaXMuI29mZik7XG4gIH1cblxuICAvKiogUmV0dXJucyB3aGV0aGVyIHRoZSB1bnJlYWQgcG9ydGlvbiBvZiB0aGUgYnVmZmVyIGlzIGVtcHR5LiAqL1xuICBlbXB0eSgpOiBib29sZWFuIHtcbiAgICByZXR1cm4gdGhpcy4jYnVmLmJ5dGVMZW5ndGggPD0gdGhpcy4jb2ZmO1xuICB9XG5cbiAgLyoqIEEgcmVhZCBvbmx5IG51bWJlciBvZiBieXRlcyBvZiB0aGUgdW5yZWFkIHBvcnRpb24gb2YgdGhlIGJ1ZmZlci4gKi9cbiAgZ2V0IGxlbmd0aCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLiNidWYuYnl0ZUxlbmd0aCAtIHRoaXMuI29mZjtcbiAgfVxuXG4gIC8qKiBUaGUgcmVhZCBvbmx5IGNhcGFjaXR5IG9mIHRoZSBidWZmZXIncyB1bmRlcmx5aW5nIGJ5dGUgc2xpY2UsIHRoYXQgaXMsXG4gICAqIHRoZSB0b3RhbCBzcGFjZSBhbGxvY2F0ZWQgZm9yIHRoZSBidWZmZXIncyBkYXRhLiAqL1xuICBnZXQgY2FwYWNpdHkoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy4jYnVmLmJ1ZmZlci5ieXRlTGVuZ3RoO1xuICB9XG5cbiAgLyoqIERpc2NhcmRzIGFsbCBidXQgdGhlIGZpcnN0IGBuYCB1bnJlYWQgYnl0ZXMgZnJvbSB0aGUgYnVmZmVyIGJ1dFxuICAgKiBjb250aW51ZXMgdG8gdXNlIHRoZSBzYW1lIGFsbG9jYXRlZCBzdG9yYWdlLiBJdCB0aHJvd3MgaWYgYG5gIGlzXG4gICAqIG5lZ2F0aXZlIG9yIGdyZWF0ZXIgdGhhbiB0aGUgbGVuZ3RoIG9mIHRoZSBidWZmZXIuICovXG4gIHRydW5jYXRlKG46IG51bWJlcik6IHZvaWQge1xuICAgIGlmIChuID09PSAwKSB7XG4gICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmIChuIDwgMCB8fCBuID4gdGhpcy5sZW5ndGgpIHtcbiAgICAgIHRocm93IEVycm9yKFwiYnl0ZXMuQnVmZmVyOiB0cnVuY2F0aW9uIG91dCBvZiByYW5nZVwiKTtcbiAgICB9XG4gICAgdGhpcy4jcmVzbGljZSh0aGlzLiNvZmYgKyBuKTtcbiAgfVxuXG4gIHJlc2V0KCk6IHZvaWQge1xuICAgIHRoaXMuI3Jlc2xpY2UoMCk7XG4gICAgdGhpcy4jb2ZmID0gMDtcbiAgfVxuXG4gICN0cnlHcm93QnlSZXNsaWNlKG46IG51bWJlcikge1xuICAgIGNvbnN0IGwgPSB0aGlzLiNidWYuYnl0ZUxlbmd0aDtcbiAgICBpZiAobiA8PSB0aGlzLmNhcGFjaXR5IC0gbCkge1xuICAgICAgdGhpcy4jcmVzbGljZShsICsgbik7XG4gICAgICByZXR1cm4gbDtcbiAgICB9XG4gICAgcmV0dXJuIC0xO1xuICB9XG5cbiAgI3Jlc2xpY2UobGVuOiBudW1iZXIpIHtcbiAgICBhc3NlcnQobGVuIDw9IHRoaXMuI2J1Zi5idWZmZXIuYnl0ZUxlbmd0aCk7XG4gICAgdGhpcy4jYnVmID0gbmV3IFVpbnQ4QXJyYXkodGhpcy4jYnVmLmJ1ZmZlciwgMCwgbGVuKTtcbiAgfVxuXG4gIC8qKiBSZWFkcyB0aGUgbmV4dCBgcC5sZW5ndGhgIGJ5dGVzIGZyb20gdGhlIGJ1ZmZlciBvciB1bnRpbCB0aGUgYnVmZmVyIGlzXG4gICAqIGRyYWluZWQuIFJldHVybnMgdGhlIG51bWJlciBvZiBieXRlcyByZWFkLiBJZiB0aGUgYnVmZmVyIGhhcyBubyBkYXRhIHRvXG4gICAqIHJldHVybiwgdGhlIHJldHVybiBpcyBFT0YgKGBudWxsYCkuICovXG4gIHJlYWRTeW5jKHA6IFVpbnQ4QXJyYXkpOiBudW1iZXIgfCBudWxsIHtcbiAgICBpZiAodGhpcy5lbXB0eSgpKSB7XG4gICAgICAvLyBCdWZmZXIgaXMgZW1wdHksIHJlc2V0IHRvIHJlY292ZXIgc3BhY2UuXG4gICAgICB0aGlzLnJlc2V0KCk7XG4gICAgICBpZiAocC5ieXRlTGVuZ3RoID09PSAwKSB7XG4gICAgICAgIC8vIHRoaXMgZWRnZSBjYXNlIGlzIHRlc3RlZCBpbiAnYnVmZmVyUmVhZEVtcHR5QXRFT0YnIHRlc3RcbiAgICAgICAgcmV0dXJuIDA7XG4gICAgICB9XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9XG4gICAgY29uc3QgbnJlYWQgPSBjb3B5KHRoaXMuI2J1Zi5zdWJhcnJheSh0aGlzLiNvZmYpLCBwKTtcbiAgICB0aGlzLiNvZmYgKz0gbnJlYWQ7XG4gICAgcmV0dXJuIG5yZWFkO1xuICB9XG5cbiAgLyoqIFJlYWRzIHRoZSBuZXh0IGBwLmxlbmd0aGAgYnl0ZXMgZnJvbSB0aGUgYnVmZmVyIG9yIHVudGlsIHRoZSBidWZmZXIgaXNcbiAgICogZHJhaW5lZC4gUmVzb2x2ZXMgdG8gdGhlIG51bWJlciBvZiBieXRlcyByZWFkLiBJZiB0aGUgYnVmZmVyIGhhcyBub1xuICAgKiBkYXRhIHRvIHJldHVybiwgcmVzb2x2ZXMgdG8gRU9GIChgbnVsbGApLlxuICAgKlxuICAgKiBOT1RFOiBUaGlzIG1ldGhvZHMgcmVhZHMgYnl0ZXMgc3luY2hyb25vdXNseTsgaXQncyBwcm92aWRlZCBmb3JcbiAgICogY29tcGF0aWJpbGl0eSB3aXRoIGBSZWFkZXJgIGludGVyZmFjZXMuXG4gICAqL1xuICByZWFkKHA6IFVpbnQ4QXJyYXkpOiBQcm9taXNlPG51bWJlciB8IG51bGw+IHtcbiAgICBjb25zdCByciA9IHRoaXMucmVhZFN5bmMocCk7XG4gICAgcmV0dXJuIFByb21pc2UucmVzb2x2ZShycik7XG4gIH1cblxuICB3cml0ZVN5bmMocDogVWludDhBcnJheSk6IG51bWJlciB7XG4gICAgY29uc3QgbSA9IHRoaXMuI2dyb3cocC5ieXRlTGVuZ3RoKTtcbiAgICByZXR1cm4gY29weShwLCB0aGlzLiNidWYsIG0pO1xuICB9XG5cbiAgLyoqIE5PVEU6IFRoaXMgbWV0aG9kcyB3cml0ZXMgYnl0ZXMgc3luY2hyb25vdXNseTsgaXQncyBwcm92aWRlZCBmb3JcbiAgICogY29tcGF0aWJpbGl0eSB3aXRoIGBXcml0ZXJgIGludGVyZmFjZS4gKi9cbiAgd3JpdGUocDogVWludDhBcnJheSk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgY29uc3QgbiA9IHRoaXMud3JpdGVTeW5jKHApO1xuICAgIHJldHVybiBQcm9taXNlLnJlc29sdmUobik7XG4gIH1cblxuICAjZ3JvdyhuOiBudW1iZXIpIHtcbiAgICBjb25zdCBtID0gdGhpcy5sZW5ndGg7XG4gICAgLy8gSWYgYnVmZmVyIGlzIGVtcHR5LCByZXNldCB0byByZWNvdmVyIHNwYWNlLlxuICAgIGlmIChtID09PSAwICYmIHRoaXMuI29mZiAhPT0gMCkge1xuICAgICAgdGhpcy5yZXNldCgpO1xuICAgIH1cbiAgICAvLyBGYXN0OiBUcnkgdG8gZ3JvdyBieSBtZWFucyBvZiBhIHJlc2xpY2UuXG4gICAgY29uc3QgaSA9IHRoaXMuI3RyeUdyb3dCeVJlc2xpY2Uobik7XG4gICAgaWYgKGkgPj0gMCkge1xuICAgICAgcmV0dXJuIGk7XG4gICAgfVxuICAgIGNvbnN0IGMgPSB0aGlzLmNhcGFjaXR5O1xuICAgIGlmIChuIDw9IE1hdGguZmxvb3IoYyAvIDIpIC0gbSkge1xuICAgICAgLy8gV2UgY2FuIHNsaWRlIHRoaW5ncyBkb3duIGluc3RlYWQgb2YgYWxsb2NhdGluZyBhIG5ld1xuICAgICAgLy8gQXJyYXlCdWZmZXIuIFdlIG9ubHkgbmVlZCBtK24gPD0gYyB0byBzbGlkZSwgYnV0XG4gICAgICAvLyB3ZSBpbnN0ZWFkIGxldCBjYXBhY2l0eSBnZXQgdHdpY2UgYXMgbGFyZ2Ugc28gd2VcbiAgICAgIC8vIGRvbid0IHNwZW5kIGFsbCBvdXIgdGltZSBjb3B5aW5nLlxuICAgICAgY29weSh0aGlzLiNidWYuc3ViYXJyYXkodGhpcy4jb2ZmKSwgdGhpcy4jYnVmKTtcbiAgICB9IGVsc2UgaWYgKGMgKyBuID4gTUFYX1NJWkUpIHtcbiAgICAgIHRocm93IG5ldyBFcnJvcihcIlRoZSBidWZmZXIgY2Fubm90IGJlIGdyb3duIGJleW9uZCB0aGUgbWF4aW11bSBzaXplLlwiKTtcbiAgICB9IGVsc2Uge1xuICAgICAgLy8gTm90IGVub3VnaCBzcGFjZSBhbnl3aGVyZSwgd2UgbmVlZCB0byBhbGxvY2F0ZS5cbiAgICAgIGNvbnN0IGJ1ZiA9IG5ldyBVaW50OEFycmF5KE1hdGgubWluKDIgKiBjICsgbiwgTUFYX1NJWkUpKTtcbiAgICAgIGNvcHkodGhpcy4jYnVmLnN1YmFycmF5KHRoaXMuI29mZiksIGJ1Zik7XG4gICAgICB0aGlzLiNidWYgPSBidWY7XG4gICAgfVxuICAgIC8vIFJlc3RvcmUgdGhpcy4jb2ZmIGFuZCBsZW4odGhpcy4jYnVmKS5cbiAgICB0aGlzLiNvZmYgPSAwO1xuICAgIHRoaXMuI3Jlc2xpY2UoTWF0aC5taW4obSArIG4sIE1BWF9TSVpFKSk7XG4gICAgcmV0dXJuIG07XG4gIH1cblxuICAvKiogR3Jvd3MgdGhlIGJ1ZmZlcidzIGNhcGFjaXR5LCBpZiBuZWNlc3NhcnksIHRvIGd1YXJhbnRlZSBzcGFjZSBmb3JcbiAgICogYW5vdGhlciBgbmAgYnl0ZXMuIEFmdGVyIGAuZ3JvdyhuKWAsIGF0IGxlYXN0IGBuYCBieXRlcyBjYW4gYmUgd3JpdHRlbiB0b1xuICAgKiB0aGUgYnVmZmVyIHdpdGhvdXQgYW5vdGhlciBhbGxvY2F0aW9uLiBJZiBgbmAgaXMgbmVnYXRpdmUsIGAuZ3JvdygpYCB3aWxsXG4gICAqIHRocm93LiBJZiB0aGUgYnVmZmVyIGNhbid0IGdyb3cgaXQgd2lsbCB0aHJvdyBhbiBlcnJvci5cbiAgICpcbiAgICogQmFzZWQgb24gR28gTGFuZydzXG4gICAqIFtCdWZmZXIuR3Jvd10oaHR0cHM6Ly9nb2xhbmcub3JnL3BrZy9ieXRlcy8jQnVmZmVyLkdyb3cpLiAqL1xuICBncm93KG46IG51bWJlcik6IHZvaWQge1xuICAgIGlmIChuIDwgMCkge1xuICAgICAgdGhyb3cgRXJyb3IoXCJCdWZmZXIuZ3JvdzogbmVnYXRpdmUgY291bnRcIik7XG4gICAgfVxuICAgIGNvbnN0IG0gPSB0aGlzLiNncm93KG4pO1xuICAgIHRoaXMuI3Jlc2xpY2UobSk7XG4gIH1cblxuICAvKiogUmVhZHMgZGF0YSBmcm9tIGByYCB1bnRpbCBFT0YgKGBudWxsYCkgYW5kIGFwcGVuZHMgaXQgdG8gdGhlIGJ1ZmZlcixcbiAgICogZ3Jvd2luZyB0aGUgYnVmZmVyIGFzIG5lZWRlZC4gSXQgcmVzb2x2ZXMgdG8gdGhlIG51bWJlciBvZiBieXRlcyByZWFkLlxuICAgKiBJZiB0aGUgYnVmZmVyIGJlY29tZXMgdG9vIGxhcmdlLCBgLnJlYWRGcm9tKClgIHdpbGwgcmVqZWN0IHdpdGggYW4gZXJyb3IuXG4gICAqXG4gICAqIEJhc2VkIG9uIEdvIExhbmcnc1xuICAgKiBbQnVmZmVyLlJlYWRGcm9tXShodHRwczovL2dvbGFuZy5vcmcvcGtnL2J5dGVzLyNCdWZmZXIuUmVhZEZyb20pLiAqL1xuICBhc3luYyByZWFkRnJvbShyOiBSZWFkZXIpOiBQcm9taXNlPG51bWJlcj4ge1xuICAgIGxldCBuID0gMDtcbiAgICBjb25zdCB0bXAgPSBuZXcgVWludDhBcnJheShNSU5fUkVBRCk7XG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIGNvbnN0IHNob3VsZEdyb3cgPSB0aGlzLmNhcGFjaXR5IC0gdGhpcy5sZW5ndGggPCBNSU5fUkVBRDtcbiAgICAgIC8vIHJlYWQgaW50byB0bXAgYnVmZmVyIGlmIHRoZXJlJ3Mgbm90IGVub3VnaCByb29tXG4gICAgICAvLyBvdGhlcndpc2UgcmVhZCBkaXJlY3RseSBpbnRvIHRoZSBpbnRlcm5hbCBidWZmZXJcbiAgICAgIGNvbnN0IGJ1ZiA9IHNob3VsZEdyb3dcbiAgICAgICAgPyB0bXBcbiAgICAgICAgOiBuZXcgVWludDhBcnJheSh0aGlzLiNidWYuYnVmZmVyLCB0aGlzLmxlbmd0aCk7XG5cbiAgICAgIGNvbnN0IG5yZWFkID0gYXdhaXQgci5yZWFkKGJ1Zik7XG4gICAgICBpZiAobnJlYWQgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG47XG4gICAgICB9XG5cbiAgICAgIC8vIHdyaXRlIHdpbGwgZ3JvdyBpZiBuZWVkZWRcbiAgICAgIGlmIChzaG91bGRHcm93KSB0aGlzLndyaXRlU3luYyhidWYuc3ViYXJyYXkoMCwgbnJlYWQpKTtcbiAgICAgIGVsc2UgdGhpcy4jcmVzbGljZSh0aGlzLmxlbmd0aCArIG5yZWFkKTtcblxuICAgICAgbiArPSBucmVhZDtcbiAgICB9XG4gIH1cblxuICAvKiogUmVhZHMgZGF0YSBmcm9tIGByYCB1bnRpbCBFT0YgKGBudWxsYCkgYW5kIGFwcGVuZHMgaXQgdG8gdGhlIGJ1ZmZlcixcbiAgICogZ3Jvd2luZyB0aGUgYnVmZmVyIGFzIG5lZWRlZC4gSXQgcmV0dXJucyB0aGUgbnVtYmVyIG9mIGJ5dGVzIHJlYWQuIElmIHRoZVxuICAgKiBidWZmZXIgYmVjb21lcyB0b28gbGFyZ2UsIGAucmVhZEZyb21TeW5jKClgIHdpbGwgdGhyb3cgYW4gZXJyb3IuXG4gICAqXG4gICAqIEJhc2VkIG9uIEdvIExhbmcnc1xuICAgKiBbQnVmZmVyLlJlYWRGcm9tXShodHRwczovL2dvbGFuZy5vcmcvcGtnL2J5dGVzLyNCdWZmZXIuUmVhZEZyb20pLiAqL1xuICByZWFkRnJvbVN5bmMocjogUmVhZGVyU3luYyk6IG51bWJlciB7XG4gICAgbGV0IG4gPSAwO1xuICAgIGNvbnN0IHRtcCA9IG5ldyBVaW50OEFycmF5KE1JTl9SRUFEKTtcbiAgICB3aGlsZSAodHJ1ZSkge1xuICAgICAgY29uc3Qgc2hvdWxkR3JvdyA9IHRoaXMuY2FwYWNpdHkgLSB0aGlzLmxlbmd0aCA8IE1JTl9SRUFEO1xuICAgICAgLy8gcmVhZCBpbnRvIHRtcCBidWZmZXIgaWYgdGhlcmUncyBub3QgZW5vdWdoIHJvb21cbiAgICAgIC8vIG90aGVyd2lzZSByZWFkIGRpcmVjdGx5IGludG8gdGhlIGludGVybmFsIGJ1ZmZlclxuICAgICAgY29uc3QgYnVmID0gc2hvdWxkR3Jvd1xuICAgICAgICA/IHRtcFxuICAgICAgICA6IG5ldyBVaW50OEFycmF5KHRoaXMuI2J1Zi5idWZmZXIsIHRoaXMubGVuZ3RoKTtcblxuICAgICAgY29uc3QgbnJlYWQgPSByLnJlYWRTeW5jKGJ1Zik7XG4gICAgICBpZiAobnJlYWQgPT09IG51bGwpIHtcbiAgICAgICAgcmV0dXJuIG47XG4gICAgICB9XG5cbiAgICAgIC8vIHdyaXRlIHdpbGwgZ3JvdyBpZiBuZWVkZWRcbiAgICAgIGlmIChzaG91bGRHcm93KSB0aGlzLndyaXRlU3luYyhidWYuc3ViYXJyYXkoMCwgbnJlYWQpKTtcbiAgICAgIGVsc2UgdGhpcy4jcmVzbGljZSh0aGlzLmxlbmd0aCArIG5yZWFkKTtcblxuICAgICAgbiArPSBucmVhZDtcbiAgICB9XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxFQUEwRSxBQUExRSx3RUFBMEU7QUFDMUUsTUFBTSxHQUFHLE1BQU0sUUFBUSxDQUFvQjtBQUMzQyxNQUFNLEdBQUcsSUFBSSxRQUFRLENBQWlCO0FBR3RDLEVBQW9FLEFBQXBFLGtFQUFvRTtBQUNwRSxFQUE0RSxBQUE1RSwwRUFBNEU7QUFDNUUsRUFBMkUsQUFBM0UseUVBQTJFO0FBQzNFLEVBQXFCLEFBQXJCLG1CQUFxQjtBQUNyQixLQUFLLENBQUMsUUFBUSxHQUFHLEVBQUUsR0FBRyxJQUFJO0FBQzFCLEtBQUssQ0FBQyxRQUFRLEdBQUcsQ0FBQyxJ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