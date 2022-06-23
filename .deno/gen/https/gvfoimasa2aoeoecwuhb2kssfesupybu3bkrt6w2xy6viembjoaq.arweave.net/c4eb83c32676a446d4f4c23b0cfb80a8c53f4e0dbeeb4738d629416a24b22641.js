import { copy } from "../bytes/mod.ts";
import { assert } from "../_util/assert.ts";
import { BytesList } from "../bytes/bytes_list.ts";
import { writeAll, writeAllSync } from "./util.ts";
const DEFAULT_BUF_SIZE = 4096;
const MIN_BUF_SIZE = 16;
const MAX_CONSECUTIVE_EMPTY_READS = 100;
const CR = "\r".charCodeAt(0);
const LF = "\n".charCodeAt(0);
export class BufferFullError extends Error {
    partial;
    name = "BufferFullError";
    constructor(partial){
        super("Buffer full");
        this.partial = partial;
    }
}
export class PartialReadError extends Error {
    name = "PartialReadError";
    partial;
    constructor(){
        super("Encountered UnexpectedEof, data only partially read");
    }
}
/** BufReader implements buffering for a Reader object. */ export class BufReader {
    buf;
    rd;
    r = 0;
    w = 0;
    eof = false;
    // private lastByte: number;
    // private lastCharSize: number;
    /** return new BufReader unless r is BufReader */ static create(r, size = DEFAULT_BUF_SIZE) {
        return r instanceof BufReader ? r : new BufReader(r, size);
    }
    constructor(rd, size = DEFAULT_BUF_SIZE){
        if (size < MIN_BUF_SIZE) {
            size = MIN_BUF_SIZE;
        }
        this._reset(new Uint8Array(size), rd);
    }
    /** Returns the size of the underlying buffer in bytes. */ size() {
        return this.buf.byteLength;
    }
    buffered() {
        return this.w - this.r;
    }
    // Reads a new chunk into the buffer.
    async _fill() {
        // Slide existing data to beginning.
        if (this.r > 0) {
            this.buf.copyWithin(0, this.r, this.w);
            this.w -= this.r;
            this.r = 0;
        }
        if (this.w >= this.buf.byteLength) {
            throw Error("bufio: tried to fill full buffer");
        }
        // Read new data: try a limited number of times.
        for(let i = MAX_CONSECUTIVE_EMPTY_READS; i > 0; i--){
            const rr = await this.rd.read(this.buf.subarray(this.w));
            if (rr === null) {
                this.eof = true;
                return;
            }
            assert(rr >= 0, "negative read");
            this.w += rr;
            if (rr > 0) {
                return;
            }
        }
        throw new Error(`No progress after ${MAX_CONSECUTIVE_EMPTY_READS} read() calls`);
    }
    /** Discards any buffered data, resets all state, and switches
   * the buffered reader to read from r.
   */ reset(r) {
        this._reset(this.buf, r);
    }
    _reset(buf, rd) {
        this.buf = buf;
        this.rd = rd;
        this.eof = false;
    // this.lastByte = -1;
    // this.lastCharSize = -1;
    }
    /** reads data into p.
   * It returns the number of bytes read into p.
   * The bytes are taken from at most one Read on the underlying Reader,
   * hence n may be less than len(p).
   * To read exactly len(p) bytes, use io.ReadFull(b, p).
   */ async read(p) {
        let rr = p.byteLength;
        if (p.byteLength === 0) return rr;
        if (this.r === this.w) {
            if (p.byteLength >= this.buf.byteLength) {
                // Large read, empty buffer.
                // Read directly into p to avoid copy.
                const rr = await this.rd.read(p);
                const nread = rr ?? 0;
                assert(nread >= 0, "negative read");
                // if (rr.nread > 0) {
                //   this.lastByte = p[rr.nread - 1];
                //   this.lastCharSize = -1;
                // }
                return rr;
            }
            // One read.
            // Do not use this.fill, which will loop.
            this.r = 0;
            this.w = 0;
            rr = await this.rd.read(this.buf);
            if (rr === 0 || rr === null) return rr;
            assert(rr >= 0, "negative read");
            this.w += rr;
        }
        // copy as much as we can
        const copied = copy(this.buf.subarray(this.r, this.w), p, 0);
        this.r += copied;
        // this.lastByte = this.buf[this.r - 1];
        // this.lastCharSize = -1;
        return copied;
    }
    /** reads exactly `p.length` bytes into `p`.
   *
   * If successful, `p` is returned.
   *
   * If the end of the underlying stream has been reached, and there are no more
   * bytes available in the buffer, `readFull()` returns `null` instead.
   *
   * An error is thrown if some bytes could be read, but not enough to fill `p`
   * entirely before the underlying stream reported an error or EOF. Any error
   * thrown will have a `partial` property that indicates the slice of the
   * buffer that has been successfully filled with data.
   *
   * Ported from https://golang.org/pkg/io/#ReadFull
   */ async readFull(p) {
        let bytesRead = 0;
        while(bytesRead < p.length){
            try {
                const rr = await this.read(p.subarray(bytesRead));
                if (rr === null) {
                    if (bytesRead === 0) {
                        return null;
                    } else {
                        throw new PartialReadError();
                    }
                }
                bytesRead += rr;
            } catch (err) {
                err.partial = p.subarray(0, bytesRead);
                throw err;
            }
        }
        return p;
    }
    /** Returns the next byte [0, 255] or `null`. */ async readByte() {
        while(this.r === this.w){
            if (this.eof) return null;
            await this._fill(); // buffer is empty.
        }
        const c = this.buf[this.r];
        this.r++;
        // this.lastByte = c;
        return c;
    }
    /** readString() reads until the first occurrence of delim in the input,
   * returning a string containing the data up to and including the delimiter.
   * If ReadString encounters an error before finding a delimiter,
   * it returns the data read before the error and the error itself
   * (often `null`).
   * ReadString returns err != nil if and only if the returned data does not end
   * in delim.
   * For simple uses, a Scanner may be more convenient.
   */ async readString(delim) {
        if (delim.length !== 1) {
            throw new Error("Delimiter should be a single character");
        }
        const buffer = await this.readSlice(delim.charCodeAt(0));
        if (buffer === null) return null;
        return new TextDecoder().decode(buffer);
    }
    /** `readLine()` is a low-level line-reading primitive. Most callers should
   * use `readString('\n')` instead or use a Scanner.
   *
   * `readLine()` tries to return a single line, not including the end-of-line
   * bytes. If the line was too long for the buffer then `more` is set and the
   * beginning of the line is returned. The rest of the line will be returned
   * from future calls. `more` will be false when returning the last fragment
   * of the line. The returned buffer is only valid until the next call to
   * `readLine()`.
   *
   * The text returned from ReadLine does not include the line end ("\r\n" or
   * "\n").
   *
   * When the end of the underlying stream is reached, the final bytes in the
   * stream are returned. No indication or error is given if the input ends
   * without a final line end. When there are no more trailing bytes to read,
   * `readLine()` returns `null`.
   *
   * Calling `unreadByte()` after `readLine()` will always unread the last byte
   * read (possibly a character belonging to the line end) even if that byte is
   * not part of the line returned by `readLine()`.
   */ async readLine() {
        let line;
        try {
            line = await this.readSlice(LF);
        } catch (err) {
            let { partial  } = err;
            assert(partial instanceof Uint8Array, "bufio: caught error from `readSlice()` without `partial` property");
            // Don't throw if `readSlice()` failed with `BufferFullError`, instead we
            // just return whatever is available and set the `more` flag.
            if (!(err instanceof BufferFullError)) {
                throw err;
            }
            // Handle the case where "\r\n" straddles the buffer.
            if (!this.eof && partial.byteLength > 0 && partial[partial.byteLength - 1] === CR) {
                // Put the '\r' back on buf and drop it from line.
                // Let the next call to ReadLine check for "\r\n".
                assert(this.r > 0, "bufio: tried to rewind past start of buffer");
                this.r--;
                partial = partial.subarray(0, partial.byteLength - 1);
            }
            return {
                line: partial,
                more: !this.eof
            };
        }
        if (line === null) {
            return null;
        }
        if (line.byteLength === 0) {
            return {
                line,
                more: false
            };
        }
        if (line[line.byteLength - 1] == LF) {
            let drop = 1;
            if (line.byteLength > 1 && line[line.byteLength - 2] === CR) {
                drop = 2;
            }
            line = line.subarray(0, line.byteLength - drop);
        }
        return {
            line,
            more: false
        };
    }
    /** `readSlice()` reads until the first occurrence of `delim` in the input,
   * returning a slice pointing at the bytes in the buffer. The bytes stop
   * being valid at the next read.
   *
   * If `readSlice()` encounters an error before finding a delimiter, or the
   * buffer fills without finding a delimiter, it throws an error with a
   * `partial` property that contains the entire buffer.
   *
   * If `readSlice()` encounters the end of the underlying stream and there are
   * any bytes left in the buffer, the rest of the buffer is returned. In other
   * words, EOF is always treated as a delimiter. Once the buffer is empty,
   * it returns `null`.
   *
   * Because the data returned from `readSlice()` will be overwritten by the
   * next I/O operation, most clients should use `readString()` instead.
   */ async readSlice(delim) {
        let s = 0; // search start index
        let slice;
        while(true){
            // Search buffer.
            let i = this.buf.subarray(this.r + s, this.w).indexOf(delim);
            if (i >= 0) {
                i += s;
                slice = this.buf.subarray(this.r, this.r + i + 1);
                this.r += i + 1;
                break;
            }
            // EOF?
            if (this.eof) {
                if (this.r === this.w) {
                    return null;
                }
                slice = this.buf.subarray(this.r, this.w);
                this.r = this.w;
                break;
            }
            // Buffer full?
            if (this.buffered() >= this.buf.byteLength) {
                this.r = this.w;
                // #4521 The internal buffer should not be reused across reads because it causes corruption of data.
                const oldbuf = this.buf;
                const newbuf = this.buf.slice(0);
                this.buf = newbuf;
                throw new BufferFullError(oldbuf);
            }
            s = this.w - this.r; // do not rescan area we scanned before
            // Buffer is not full.
            try {
                await this._fill();
            } catch (err) {
                err.partial = slice;
                throw err;
            }
        }
        // Handle last byte, if any.
        // const i = slice.byteLength - 1;
        // if (i >= 0) {
        //   this.lastByte = slice[i];
        //   this.lastCharSize = -1
        // }
        return slice;
    }
    /** `peek()` returns the next `n` bytes without advancing the reader. The
   * bytes stop being valid at the next read call.
   *
   * When the end of the underlying stream is reached, but there are unread
   * bytes left in the buffer, those bytes are returned. If there are no bytes
   * left in the buffer, it returns `null`.
   *
   * If an error is encountered before `n` bytes are available, `peek()` throws
   * an error with the `partial` property set to a slice of the buffer that
   * contains the bytes that were available before the error occurred.
   */ async peek(n) {
        if (n < 0) {
            throw Error("negative count");
        }
        let avail = this.w - this.r;
        while(avail < n && avail < this.buf.byteLength && !this.eof){
            try {
                await this._fill();
            } catch (err) {
                err.partial = this.buf.subarray(this.r, this.w);
                throw err;
            }
            avail = this.w - this.r;
        }
        if (avail === 0 && this.eof) {
            return null;
        } else if (avail < n && this.eof) {
            return this.buf.subarray(this.r, this.r + avail);
        } else if (avail < n) {
            throw new BufferFullError(this.buf.subarray(this.r, this.w));
        }
        return this.buf.subarray(this.r, this.r + n);
    }
}
class AbstractBufBase {
    buf;
    usedBufferBytes = 0;
    err = null;
    /** Size returns the size of the underlying buffer in bytes. */ size() {
        return this.buf.byteLength;
    }
    /** Returns how many bytes are unused in the buffer. */ available() {
        return this.buf.byteLength - this.usedBufferBytes;
    }
    /** buffered returns the number of bytes that have been written into the
   * current buffer.
   */ buffered() {
        return this.usedBufferBytes;
    }
}
/** BufWriter implements buffering for an deno.Writer object.
 * If an error occurs writing to a Writer, no more data will be
 * accepted and all subsequent writes, and flush(), will return the error.
 * After all data has been written, the client should call the
 * flush() method to guarantee all data has been forwarded to
 * the underlying deno.Writer.
 */ export class BufWriter extends AbstractBufBase {
    writer;
    /** return new BufWriter unless writer is BufWriter */ static create(writer, size = DEFAULT_BUF_SIZE) {
        return writer instanceof BufWriter ? writer : new BufWriter(writer, size);
    }
    constructor(writer, size = DEFAULT_BUF_SIZE){
        super();
        this.writer = writer;
        if (size <= 0) {
            size = DEFAULT_BUF_SIZE;
        }
        this.buf = new Uint8Array(size);
    }
    /** Discards any unflushed buffered data, clears any error, and
   * resets buffer to write its output to w.
   */ reset(w) {
        this.err = null;
        this.usedBufferBytes = 0;
        this.writer = w;
    }
    /** Flush writes any buffered data to the underlying io.Writer. */ async flush() {
        if (this.err !== null) throw this.err;
        if (this.usedBufferBytes === 0) return;
        try {
            await writeAll(this.writer, this.buf.subarray(0, this.usedBufferBytes));
        } catch (e) {
            this.err = e;
            throw e;
        }
        this.buf = new Uint8Array(this.buf.length);
        this.usedBufferBytes = 0;
    }
    /** Writes the contents of `data` into the buffer.  If the contents won't fully
   * fit into the buffer, those bytes that can are copied into the buffer, the
   * buffer is the flushed to the writer and the remaining bytes are copied into
   * the now empty buffer.
   *
   * @return the number of bytes written to the buffer.
   */ async write(data) {
        if (this.err !== null) throw this.err;
        if (data.length === 0) return 0;
        let totalBytesWritten = 0;
        let numBytesWritten = 0;
        while(data.byteLength > this.available()){
            if (this.buffered() === 0) {
                // Large write, empty buffer.
                // Write directly from data to avoid copy.
                try {
                    numBytesWritten = await this.writer.write(data);
                } catch (e) {
                    this.err = e;
                    throw e;
                }
            } else {
                numBytesWritten = copy(data, this.buf, this.usedBufferBytes);
                this.usedBufferBytes += numBytesWritten;
                await this.flush();
            }
            totalBytesWritten += numBytesWritten;
            data = data.subarray(numBytesWritten);
        }
        numBytesWritten = copy(data, this.buf, this.usedBufferBytes);
        this.usedBufferBytes += numBytesWritten;
        totalBytesWritten += numBytesWritten;
        return totalBytesWritten;
    }
}
/** BufWriterSync implements buffering for a deno.WriterSync object.
 * If an error occurs writing to a WriterSync, no more data will be
 * accepted and all subsequent writes, and flush(), will return the error.
 * After all data has been written, the client should call the
 * flush() method to guarantee all data has been forwarded to
 * the underlying deno.WriterSync.
 */ export class BufWriterSync extends AbstractBufBase {
    writer;
    /** return new BufWriterSync unless writer is BufWriterSync */ static create(writer, size = DEFAULT_BUF_SIZE) {
        return writer instanceof BufWriterSync ? writer : new BufWriterSync(writer, size);
    }
    constructor(writer, size = DEFAULT_BUF_SIZE){
        super();
        this.writer = writer;
        if (size <= 0) {
            size = DEFAULT_BUF_SIZE;
        }
        this.buf = new Uint8Array(size);
    }
    /** Discards any unflushed buffered data, clears any error, and
   * resets buffer to write its output to w.
   */ reset(w) {
        this.err = null;
        this.usedBufferBytes = 0;
        this.writer = w;
    }
    /** Flush writes any buffered data to the underlying io.WriterSync. */ flush() {
        if (this.err !== null) throw this.err;
        if (this.usedBufferBytes === 0) return;
        try {
            writeAllSync(this.writer, this.buf.subarray(0, this.usedBufferBytes));
        } catch (e) {
            this.err = e;
            throw e;
        }
        this.buf = new Uint8Array(this.buf.length);
        this.usedBufferBytes = 0;
    }
    /** Writes the contents of `data` into the buffer.  If the contents won't fully
   * fit into the buffer, those bytes that can are copied into the buffer, the
   * buffer is the flushed to the writer and the remaining bytes are copied into
   * the now empty buffer.
   *
   * @return the number of bytes written to the buffer.
   */ writeSync(data) {
        if (this.err !== null) throw this.err;
        if (data.length === 0) return 0;
        let totalBytesWritten = 0;
        let numBytesWritten = 0;
        while(data.byteLength > this.available()){
            if (this.buffered() === 0) {
                // Large write, empty buffer.
                // Write directly from data to avoid copy.
                try {
                    numBytesWritten = this.writer.writeSync(data);
                } catch (e) {
                    this.err = e;
                    throw e;
                }
            } else {
                numBytesWritten = copy(data, this.buf, this.usedBufferBytes);
                this.usedBufferBytes += numBytesWritten;
                this.flush();
            }
            totalBytesWritten += numBytesWritten;
            data = data.subarray(numBytesWritten);
        }
        numBytesWritten = copy(data, this.buf, this.usedBufferBytes);
        this.usedBufferBytes += numBytesWritten;
        totalBytesWritten += numBytesWritten;
        return totalBytesWritten;
    }
}
/** Generate longest proper prefix which is also suffix array. */ function createLPS(pat) {
    const lps = new Uint8Array(pat.length);
    lps[0] = 0;
    let prefixEnd = 0;
    let i = 1;
    while(i < lps.length){
        if (pat[i] == pat[prefixEnd]) {
            prefixEnd++;
            lps[i] = prefixEnd;
            i++;
        } else if (prefixEnd === 0) {
            lps[i] = 0;
            i++;
        } else {
            prefixEnd = lps[prefixEnd - 1];
        }
    }
    return lps;
}
/** Read delimited bytes from a Reader. */ export async function* readDelim(reader, delim) {
    // Avoid unicode problems
    const delimLen = delim.length;
    const delimLPS = createLPS(delim);
    const chunks = new BytesList();
    const bufSize = Math.max(1024, delimLen + 1);
    // Modified KMP
    let inspectIndex = 0;
    let matchIndex = 0;
    while(true){
        const inspectArr = new Uint8Array(bufSize);
        const result = await reader.read(inspectArr);
        if (result === null) {
            // Yield last chunk.
            yield chunks.concat();
            return;
        } else if (result < 0) {
            // Discard all remaining and silently fail.
            return;
        }
        chunks.add(inspectArr, 0, result);
        let localIndex = 0;
        while(inspectIndex < chunks.size()){
            if (inspectArr[localIndex] === delim[matchIndex]) {
                inspectIndex++;
                localIndex++;
                matchIndex++;
                if (matchIndex === delimLen) {
                    // Full match
                    const matchEnd = inspectIndex - delimLen;
                    const readyBytes = chunks.slice(0, matchEnd);
                    yield readyBytes;
                    // Reset match, different from KMP.
                    chunks.shift(inspectIndex);
                    inspectIndex = 0;
                    matchIndex = 0;
                }
            } else {
                if (matchIndex === 0) {
                    inspectIndex++;
                    localIndex++;
                } else {
                    matchIndex = delimLPS[matchIndex - 1];
                }
            }
        }
    }
}
/** Read delimited strings from a Reader. */ export async function* readStringDelim(reader, delim) {
    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    for await (const chunk of readDelim(reader, encoder.encode(delim))){
        yield decoder.decode(chunk);
    }
}
/** Read strings line-by-line from a Reader. */ export async function* readLines(reader) {
    for await (let chunk of readStringDelim(reader, "\n")){
        // Finding a CR at the end of the line is evidence of a
        // "\r\n" at the end of the line. The "\r" part should be
        // removed too.
        if (chunk.endsWith("\r")) {
            chunk = chunk.slice(0, -1);
        }
        yield chunk;
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZ3Zmb2ltYXNhMmFvZW9lY3d1aGIya3NzZmVzdXB5YnUzYmtydDZ3Mnh5NnZpZW1iam9hcS5hcndlYXZlLm5ldC9OVXJrTUJJR2dPSTRnclVPSFNwU0tTVkg0RFRZVlJuNjJyNDlWQkdCUzRFL2lvL2J1ZmlvLnRzIl0sInNvdXJjZXNDb250ZW50IjpbIi8vIENvcHlyaWdodCAyMDE4LTIwMjEgdGhlIERlbm8gYXV0aG9ycy4gQWxsIHJpZ2h0cyByZXNlcnZlZC4gTUlUIGxpY2Vuc2UuXG4vLyBCYXNlZCBvbiBodHRwczovL2dpdGh1Yi5jb20vZ29sYW5nL2dvL2Jsb2IvODkxNjgyL3NyYy9idWZpby9idWZpby5nb1xuLy8gQ29weXJpZ2h0IDIwMDkgVGhlIEdvIEF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuXG4vLyBVc2Ugb2YgdGhpcyBzb3VyY2UgY29kZSBpcyBnb3Zlcm5lZCBieSBhIEJTRC1zdHlsZVxuLy8gbGljZW5zZSB0aGF0IGNhbiBiZSBmb3VuZCBpbiB0aGUgTElDRU5TRSBmaWxlLlxuXG50eXBlIFJlYWRlciA9IERlbm8uUmVhZGVyO1xudHlwZSBXcml0ZXIgPSBEZW5vLldyaXRlcjtcbnR5cGUgV3JpdGVyU3luYyA9IERlbm8uV3JpdGVyU3luYztcbmltcG9ydCB7IGNvcHkgfSBmcm9tIFwiLi4vYnl0ZXMvbW9kLnRzXCI7XG5pbXBvcnQgeyBhc3NlcnQgfSBmcm9tIFwiLi4vX3V0aWwvYXNzZXJ0LnRzXCI7XG5pbXBvcnQgeyBCeXRlc0xpc3QgfSBmcm9tIFwiLi4vYnl0ZXMvYnl0ZXNfbGlzdC50c1wiO1xuaW1wb3J0IHsgd3JpdGVBbGwsIHdyaXRlQWxsU3luYyB9IGZyb20gXCIuL3V0aWwudHNcIjtcblxuY29uc3QgREVGQVVMVF9CVUZfU0laRSA9IDQwOTY7XG5jb25zdCBNSU5fQlVGX1NJWkUgPSAxNjtcbmNvbnN0IE1BWF9DT05TRUNVVElWRV9FTVBUWV9SRUFEUyA9IDEwMDtcbmNvbnN0IENSID0gXCJcXHJcIi5jaGFyQ29kZUF0KDApO1xuY29uc3QgTEYgPSBcIlxcblwiLmNoYXJDb2RlQXQoMCk7XG5cbmV4cG9ydCBjbGFzcyBCdWZmZXJGdWxsRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIG5hbWUgPSBcIkJ1ZmZlckZ1bGxFcnJvclwiO1xuICBjb25zdHJ1Y3RvcihwdWJsaWMgcGFydGlhbDogVWludDhBcnJheSkge1xuICAgIHN1cGVyKFwiQnVmZmVyIGZ1bGxcIik7XG4gIH1cbn1cblxuZXhwb3J0IGNsYXNzIFBhcnRpYWxSZWFkRXJyb3IgZXh0ZW5kcyBFcnJvciB7XG4gIG5hbWUgPSBcIlBhcnRpYWxSZWFkRXJyb3JcIjtcbiAgcGFydGlhbD86IFVpbnQ4QXJyYXk7XG4gIGNvbnN0cnVjdG9yKCkge1xuICAgIHN1cGVyKFwiRW5jb3VudGVyZWQgVW5leHBlY3RlZEVvZiwgZGF0YSBvbmx5IHBhcnRpYWxseSByZWFkXCIpO1xuICB9XG59XG5cbi8qKiBSZXN1bHQgdHlwZSByZXR1cm5lZCBieSBvZiBCdWZSZWFkZXIucmVhZExpbmUoKS4gKi9cbmV4cG9ydCBpbnRlcmZhY2UgUmVhZExpbmVSZXN1bHQge1xuICBsaW5lOiBVaW50OEFycmF5O1xuICBtb3JlOiBib29sZWFuO1xufVxuXG4vKiogQnVmUmVhZGVyIGltcGxlbWVudHMgYnVmZmVyaW5nIGZvciBhIFJlYWRlciBvYmplY3QuICovXG5leHBvcnQgY2xhc3MgQnVmUmVhZGVyIGltcGxlbWVudHMgUmVhZGVyIHtcbiAgcHJpdmF0ZSBidWYhOiBVaW50OEFycmF5O1xuICBwcml2YXRlIHJkITogUmVhZGVyOyAvLyBSZWFkZXIgcHJvdmlkZWQgYnkgY2FsbGVyLlxuICBwcml2YXRlIHIgPSAwOyAvLyBidWYgcmVhZCBwb3NpdGlvbi5cbiAgcHJpdmF0ZSB3ID0gMDsgLy8gYnVmIHdyaXRlIHBvc2l0aW9uLlxuICBwcml2YXRlIGVvZiA9IGZhbHNlO1xuICAvLyBwcml2YXRlIGxhc3RCeXRlOiBudW1iZXI7XG4gIC8vIHByaXZhdGUgbGFzdENoYXJTaXplOiBudW1iZXI7XG5cbiAgLyoqIHJldHVybiBuZXcgQnVmUmVhZGVyIHVubGVzcyByIGlzIEJ1ZlJlYWRlciAqL1xuICBzdGF0aWMgY3JlYXRlKHI6IFJlYWRlciwgc2l6ZTogbnVtYmVyID0gREVGQVVMVF9CVUZfU0laRSk6IEJ1ZlJlYWRlciB7XG4gICAgcmV0dXJuIHIgaW5zdGFuY2VvZiBCdWZSZWFkZXIgPyByIDogbmV3IEJ1ZlJlYWRlcihyLCBzaXplKTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKHJkOiBSZWFkZXIsIHNpemU6IG51bWJlciA9IERFRkFVTFRfQlVGX1NJWkUpIHtcbiAgICBpZiAoc2l6ZSA8IE1JTl9CVUZfU0laRSkge1xuICAgICAgc2l6ZSA9IE1JTl9CVUZfU0laRTtcbiAgICB9XG4gICAgdGhpcy5fcmVzZXQobmV3IFVpbnQ4QXJyYXkoc2l6ZSksIHJkKTtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHRoZSBzaXplIG9mIHRoZSB1bmRlcmx5aW5nIGJ1ZmZlciBpbiBieXRlcy4gKi9cbiAgc2l6ZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmJ1Zi5ieXRlTGVuZ3RoO1xuICB9XG5cbiAgYnVmZmVyZWQoKTogbnVtYmVyIHtcbiAgICByZXR1cm4gdGhpcy53IC0gdGhpcy5yO1xuICB9XG5cbiAgLy8gUmVhZHMgYSBuZXcgY2h1bmsgaW50byB0aGUgYnVmZmVyLlxuICBwcml2YXRlIGFzeW5jIF9maWxsKCkge1xuICAgIC8vIFNsaWRlIGV4aXN0aW5nIGRhdGEgdG8gYmVnaW5uaW5nLlxuICAgIGlmICh0aGlzLnIgPiAwKSB7XG4gICAgICB0aGlzLmJ1Zi5jb3B5V2l0aGluKDAsIHRoaXMuciwgdGhpcy53KTtcbiAgICAgIHRoaXMudyAtPSB0aGlzLnI7XG4gICAgICB0aGlzLnIgPSAwO1xuICAgIH1cblxuICAgIGlmICh0aGlzLncgPj0gdGhpcy5idWYuYnl0ZUxlbmd0aCkge1xuICAgICAgdGhyb3cgRXJyb3IoXCJidWZpbzogdHJpZWQgdG8gZmlsbCBmdWxsIGJ1ZmZlclwiKTtcbiAgICB9XG5cbiAgICAvLyBSZWFkIG5ldyBkYXRhOiB0cnkgYSBsaW1pdGVkIG51bWJlciBvZiB0aW1lcy5cbiAgICBmb3IgKGxldCBpID0gTUFYX0NPTlNFQ1VUSVZFX0VNUFRZX1JFQURTOyBpID4gMDsgaS0tKSB7XG4gICAgICBjb25zdCByciA9IGF3YWl0IHRoaXMucmQucmVhZCh0aGlzLmJ1Zi5zdWJhcnJheSh0aGlzLncpKTtcbiAgICAgIGlmIChyciA9PT0gbnVsbCkge1xuICAgICAgICB0aGlzLmVvZiA9IHRydWU7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGFzc2VydChyciA+PSAwLCBcIm5lZ2F0aXZlIHJlYWRcIik7XG4gICAgICB0aGlzLncgKz0gcnI7XG4gICAgICBpZiAocnIgPiAwKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICB0aHJvdyBuZXcgRXJyb3IoXG4gICAgICBgTm8gcHJvZ3Jlc3MgYWZ0ZXIgJHtNQVhfQ09OU0VDVVRJVkVfRU1QVFlfUkVBRFN9IHJlYWQoKSBjYWxsc2AsXG4gICAgKTtcbiAgfVxuXG4gIC8qKiBEaXNjYXJkcyBhbnkgYnVmZmVyZWQgZGF0YSwgcmVzZXRzIGFsbCBzdGF0ZSwgYW5kIHN3aXRjaGVzXG4gICAqIHRoZSBidWZmZXJlZCByZWFkZXIgdG8gcmVhZCBmcm9tIHIuXG4gICAqL1xuICByZXNldChyOiBSZWFkZXIpOiB2b2lkIHtcbiAgICB0aGlzLl9yZXNldCh0aGlzLmJ1Ziwgcik7XG4gIH1cblxuICBwcml2YXRlIF9yZXNldChidWY6IFVpbnQ4QXJyYXksIHJkOiBSZWFkZXIpOiB2b2lkIHtcbiAgICB0aGlzLmJ1ZiA9IGJ1ZjtcbiAgICB0aGlzLnJkID0gcmQ7XG4gICAgdGhpcy5lb2YgPSBmYWxzZTtcbiAgICAvLyB0aGlzLmxhc3RCeXRlID0gLTE7XG4gICAgLy8gdGhpcy5sYXN0Q2hhclNpemUgPSAtMTtcbiAgfVxuXG4gIC8qKiByZWFkcyBkYXRhIGludG8gcC5cbiAgICogSXQgcmV0dXJucyB0aGUgbnVtYmVyIG9mIGJ5dGVzIHJlYWQgaW50byBwLlxuICAgKiBUaGUgYnl0ZXMgYXJlIHRha2VuIGZyb20gYXQgbW9zdCBvbmUgUmVhZCBvbiB0aGUgdW5kZXJseWluZyBSZWFkZXIsXG4gICAqIGhlbmNlIG4gbWF5IGJlIGxlc3MgdGhhbiBsZW4ocCkuXG4gICAqIFRvIHJlYWQgZXhhY3RseSBsZW4ocCkgYnl0ZXMsIHVzZSBpby5SZWFkRnVsbChiLCBwKS5cbiAgICovXG4gIGFzeW5jIHJlYWQocDogVWludDhBcnJheSk6IFByb21pc2U8bnVtYmVyIHwgbnVsbD4ge1xuICAgIGxldCBycjogbnVtYmVyIHwgbnVsbCA9IHAuYnl0ZUxlbmd0aDtcbiAgICBpZiAocC5ieXRlTGVuZ3RoID09PSAwKSByZXR1cm4gcnI7XG5cbiAgICBpZiAodGhpcy5yID09PSB0aGlzLncpIHtcbiAgICAgIGlmIChwLmJ5dGVMZW5ndGggPj0gdGhpcy5idWYuYnl0ZUxlbmd0aCkge1xuICAgICAgICAvLyBMYXJnZSByZWFkLCBlbXB0eSBidWZmZXIuXG4gICAgICAgIC8vIFJlYWQgZGlyZWN0bHkgaW50byBwIHRvIGF2b2lkIGNvcHkuXG4gICAgICAgIGNvbnN0IHJyID0gYXdhaXQgdGhpcy5yZC5yZWFkKHApO1xuICAgICAgICBjb25zdCBucmVhZCA9IHJyID8/IDA7XG4gICAgICAgIGFzc2VydChucmVhZCA+PSAwLCBcIm5lZ2F0aXZlIHJlYWRcIik7XG4gICAgICAgIC8vIGlmIChyci5ucmVhZCA+IDApIHtcbiAgICAgICAgLy8gICB0aGlzLmxhc3RCeXRlID0gcFtyci5ucmVhZCAtIDFdO1xuICAgICAgICAvLyAgIHRoaXMubGFzdENoYXJTaXplID0gLTE7XG4gICAgICAgIC8vIH1cbiAgICAgICAgcmV0dXJuIHJyO1xuICAgICAgfVxuXG4gICAgICAvLyBPbmUgcmVhZC5cbiAgICAgIC8vIERvIG5vdCB1c2UgdGhpcy5maWxsLCB3aGljaCB3aWxsIGxvb3AuXG4gICAgICB0aGlzLnIgPSAwO1xuICAgICAgdGhpcy53ID0gMDtcbiAgICAgIHJyID0gYXdhaXQgdGhpcy5yZC5yZWFkKHRoaXMuYnVmKTtcbiAgICAgIGlmIChyciA9PT0gMCB8fCByciA9PT0gbnVsbCkgcmV0dXJuIHJyO1xuICAgICAgYXNzZXJ0KHJyID49IDAsIFwibmVnYXRpdmUgcmVhZFwiKTtcbiAgICAgIHRoaXMudyArPSBycjtcbiAgICB9XG5cbiAgICAvLyBjb3B5IGFzIG11Y2ggYXMgd2UgY2FuXG4gICAgY29uc3QgY29waWVkID0gY29weSh0aGlzLmJ1Zi5zdWJhcnJheSh0aGlzLnIsIHRoaXMudyksIHAsIDApO1xuICAgIHRoaXMuciArPSBjb3BpZWQ7XG4gICAgLy8gdGhpcy5sYXN0Qnl0ZSA9IHRoaXMuYnVmW3RoaXMuciAtIDFdO1xuICAgIC8vIHRoaXMubGFzdENoYXJTaXplID0gLTE7XG4gICAgcmV0dXJuIGNvcGllZDtcbiAgfVxuXG4gIC8qKiByZWFkcyBleGFjdGx5IGBwLmxlbmd0aGAgYnl0ZXMgaW50byBgcGAuXG4gICAqXG4gICAqIElmIHN1Y2Nlc3NmdWwsIGBwYCBpcyByZXR1cm5lZC5cbiAgICpcbiAgICogSWYgdGhlIGVuZCBvZiB0aGUgdW5kZXJseWluZyBzdHJlYW0gaGFzIGJlZW4gcmVhY2hlZCwgYW5kIHRoZXJlIGFyZSBubyBtb3JlXG4gICAqIGJ5dGVzIGF2YWlsYWJsZSBpbiB0aGUgYnVmZmVyLCBgcmVhZEZ1bGwoKWAgcmV0dXJucyBgbnVsbGAgaW5zdGVhZC5cbiAgICpcbiAgICogQW4gZXJyb3IgaXMgdGhyb3duIGlmIHNvbWUgYnl0ZXMgY291bGQgYmUgcmVhZCwgYnV0IG5vdCBlbm91Z2ggdG8gZmlsbCBgcGBcbiAgICogZW50aXJlbHkgYmVmb3JlIHRoZSB1bmRlcmx5aW5nIHN0cmVhbSByZXBvcnRlZCBhbiBlcnJvciBvciBFT0YuIEFueSBlcnJvclxuICAgKiB0aHJvd24gd2lsbCBoYXZlIGEgYHBhcnRpYWxgIHByb3BlcnR5IHRoYXQgaW5kaWNhdGVzIHRoZSBzbGljZSBvZiB0aGVcbiAgICogYnVmZmVyIHRoYXQgaGFzIGJlZW4gc3VjY2Vzc2Z1bGx5IGZpbGxlZCB3aXRoIGRhdGEuXG4gICAqXG4gICAqIFBvcnRlZCBmcm9tIGh0dHBzOi8vZ29sYW5nLm9yZy9wa2cvaW8vI1JlYWRGdWxsXG4gICAqL1xuICBhc3luYyByZWFkRnVsbChwOiBVaW50OEFycmF5KTogUHJvbWlzZTxVaW50OEFycmF5IHwgbnVsbD4ge1xuICAgIGxldCBieXRlc1JlYWQgPSAwO1xuICAgIHdoaWxlIChieXRlc1JlYWQgPCBwLmxlbmd0aCkge1xuICAgICAgdHJ5IHtcbiAgICAgICAgY29uc3QgcnIgPSBhd2FpdCB0aGlzLnJlYWQocC5zdWJhcnJheShieXRlc1JlYWQpKTtcbiAgICAgICAgaWYgKHJyID09PSBudWxsKSB7XG4gICAgICAgICAgaWYgKGJ5dGVzUmVhZCA9PT0gMCkge1xuICAgICAgICAgICAgcmV0dXJuIG51bGw7XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHRocm93IG5ldyBQYXJ0aWFsUmVhZEVycm9yKCk7XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGJ5dGVzUmVhZCArPSBycjtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBlcnIucGFydGlhbCA9IHAuc3ViYXJyYXkoMCwgYnl0ZXNSZWFkKTtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgIH1cbiAgICByZXR1cm4gcDtcbiAgfVxuXG4gIC8qKiBSZXR1cm5zIHRoZSBuZXh0IGJ5dGUgWzAsIDI1NV0gb3IgYG51bGxgLiAqL1xuICBhc3luYyByZWFkQnl0ZSgpOiBQcm9taXNlPG51bWJlciB8IG51bGw+IHtcbiAgICB3aGlsZSAodGhpcy5yID09PSB0aGlzLncpIHtcbiAgICAgIGlmICh0aGlzLmVvZikgcmV0dXJuIG51bGw7XG4gICAgICBhd2FpdCB0aGlzLl9maWxsKCk7IC8vIGJ1ZmZlciBpcyBlbXB0eS5cbiAgICB9XG4gICAgY29uc3QgYyA9IHRoaXMuYnVmW3RoaXMucl07XG4gICAgdGhpcy5yKys7XG4gICAgLy8gdGhpcy5sYXN0Qnl0ZSA9IGM7XG4gICAgcmV0dXJuIGM7XG4gIH1cblxuICAvKiogcmVhZFN0cmluZygpIHJlYWRzIHVudGlsIHRoZSBmaXJzdCBvY2N1cnJlbmNlIG9mIGRlbGltIGluIHRoZSBpbnB1dCxcbiAgICogcmV0dXJuaW5nIGEgc3RyaW5nIGNvbnRhaW5pbmcgdGhlIGRhdGEgdXAgdG8gYW5kIGluY2x1ZGluZyB0aGUgZGVsaW1pdGVyLlxuICAgKiBJZiBSZWFkU3RyaW5nIGVuY291bnRlcnMgYW4gZXJyb3IgYmVmb3JlIGZpbmRpbmcgYSBkZWxpbWl0ZXIsXG4gICAqIGl0IHJldHVybnMgdGhlIGRhdGEgcmVhZCBiZWZvcmUgdGhlIGVycm9yIGFuZCB0aGUgZXJyb3IgaXRzZWxmXG4gICAqIChvZnRlbiBgbnVsbGApLlxuICAgKiBSZWFkU3RyaW5nIHJldHVybnMgZXJyICE9IG5pbCBpZiBhbmQgb25seSBpZiB0aGUgcmV0dXJuZWQgZGF0YSBkb2VzIG5vdCBlbmRcbiAgICogaW4gZGVsaW0uXG4gICAqIEZvciBzaW1wbGUgdXNlcywgYSBTY2FubmVyIG1heSBiZSBtb3JlIGNvbnZlbmllbnQuXG4gICAqL1xuICBhc3luYyByZWFkU3RyaW5nKGRlbGltOiBzdHJpbmcpOiBQcm9taXNlPHN0cmluZyB8IG51bGw+IHtcbiAgICBpZiAoZGVsaW0ubGVuZ3RoICE9PSAxKSB7XG4gICAgICB0aHJvdyBuZXcgRXJyb3IoXCJEZWxpbWl0ZXIgc2hvdWxkIGJlIGEgc2luZ2xlIGNoYXJhY3RlclwiKTtcbiAgICB9XG4gICAgY29uc3QgYnVmZmVyID0gYXdhaXQgdGhpcy5yZWFkU2xpY2UoZGVsaW0uY2hhckNvZGVBdCgwKSk7XG4gICAgaWYgKGJ1ZmZlciA9PT0gbnVsbCkgcmV0dXJuIG51bGw7XG4gICAgcmV0dXJuIG5ldyBUZXh0RGVjb2RlcigpLmRlY29kZShidWZmZXIpO1xuICB9XG5cbiAgLyoqIGByZWFkTGluZSgpYCBpcyBhIGxvdy1sZXZlbCBsaW5lLXJlYWRpbmcgcHJpbWl0aXZlLiBNb3N0IGNhbGxlcnMgc2hvdWxkXG4gICAqIHVzZSBgcmVhZFN0cmluZygnXFxuJylgIGluc3RlYWQgb3IgdXNlIGEgU2Nhbm5lci5cbiAgICpcbiAgICogYHJlYWRMaW5lKClgIHRyaWVzIHRvIHJldHVybiBhIHNpbmdsZSBsaW5lLCBub3QgaW5jbHVkaW5nIHRoZSBlbmQtb2YtbGluZVxuICAgKiBieXRlcy4gSWYgdGhlIGxpbmUgd2FzIHRvbyBsb25nIGZvciB0aGUgYnVmZmVyIHRoZW4gYG1vcmVgIGlzIHNldCBhbmQgdGhlXG4gICAqIGJlZ2lubmluZyBvZiB0aGUgbGluZSBpcyByZXR1cm5lZC4gVGhlIHJlc3Qgb2YgdGhlIGxpbmUgd2lsbCBiZSByZXR1cm5lZFxuICAgKiBmcm9tIGZ1dHVyZSBjYWxscy4gYG1vcmVgIHdpbGwgYmUgZmFsc2Ugd2hlbiByZXR1cm5pbmcgdGhlIGxhc3QgZnJhZ21lbnRcbiAgICogb2YgdGhlIGxpbmUuIFRoZSByZXR1cm5lZCBidWZmZXIgaXMgb25seSB2YWxpZCB1bnRpbCB0aGUgbmV4dCBjYWxsIHRvXG4gICAqIGByZWFkTGluZSgpYC5cbiAgICpcbiAgICogVGhlIHRleHQgcmV0dXJuZWQgZnJvbSBSZWFkTGluZSBkb2VzIG5vdCBpbmNsdWRlIHRoZSBsaW5lIGVuZCAoXCJcXHJcXG5cIiBvclxuICAgKiBcIlxcblwiKS5cbiAgICpcbiAgICogV2hlbiB0aGUgZW5kIG9mIHRoZSB1bmRlcmx5aW5nIHN0cmVhbSBpcyByZWFjaGVkLCB0aGUgZmluYWwgYnl0ZXMgaW4gdGhlXG4gICAqIHN0cmVhbSBhcmUgcmV0dXJuZWQuIE5vIGluZGljYXRpb24gb3IgZXJyb3IgaXMgZ2l2ZW4gaWYgdGhlIGlucHV0IGVuZHNcbiAgICogd2l0aG91dCBhIGZpbmFsIGxpbmUgZW5kLiBXaGVuIHRoZXJlIGFyZSBubyBtb3JlIHRyYWlsaW5nIGJ5dGVzIHRvIHJlYWQsXG4gICAqIGByZWFkTGluZSgpYCByZXR1cm5zIGBudWxsYC5cbiAgICpcbiAgICogQ2FsbGluZyBgdW5yZWFkQnl0ZSgpYCBhZnRlciBgcmVhZExpbmUoKWAgd2lsbCBhbHdheXMgdW5yZWFkIHRoZSBsYXN0IGJ5dGVcbiAgICogcmVhZCAocG9zc2libHkgYSBjaGFyYWN0ZXIgYmVsb25naW5nIHRvIHRoZSBsaW5lIGVuZCkgZXZlbiBpZiB0aGF0IGJ5dGUgaXNcbiAgICogbm90IHBhcnQgb2YgdGhlIGxpbmUgcmV0dXJuZWQgYnkgYHJlYWRMaW5lKClgLlxuICAgKi9cbiAgYXN5bmMgcmVhZExpbmUoKTogUHJvbWlzZTxSZWFkTGluZVJlc3VsdCB8IG51bGw+IHtcbiAgICBsZXQgbGluZTogVWludDhBcnJheSB8IG51bGw7XG5cbiAgICB0cnkge1xuICAgICAgbGluZSA9IGF3YWl0IHRoaXMucmVhZFNsaWNlKExGKTtcbiAgICB9IGNhdGNoIChlcnIpIHtcbiAgICAgIGxldCB7IHBhcnRpYWwgfSA9IGVycjtcbiAgICAgIGFzc2VydChcbiAgICAgICAgcGFydGlhbCBpbnN0YW5jZW9mIFVpbnQ4QXJyYXksXG4gICAgICAgIFwiYnVmaW86IGNhdWdodCBlcnJvciBmcm9tIGByZWFkU2xpY2UoKWAgd2l0aG91dCBgcGFydGlhbGAgcHJvcGVydHlcIixcbiAgICAgICk7XG5cbiAgICAgIC8vIERvbid0IHRocm93IGlmIGByZWFkU2xpY2UoKWAgZmFpbGVkIHdpdGggYEJ1ZmZlckZ1bGxFcnJvcmAsIGluc3RlYWQgd2VcbiAgICAgIC8vIGp1c3QgcmV0dXJuIHdoYXRldmVyIGlzIGF2YWlsYWJsZSBhbmQgc2V0IHRoZSBgbW9yZWAgZmxhZy5cbiAgICAgIGlmICghKGVyciBpbnN0YW5jZW9mIEJ1ZmZlckZ1bGxFcnJvcikpIHtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuXG4gICAgICAvLyBIYW5kbGUgdGhlIGNhc2Ugd2hlcmUgXCJcXHJcXG5cIiBzdHJhZGRsZXMgdGhlIGJ1ZmZlci5cbiAgICAgIGlmIChcbiAgICAgICAgIXRoaXMuZW9mICYmXG4gICAgICAgIHBhcnRpYWwuYnl0ZUxlbmd0aCA+IDAgJiZcbiAgICAgICAgcGFydGlhbFtwYXJ0aWFsLmJ5dGVMZW5ndGggLSAxXSA9PT0gQ1JcbiAgICAgICkge1xuICAgICAgICAvLyBQdXQgdGhlICdcXHInIGJhY2sgb24gYnVmIGFuZCBkcm9wIGl0IGZyb20gbGluZS5cbiAgICAgICAgLy8gTGV0IHRoZSBuZXh0IGNhbGwgdG8gUmVhZExpbmUgY2hlY2sgZm9yIFwiXFxyXFxuXCIuXG4gICAgICAgIGFzc2VydCh0aGlzLnIgPiAwLCBcImJ1ZmlvOiB0cmllZCB0byByZXdpbmQgcGFzdCBzdGFydCBvZiBidWZmZXJcIik7XG4gICAgICAgIHRoaXMuci0tO1xuICAgICAgICBwYXJ0aWFsID0gcGFydGlhbC5zdWJhcnJheSgwLCBwYXJ0aWFsLmJ5dGVMZW5ndGggLSAxKTtcbiAgICAgIH1cblxuICAgICAgcmV0dXJuIHsgbGluZTogcGFydGlhbCwgbW9yZTogIXRoaXMuZW9mIH07XG4gICAgfVxuXG4gICAgaWYgKGxpbmUgPT09IG51bGwpIHtcbiAgICAgIHJldHVybiBudWxsO1xuICAgIH1cblxuICAgIGlmIChsaW5lLmJ5dGVMZW5ndGggPT09IDApIHtcbiAgICAgIHJldHVybiB7IGxpbmUsIG1vcmU6IGZhbHNlIH07XG4gICAgfVxuXG4gICAgaWYgKGxpbmVbbGluZS5ieXRlTGVuZ3RoIC0gMV0gPT0gTEYpIHtcbiAgICAgIGxldCBkcm9wID0gMTtcbiAgICAgIGlmIChsaW5lLmJ5dGVMZW5ndGggPiAxICYmIGxpbmVbbGluZS5ieXRlTGVuZ3RoIC0gMl0gPT09IENSKSB7XG4gICAgICAgIGRyb3AgPSAyO1xuICAgICAgfVxuICAgICAgbGluZSA9IGxpbmUuc3ViYXJyYXkoMCwgbGluZS5ieXRlTGVuZ3RoIC0gZHJvcCk7XG4gICAgfVxuICAgIHJldHVybiB7IGxpbmUsIG1vcmU6IGZhbHNlIH07XG4gIH1cblxuICAvKiogYHJlYWRTbGljZSgpYCByZWFkcyB1bnRpbCB0aGUgZmlyc3Qgb2NjdXJyZW5jZSBvZiBgZGVsaW1gIGluIHRoZSBpbnB1dCxcbiAgICogcmV0dXJuaW5nIGEgc2xpY2UgcG9pbnRpbmcgYXQgdGhlIGJ5dGVzIGluIHRoZSBidWZmZXIuIFRoZSBieXRlcyBzdG9wXG4gICAqIGJlaW5nIHZhbGlkIGF0IHRoZSBuZXh0IHJlYWQuXG4gICAqXG4gICAqIElmIGByZWFkU2xpY2UoKWAgZW5jb3VudGVycyBhbiBlcnJvciBiZWZvcmUgZmluZGluZyBhIGRlbGltaXRlciwgb3IgdGhlXG4gICAqIGJ1ZmZlciBmaWxscyB3aXRob3V0IGZpbmRpbmcgYSBkZWxpbWl0ZXIsIGl0IHRocm93cyBhbiBlcnJvciB3aXRoIGFcbiAgICogYHBhcnRpYWxgIHByb3BlcnR5IHRoYXQgY29udGFpbnMgdGhlIGVudGlyZSBidWZmZXIuXG4gICAqXG4gICAqIElmIGByZWFkU2xpY2UoKWAgZW5jb3VudGVycyB0aGUgZW5kIG9mIHRoZSB1bmRlcmx5aW5nIHN0cmVhbSBhbmQgdGhlcmUgYXJlXG4gICAqIGFueSBieXRlcyBsZWZ0IGluIHRoZSBidWZmZXIsIHRoZSByZXN0IG9mIHRoZSBidWZmZXIgaXMgcmV0dXJuZWQuIEluIG90aGVyXG4gICAqIHdvcmRzLCBFT0YgaXMgYWx3YXlzIHRyZWF0ZWQgYXMgYSBkZWxpbWl0ZXIuIE9uY2UgdGhlIGJ1ZmZlciBpcyBlbXB0eSxcbiAgICogaXQgcmV0dXJucyBgbnVsbGAuXG4gICAqXG4gICAqIEJlY2F1c2UgdGhlIGRhdGEgcmV0dXJuZWQgZnJvbSBgcmVhZFNsaWNlKClgIHdpbGwgYmUgb3ZlcndyaXR0ZW4gYnkgdGhlXG4gICAqIG5leHQgSS9PIG9wZXJhdGlvbiwgbW9zdCBjbGllbnRzIHNob3VsZCB1c2UgYHJlYWRTdHJpbmcoKWAgaW5zdGVhZC5cbiAgICovXG4gIGFzeW5jIHJlYWRTbGljZShkZWxpbTogbnVtYmVyKTogUHJvbWlzZTxVaW50OEFycmF5IHwgbnVsbD4ge1xuICAgIGxldCBzID0gMDsgLy8gc2VhcmNoIHN0YXJ0IGluZGV4XG4gICAgbGV0IHNsaWNlOiBVaW50OEFycmF5IHwgdW5kZWZpbmVkO1xuXG4gICAgd2hpbGUgKHRydWUpIHtcbiAgICAgIC8vIFNlYXJjaCBidWZmZXIuXG4gICAgICBsZXQgaSA9IHRoaXMuYnVmLnN1YmFycmF5KHRoaXMuciArIHMsIHRoaXMudykuaW5kZXhPZihkZWxpbSk7XG4gICAgICBpZiAoaSA+PSAwKSB7XG4gICAgICAgIGkgKz0gcztcbiAgICAgICAgc2xpY2UgPSB0aGlzLmJ1Zi5zdWJhcnJheSh0aGlzLnIsIHRoaXMuciArIGkgKyAxKTtcbiAgICAgICAgdGhpcy5yICs9IGkgKyAxO1xuICAgICAgICBicmVhaztcbiAgICAgIH1cblxuICAgICAgLy8gRU9GP1xuICAgICAgaWYgKHRoaXMuZW9mKSB7XG4gICAgICAgIGlmICh0aGlzLnIgPT09IHRoaXMudykge1xuICAgICAgICAgIHJldHVybiBudWxsO1xuICAgICAgICB9XG4gICAgICAgIHNsaWNlID0gdGhpcy5idWYuc3ViYXJyYXkodGhpcy5yLCB0aGlzLncpO1xuICAgICAgICB0aGlzLnIgPSB0aGlzLnc7XG4gICAgICAgIGJyZWFrO1xuICAgICAgfVxuXG4gICAgICAvLyBCdWZmZXIgZnVsbD9cbiAgICAgIGlmICh0aGlzLmJ1ZmZlcmVkKCkgPj0gdGhpcy5idWYuYnl0ZUxlbmd0aCkge1xuICAgICAgICB0aGlzLnIgPSB0aGlzLnc7XG4gICAgICAgIC8vICM0NTIxIFRoZSBpbnRlcm5hbCBidWZmZXIgc2hvdWxkIG5vdCBiZSByZXVzZWQgYWNyb3NzIHJlYWRzIGJlY2F1c2UgaXQgY2F1c2VzIGNvcnJ1cHRpb24gb2YgZGF0YS5cbiAgICAgICAgY29uc3Qgb2xkYnVmID0gdGhpcy5idWY7XG4gICAgICAgIGNvbnN0IG5ld2J1ZiA9IHRoaXMuYnVmLnNsaWNlKDApO1xuICAgICAgICB0aGlzLmJ1ZiA9IG5ld2J1ZjtcbiAgICAgICAgdGhyb3cgbmV3IEJ1ZmZlckZ1bGxFcnJvcihvbGRidWYpO1xuICAgICAgfVxuXG4gICAgICBzID0gdGhpcy53IC0gdGhpcy5yOyAvLyBkbyBub3QgcmVzY2FuIGFyZWEgd2Ugc2Nhbm5lZCBiZWZvcmVcblxuICAgICAgLy8gQnVmZmVyIGlzIG5vdCBmdWxsLlxuICAgICAgdHJ5IHtcbiAgICAgICAgYXdhaXQgdGhpcy5fZmlsbCgpO1xuICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgIGVyci5wYXJ0aWFsID0gc2xpY2U7XG4gICAgICAgIHRocm93IGVycjtcbiAgICAgIH1cbiAgICB9XG5cbiAgICAvLyBIYW5kbGUgbGFzdCBieXRlLCBpZiBhbnkuXG4gICAgLy8gY29uc3QgaSA9IHNsaWNlLmJ5dGVMZW5ndGggLSAxO1xuICAgIC8vIGlmIChpID49IDApIHtcbiAgICAvLyAgIHRoaXMubGFzdEJ5dGUgPSBzbGljZVtpXTtcbiAgICAvLyAgIHRoaXMubGFzdENoYXJTaXplID0gLTFcbiAgICAvLyB9XG5cbiAgICByZXR1cm4gc2xpY2U7XG4gIH1cblxuICAvKiogYHBlZWsoKWAgcmV0dXJucyB0aGUgbmV4dCBgbmAgYnl0ZXMgd2l0aG91dCBhZHZhbmNpbmcgdGhlIHJlYWRlci4gVGhlXG4gICAqIGJ5dGVzIHN0b3AgYmVpbmcgdmFsaWQgYXQgdGhlIG5leHQgcmVhZCBjYWxsLlxuICAgKlxuICAgKiBXaGVuIHRoZSBlbmQgb2YgdGhlIHVuZGVybHlpbmcgc3RyZWFtIGlzIHJlYWNoZWQsIGJ1dCB0aGVyZSBhcmUgdW5yZWFkXG4gICAqIGJ5dGVzIGxlZnQgaW4gdGhlIGJ1ZmZlciwgdGhvc2UgYnl0ZXMgYXJlIHJldHVybmVkLiBJZiB0aGVyZSBhcmUgbm8gYnl0ZXNcbiAgICogbGVmdCBpbiB0aGUgYnVmZmVyLCBpdCByZXR1cm5zIGBudWxsYC5cbiAgICpcbiAgICogSWYgYW4gZXJyb3IgaXMgZW5jb3VudGVyZWQgYmVmb3JlIGBuYCBieXRlcyBhcmUgYXZhaWxhYmxlLCBgcGVlaygpYCB0aHJvd3NcbiAgICogYW4gZXJyb3Igd2l0aCB0aGUgYHBhcnRpYWxgIHByb3BlcnR5IHNldCB0byBhIHNsaWNlIG9mIHRoZSBidWZmZXIgdGhhdFxuICAgKiBjb250YWlucyB0aGUgYnl0ZXMgdGhhdCB3ZXJlIGF2YWlsYWJsZSBiZWZvcmUgdGhlIGVycm9yIG9jY3VycmVkLlxuICAgKi9cbiAgYXN5bmMgcGVlayhuOiBudW1iZXIpOiBQcm9taXNlPFVpbnQ4QXJyYXkgfCBudWxsPiB7XG4gICAgaWYgKG4gPCAwKSB7XG4gICAgICB0aHJvdyBFcnJvcihcIm5lZ2F0aXZlIGNvdW50XCIpO1xuICAgIH1cblxuICAgIGxldCBhdmFpbCA9IHRoaXMudyAtIHRoaXMucjtcbiAgICB3aGlsZSAoYXZhaWwgPCBuICYmIGF2YWlsIDwgdGhpcy5idWYuYnl0ZUxlbmd0aCAmJiAhdGhpcy5lb2YpIHtcbiAgICAgIHRyeSB7XG4gICAgICAgIGF3YWl0IHRoaXMuX2ZpbGwoKTtcbiAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICBlcnIucGFydGlhbCA9IHRoaXMuYnVmLnN1YmFycmF5KHRoaXMuciwgdGhpcy53KTtcbiAgICAgICAgdGhyb3cgZXJyO1xuICAgICAgfVxuICAgICAgYXZhaWwgPSB0aGlzLncgLSB0aGlzLnI7XG4gICAgfVxuXG4gICAgaWYgKGF2YWlsID09PSAwICYmIHRoaXMuZW9mKSB7XG4gICAgICByZXR1cm4gbnVsbDtcbiAgICB9IGVsc2UgaWYgKGF2YWlsIDwgbiAmJiB0aGlzLmVvZikge1xuICAgICAgcmV0dXJuIHRoaXMuYnVmLnN1YmFycmF5KHRoaXMuciwgdGhpcy5yICsgYXZhaWwpO1xuICAgIH0gZWxzZSBpZiAoYXZhaWwgPCBuKSB7XG4gICAgICB0aHJvdyBuZXcgQnVmZmVyRnVsbEVycm9yKHRoaXMuYnVmLnN1YmFycmF5KHRoaXMuciwgdGhpcy53KSk7XG4gICAgfVxuXG4gICAgcmV0dXJuIHRoaXMuYnVmLnN1YmFycmF5KHRoaXMuciwgdGhpcy5yICsgbik7XG4gIH1cbn1cblxuYWJzdHJhY3QgY2xhc3MgQWJzdHJhY3RCdWZCYXNlIHtcbiAgYnVmITogVWludDhBcnJheTtcbiAgdXNlZEJ1ZmZlckJ5dGVzID0gMDtcbiAgZXJyOiBFcnJvciB8IG51bGwgPSBudWxsO1xuXG4gIC8qKiBTaXplIHJldHVybnMgdGhlIHNpemUgb2YgdGhlIHVuZGVybHlpbmcgYnVmZmVyIGluIGJ5dGVzLiAqL1xuICBzaXplKCk6IG51bWJlciB7XG4gICAgcmV0dXJuIHRoaXMuYnVmLmJ5dGVMZW5ndGg7XG4gIH1cblxuICAvKiogUmV0dXJucyBob3cgbWFueSBieXRlcyBhcmUgdW51c2VkIGluIHRoZSBidWZmZXIuICovXG4gIGF2YWlsYWJsZSgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLmJ1Zi5ieXRlTGVuZ3RoIC0gdGhpcy51c2VkQnVmZmVyQnl0ZXM7XG4gIH1cblxuICAvKiogYnVmZmVyZWQgcmV0dXJucyB0aGUgbnVtYmVyIG9mIGJ5dGVzIHRoYXQgaGF2ZSBiZWVuIHdyaXR0ZW4gaW50byB0aGVcbiAgICogY3VycmVudCBidWZmZXIuXG4gICAqL1xuICBidWZmZXJlZCgpOiBudW1iZXIge1xuICAgIHJldHVybiB0aGlzLnVzZWRCdWZmZXJCeXRlcztcbiAgfVxufVxuXG4vKiogQnVmV3JpdGVyIGltcGxlbWVudHMgYnVmZmVyaW5nIGZvciBhbiBkZW5vLldyaXRlciBvYmplY3QuXG4gKiBJZiBhbiBlcnJvciBvY2N1cnMgd3JpdGluZyB0byBhIFdyaXRlciwgbm8gbW9yZSBkYXRhIHdpbGwgYmVcbiAqIGFjY2VwdGVkIGFuZCBhbGwgc3Vic2VxdWVudCB3cml0ZXMsIGFuZCBmbHVzaCgpLCB3aWxsIHJldHVybiB0aGUgZXJyb3IuXG4gKiBBZnRlciBhbGwgZGF0YSBoYXMgYmVlbiB3cml0dGVuLCB0aGUgY2xpZW50IHNob3VsZCBjYWxsIHRoZVxuICogZmx1c2goKSBtZXRob2QgdG8gZ3VhcmFudGVlIGFsbCBkYXRhIGhhcyBiZWVuIGZvcndhcmRlZCB0b1xuICogdGhlIHVuZGVybHlpbmcgZGVuby5Xcml0ZXIuXG4gKi9cbmV4cG9ydCBjbGFzcyBCdWZXcml0ZXIgZXh0ZW5kcyBBYnN0cmFjdEJ1ZkJhc2UgaW1wbGVtZW50cyBXcml0ZXIge1xuICAvKiogcmV0dXJuIG5ldyBCdWZXcml0ZXIgdW5sZXNzIHdyaXRlciBpcyBCdWZXcml0ZXIgKi9cbiAgc3RhdGljIGNyZWF0ZSh3cml0ZXI6IFdyaXRlciwgc2l6ZTogbnVtYmVyID0gREVGQVVMVF9CVUZfU0laRSk6IEJ1ZldyaXRlciB7XG4gICAgcmV0dXJuIHdyaXRlciBpbnN0YW5jZW9mIEJ1ZldyaXRlciA/IHdyaXRlciA6IG5ldyBCdWZXcml0ZXIod3JpdGVyLCBzaXplKTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgd3JpdGVyOiBXcml0ZXIsIHNpemU6IG51bWJlciA9IERFRkFVTFRfQlVGX1NJWkUpIHtcbiAgICBzdXBlcigpO1xuICAgIGlmIChzaXplIDw9IDApIHtcbiAgICAgIHNpemUgPSBERUZBVUxUX0JVRl9TSVpFO1xuICAgIH1cbiAgICB0aGlzLmJ1ZiA9IG5ldyBVaW50OEFycmF5KHNpemUpO1xuICB9XG5cbiAgLyoqIERpc2NhcmRzIGFueSB1bmZsdXNoZWQgYnVmZmVyZWQgZGF0YSwgY2xlYXJzIGFueSBlcnJvciwgYW5kXG4gICAqIHJlc2V0cyBidWZmZXIgdG8gd3JpdGUgaXRzIG91dHB1dCB0byB3LlxuICAgKi9cbiAgcmVzZXQodzogV3JpdGVyKTogdm9pZCB7XG4gICAgdGhpcy5lcnIgPSBudWxsO1xuICAgIHRoaXMudXNlZEJ1ZmZlckJ5dGVzID0gMDtcbiAgICB0aGlzLndyaXRlciA9IHc7XG4gIH1cblxuICAvKiogRmx1c2ggd3JpdGVzIGFueSBidWZmZXJlZCBkYXRhIHRvIHRoZSB1bmRlcmx5aW5nIGlvLldyaXRlci4gKi9cbiAgYXN5bmMgZmx1c2goKSB7XG4gICAgaWYgKHRoaXMuZXJyICE9PSBudWxsKSB0aHJvdyB0aGlzLmVycjtcbiAgICBpZiAodGhpcy51c2VkQnVmZmVyQnl0ZXMgPT09IDApIHJldHVybjtcblxuICAgIHRyeSB7XG4gICAgICBhd2FpdCB3cml0ZUFsbCh0aGlzLndyaXRlciwgdGhpcy5idWYuc3ViYXJyYXkoMCwgdGhpcy51c2VkQnVmZmVyQnl0ZXMpKTtcbiAgICB9IGNhdGNoIChlKSB7XG4gICAgICB0aGlzLmVyciA9IGU7XG4gICAgICB0aHJvdyBlO1xuICAgIH1cblxuICAgIHRoaXMuYnVmID0gbmV3IFVpbnQ4QXJyYXkodGhpcy5idWYubGVuZ3RoKTtcbiAgICB0aGlzLnVzZWRCdWZmZXJCeXRlcyA9IDA7XG4gIH1cblxuICAvKiogV3JpdGVzIHRoZSBjb250ZW50cyBvZiBgZGF0YWAgaW50byB0aGUgYnVmZmVyLiAgSWYgdGhlIGNvbnRlbnRzIHdvbid0IGZ1bGx5XG4gICAqIGZpdCBpbnRvIHRoZSBidWZmZXIsIHRob3NlIGJ5dGVzIHRoYXQgY2FuIGFyZSBjb3BpZWQgaW50byB0aGUgYnVmZmVyLCB0aGVcbiAgICogYnVmZmVyIGlzIHRoZSBmbHVzaGVkIHRvIHRoZSB3cml0ZXIgYW5kIHRoZSByZW1haW5pbmcgYnl0ZXMgYXJlIGNvcGllZCBpbnRvXG4gICAqIHRoZSBub3cgZW1wdHkgYnVmZmVyLlxuICAgKlxuICAgKiBAcmV0dXJuIHRoZSBudW1iZXIgb2YgYnl0ZXMgd3JpdHRlbiB0byB0aGUgYnVmZmVyLlxuICAgKi9cbiAgYXN5bmMgd3JpdGUoZGF0YTogVWludDhBcnJheSk6IFByb21pc2U8bnVtYmVyPiB7XG4gICAgaWYgKHRoaXMuZXJyICE9PSBudWxsKSB0aHJvdyB0aGlzLmVycjtcbiAgICBpZiAoZGF0YS5sZW5ndGggPT09IDApIHJldHVybiAwO1xuXG4gICAgbGV0IHRvdGFsQnl0ZXNXcml0dGVuID0gMDtcbiAgICBsZXQgbnVtQnl0ZXNXcml0dGVuID0gMDtcbiAgICB3aGlsZSAoZGF0YS5ieXRlTGVuZ3RoID4gdGhpcy5hdmFpbGFibGUoKSkge1xuICAgICAgaWYgKHRoaXMuYnVmZmVyZWQoKSA9PT0gMCkge1xuICAgICAgICAvLyBMYXJnZSB3cml0ZSwgZW1wdHkgYnVmZmVyLlxuICAgICAgICAvLyBXcml0ZSBkaXJlY3RseSBmcm9tIGRhdGEgdG8gYXZvaWQgY29weS5cbiAgICAgICAgdHJ5IHtcbiAgICAgICAgICBudW1CeXRlc1dyaXR0ZW4gPSBhd2FpdCB0aGlzLndyaXRlci53cml0ZShkYXRhKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHRoaXMuZXJyID0gZTtcbiAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBudW1CeXRlc1dyaXR0ZW4gPSBjb3B5KGRhdGEsIHRoaXMuYnVmLCB0aGlzLnVzZWRCdWZmZXJCeXRlcyk7XG4gICAgICAgIHRoaXMudXNlZEJ1ZmZlckJ5dGVzICs9IG51bUJ5dGVzV3JpdHRlbjtcbiAgICAgICAgYXdhaXQgdGhpcy5mbHVzaCgpO1xuICAgICAgfVxuICAgICAgdG90YWxCeXRlc1dyaXR0ZW4gKz0gbnVtQnl0ZXNXcml0dGVuO1xuICAgICAgZGF0YSA9IGRhdGEuc3ViYXJyYXkobnVtQnl0ZXNXcml0dGVuKTtcbiAgICB9XG5cbiAgICBudW1CeXRlc1dyaXR0ZW4gPSBjb3B5KGRhdGEsIHRoaXMuYnVmLCB0aGlzLnVzZWRCdWZmZXJCeXRlcyk7XG4gICAgdGhpcy51c2VkQnVmZmVyQnl0ZXMgKz0gbnVtQnl0ZXNXcml0dGVuO1xuICAgIHRvdGFsQnl0ZXNXcml0dGVuICs9IG51bUJ5dGVzV3JpdHRlbjtcbiAgICByZXR1cm4gdG90YWxCeXRlc1dyaXR0ZW47XG4gIH1cbn1cblxuLyoqIEJ1ZldyaXRlclN5bmMgaW1wbGVtZW50cyBidWZmZXJpbmcgZm9yIGEgZGVuby5Xcml0ZXJTeW5jIG9iamVjdC5cbiAqIElmIGFuIGVycm9yIG9jY3VycyB3cml0aW5nIHRvIGEgV3JpdGVyU3luYywgbm8gbW9yZSBkYXRhIHdpbGwgYmVcbiAqIGFjY2VwdGVkIGFuZCBhbGwgc3Vic2VxdWVudCB3cml0ZXMsIGFuZCBmbHVzaCgpLCB3aWxsIHJldHVybiB0aGUgZXJyb3IuXG4gKiBBZnRlciBhbGwgZGF0YSBoYXMgYmVlbiB3cml0dGVuLCB0aGUgY2xpZW50IHNob3VsZCBjYWxsIHRoZVxuICogZmx1c2goKSBtZXRob2QgdG8gZ3VhcmFudGVlIGFsbCBkYXRhIGhhcyBiZWVuIGZvcndhcmRlZCB0b1xuICogdGhlIHVuZGVybHlpbmcgZGVuby5Xcml0ZXJTeW5jLlxuICovXG5leHBvcnQgY2xhc3MgQnVmV3JpdGVyU3luYyBleHRlbmRzIEFic3RyYWN0QnVmQmFzZSBpbXBsZW1lbnRzIFdyaXRlclN5bmMge1xuICAvKiogcmV0dXJuIG5ldyBCdWZXcml0ZXJTeW5jIHVubGVzcyB3cml0ZXIgaXMgQnVmV3JpdGVyU3luYyAqL1xuICBzdGF0aWMgY3JlYXRlKFxuICAgIHdyaXRlcjogV3JpdGVyU3luYyxcbiAgICBzaXplOiBudW1iZXIgPSBERUZBVUxUX0JVRl9TSVpFLFxuICApOiBCdWZXcml0ZXJTeW5jIHtcbiAgICByZXR1cm4gd3JpdGVyIGluc3RhbmNlb2YgQnVmV3JpdGVyU3luY1xuICAgICAgPyB3cml0ZXJcbiAgICAgIDogbmV3IEJ1ZldyaXRlclN5bmMod3JpdGVyLCBzaXplKTtcbiAgfVxuXG4gIGNvbnN0cnVjdG9yKHByaXZhdGUgd3JpdGVyOiBXcml0ZXJTeW5jLCBzaXplOiBudW1iZXIgPSBERUZBVUxUX0JVRl9TSVpFKSB7XG4gICAgc3VwZXIoKTtcbiAgICBpZiAoc2l6ZSA8PSAwKSB7XG4gICAgICBzaXplID0gREVGQVVMVF9CVUZfU0laRTtcbiAgICB9XG4gICAgdGhpcy5idWYgPSBuZXcgVWludDhBcnJheShzaXplKTtcbiAgfVxuXG4gIC8qKiBEaXNjYXJkcyBhbnkgdW5mbHVzaGVkIGJ1ZmZlcmVkIGRhdGEsIGNsZWFycyBhbnkgZXJyb3IsIGFuZFxuICAgKiByZXNldHMgYnVmZmVyIHRvIHdyaXRlIGl0cyBvdXRwdXQgdG8gdy5cbiAgICovXG4gIHJlc2V0KHc6IFdyaXRlclN5bmMpOiB2b2lkIHtcbiAgICB0aGlzLmVyciA9IG51bGw7XG4gICAgdGhpcy51c2VkQnVmZmVyQnl0ZXMgPSAwO1xuICAgIHRoaXMud3JpdGVyID0gdztcbiAgfVxuXG4gIC8qKiBGbHVzaCB3cml0ZXMgYW55IGJ1ZmZlcmVkIGRhdGEgdG8gdGhlIHVuZGVybHlpbmcgaW8uV3JpdGVyU3luYy4gKi9cbiAgZmx1c2goKTogdm9pZCB7XG4gICAgaWYgKHRoaXMuZXJyICE9PSBudWxsKSB0aHJvdyB0aGlzLmVycjtcbiAgICBpZiAodGhpcy51c2VkQnVmZmVyQnl0ZXMgPT09IDApIHJldHVybjtcblxuICAgIHRyeSB7XG4gICAgICB3cml0ZUFsbFN5bmModGhpcy53cml0ZXIsIHRoaXMuYnVmLnN1YmFycmF5KDAsIHRoaXMudXNlZEJ1ZmZlckJ5dGVzKSk7XG4gICAgfSBjYXRjaCAoZSkge1xuICAgICAgdGhpcy5lcnIgPSBlO1xuICAgICAgdGhyb3cgZTtcbiAgICB9XG5cbiAgICB0aGlzLmJ1ZiA9IG5ldyBVaW50OEFycmF5KHRoaXMuYnVmLmxlbmd0aCk7XG4gICAgdGhpcy51c2VkQnVmZmVyQnl0ZXMgPSAwO1xuICB9XG5cbiAgLyoqIFdyaXRlcyB0aGUgY29udGVudHMgb2YgYGRhdGFgIGludG8gdGhlIGJ1ZmZlci4gIElmIHRoZSBjb250ZW50cyB3b24ndCBmdWxseVxuICAgKiBmaXQgaW50byB0aGUgYnVmZmVyLCB0aG9zZSBieXRlcyB0aGF0IGNhbiBhcmUgY29waWVkIGludG8gdGhlIGJ1ZmZlciwgdGhlXG4gICAqIGJ1ZmZlciBpcyB0aGUgZmx1c2hlZCB0byB0aGUgd3JpdGVyIGFuZCB0aGUgcmVtYWluaW5nIGJ5dGVzIGFyZSBjb3BpZWQgaW50b1xuICAgKiB0aGUgbm93IGVtcHR5IGJ1ZmZlci5cbiAgICpcbiAgICogQHJldHVybiB0aGUgbnVtYmVyIG9mIGJ5dGVzIHdyaXR0ZW4gdG8gdGhlIGJ1ZmZlci5cbiAgICovXG4gIHdyaXRlU3luYyhkYXRhOiBVaW50OEFycmF5KTogbnVtYmVyIHtcbiAgICBpZiAodGhpcy5lcnIgIT09IG51bGwpIHRocm93IHRoaXMuZXJyO1xuICAgIGlmIChkYXRhLmxlbmd0aCA9PT0gMCkgcmV0dXJuIDA7XG5cbiAgICBsZXQgdG90YWxCeXRlc1dyaXR0ZW4gPSAwO1xuICAgIGxldCBudW1CeXRlc1dyaXR0ZW4gPSAwO1xuICAgIHdoaWxlIChkYXRhLmJ5dGVMZW5ndGggPiB0aGlzLmF2YWlsYWJsZSgpKSB7XG4gICAgICBpZiAodGhpcy5idWZmZXJlZCgpID09PSAwKSB7XG4gICAgICAgIC8vIExhcmdlIHdyaXRlLCBlbXB0eSBidWZmZXIuXG4gICAgICAgIC8vIFdyaXRlIGRpcmVjdGx5IGZyb20gZGF0YSB0byBhdm9pZCBjb3B5LlxuICAgICAgICB0cnkge1xuICAgICAgICAgIG51bUJ5dGVzV3JpdHRlbiA9IHRoaXMud3JpdGVyLndyaXRlU3luYyhkYXRhKTtcbiAgICAgICAgfSBjYXRjaCAoZSkge1xuICAgICAgICAgIHRoaXMuZXJyID0gZTtcbiAgICAgICAgICB0aHJvdyBlO1xuICAgICAgICB9XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBudW1CeXRlc1dyaXR0ZW4gPSBjb3B5KGRhdGEsIHRoaXMuYnVmLCB0aGlzLnVzZWRCdWZmZXJCeXRlcyk7XG4gICAgICAgIHRoaXMudXNlZEJ1ZmZlckJ5dGVzICs9IG51bUJ5dGVzV3JpdHRlbjtcbiAgICAgICAgdGhpcy5mbHVzaCgpO1xuICAgICAgfVxuICAgICAgdG90YWxCeXRlc1dyaXR0ZW4gKz0gbnVtQnl0ZXNXcml0dGVuO1xuICAgICAgZGF0YSA9IGRhdGEuc3ViYXJyYXkobnVtQnl0ZXNXcml0dGVuKTtcbiAgICB9XG5cbiAgICBudW1CeXRlc1dyaXR0ZW4gPSBjb3B5KGRhdGEsIHRoaXMuYnVmLCB0aGlzLnVzZWRCdWZmZXJCeXRlcyk7XG4gICAgdGhpcy51c2VkQnVmZmVyQnl0ZXMgKz0gbnVtQnl0ZXNXcml0dGVuO1xuICAgIHRvdGFsQnl0ZXNXcml0dGVuICs9IG51bUJ5dGVzV3JpdHRlbjtcbiAgICByZXR1cm4gdG90YWxCeXRlc1dyaXR0ZW47XG4gIH1cbn1cblxuLyoqIEdlbmVyYXRlIGxvbmdlc3QgcHJvcGVyIHByZWZpeCB3aGljaCBpcyBhbHNvIHN1ZmZpeCBhcnJheS4gKi9cbmZ1bmN0aW9uIGNyZWF0ZUxQUyhwYXQ6IFVpbnQ4QXJyYXkpOiBVaW50OEFycmF5IHtcbiAgY29uc3QgbHBzID0gbmV3IFVpbnQ4QXJyYXkocGF0Lmxlbmd0aCk7XG4gIGxwc1swXSA9IDA7XG4gIGxldCBwcmVmaXhFbmQgPSAwO1xuICBsZXQgaSA9IDE7XG4gIHdoaWxlIChpIDwgbHBzLmxlbmd0aCkge1xuICAgIGlmIChwYXRbaV0gPT0gcGF0W3ByZWZpeEVuZF0pIHtcbiAgICAgIHByZWZpeEVuZCsrO1xuICAgICAgbHBzW2ldID0gcHJlZml4RW5kO1xuICAgICAgaSsrO1xuICAgIH0gZWxzZSBpZiAocHJlZml4RW5kID09PSAwKSB7XG4gICAgICBscHNbaV0gPSAwO1xuICAgICAgaSsrO1xuICAgIH0gZWxzZSB7XG4gICAgICBwcmVmaXhFbmQgPSBscHNbcHJlZml4RW5kIC0gMV07XG4gICAgfVxuICB9XG4gIHJldHVybiBscHM7XG59XG5cbi8qKiBSZWFkIGRlbGltaXRlZCBieXRlcyBmcm9tIGEgUmVhZGVyLiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uKiByZWFkRGVsaW0oXG4gIHJlYWRlcjogUmVhZGVyLFxuICBkZWxpbTogVWludDhBcnJheSxcbik6IEFzeW5jSXRlcmFibGVJdGVyYXRvcjxVaW50OEFycmF5PiB7XG4gIC8vIEF2b2lkIHVuaWNvZGUgcHJvYmxlbXNcbiAgY29uc3QgZGVsaW1MZW4gPSBkZWxpbS5sZW5ndGg7XG4gIGNvbnN0IGRlbGltTFBTID0gY3JlYXRlTFBTKGRlbGltKTtcbiAgY29uc3QgY2h1bmtzID0gbmV3IEJ5dGVzTGlzdCgpO1xuICBjb25zdCBidWZTaXplID0gTWF0aC5tYXgoMTAyNCwgZGVsaW1MZW4gKyAxKTtcblxuICAvLyBNb2RpZmllZCBLTVBcbiAgbGV0IGluc3BlY3RJbmRleCA9IDA7XG4gIGxldCBtYXRjaEluZGV4ID0gMDtcbiAgd2hpbGUgKHRydWUpIHtcbiAgICBjb25zdCBpbnNwZWN0QXJyID0gbmV3IFVpbnQ4QXJyYXkoYnVmU2l6ZSk7XG4gICAgY29uc3QgcmVzdWx0ID0gYXdhaXQgcmVhZGVyLnJlYWQoaW5zcGVjdEFycik7XG4gICAgaWYgKHJlc3VsdCA9PT0gbnVsbCkge1xuICAgICAgLy8gWWllbGQgbGFzdCBjaHVuay5cbiAgICAgIHlpZWxkIGNodW5rcy5jb25jYXQoKTtcbiAgICAgIHJldHVybjtcbiAgICB9IGVsc2UgaWYgKHJlc3VsdCA8IDApIHtcbiAgICAgIC8vIERpc2NhcmQgYWxsIHJlbWFpbmluZyBhbmQgc2lsZW50bHkgZmFpbC5cbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgY2h1bmtzLmFkZChpbnNwZWN0QXJyLCAwLCByZXN1bHQpO1xuICAgIGxldCBsb2NhbEluZGV4ID0gMDtcbiAgICB3aGlsZSAoaW5zcGVjdEluZGV4IDwgY2h1bmtzLnNpemUoKSkge1xuICAgICAgaWYgKGluc3BlY3RBcnJbbG9jYWxJbmRleF0gPT09IGRlbGltW21hdGNoSW5kZXhdKSB7XG4gICAgICAgIGluc3BlY3RJbmRleCsrO1xuICAgICAgICBsb2NhbEluZGV4Kys7XG4gICAgICAgIG1hdGNoSW5kZXgrKztcbiAgICAgICAgaWYgKG1hdGNoSW5kZXggPT09IGRlbGltTGVuKSB7XG4gICAgICAgICAgLy8gRnVsbCBtYXRjaFxuICAgICAgICAgIGNvbnN0IG1hdGNoRW5kID0gaW5zcGVjdEluZGV4IC0gZGVsaW1MZW47XG4gICAgICAgICAgY29uc3QgcmVhZHlCeXRlcyA9IGNodW5rcy5zbGljZSgwLCBtYXRjaEVuZCk7XG4gICAgICAgICAgeWllbGQgcmVhZHlCeXRlcztcbiAgICAgICAgICAvLyBSZXNldCBtYXRjaCwgZGlmZmVyZW50IGZyb20gS01QLlxuICAgICAgICAgIGNodW5rcy5zaGlmdChpbnNwZWN0SW5kZXgpO1xuICAgICAgICAgIGluc3BlY3RJbmRleCA9IDA7XG4gICAgICAgICAgbWF0Y2hJbmRleCA9IDA7XG4gICAgICAgIH1cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGlmIChtYXRjaEluZGV4ID09PSAwKSB7XG4gICAgICAgICAgaW5zcGVjdEluZGV4Kys7XG4gICAgICAgICAgbG9jYWxJbmRleCsrO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIG1hdGNoSW5kZXggPSBkZWxpbUxQU1ttYXRjaEluZGV4IC0gMV07XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLyoqIFJlYWQgZGVsaW1pdGVkIHN0cmluZ3MgZnJvbSBhIFJlYWRlci4gKi9cbmV4cG9ydCBhc3luYyBmdW5jdGlvbiogcmVhZFN0cmluZ0RlbGltKFxuICByZWFkZXI6IFJlYWRlcixcbiAgZGVsaW06IHN0cmluZyxcbik6IEFzeW5jSXRlcmFibGVJdGVyYXRvcjxzdHJpbmc+IHtcbiAgY29uc3QgZW5jb2RlciA9IG5ldyBUZXh0RW5jb2RlcigpO1xuICBjb25zdCBkZWNvZGVyID0gbmV3IFRleHREZWNvZGVyKCk7XG4gIGZvciBhd2FpdCAoY29uc3QgY2h1bmsgb2YgcmVhZERlbGltKHJlYWRlciwgZW5jb2Rlci5lbmNvZGUoZGVsaW0pKSkge1xuICAgIHlpZWxkIGRlY29kZXIuZGVjb2RlKGNodW5rKTtcbiAgfVxufVxuXG4vKiogUmVhZCBzdHJpbmdzIGxpbmUtYnktbGluZSBmcm9tIGEgUmVhZGVyLiAqL1xuZXhwb3J0IGFzeW5jIGZ1bmN0aW9uKiByZWFkTGluZXMoXG4gIHJlYWRlcjogUmVhZGVyLFxuKTogQXN5bmNJdGVyYWJsZUl0ZXJhdG9yPHN0cmluZz4ge1xuICBmb3IgYXdhaXQgKGxldCBjaHVuayBvZiByZWFkU3RyaW5nRGVsaW0ocmVhZGVyLCBcIlxcblwiKSkge1xuICAgIC8vIEZpbmRpbmcgYSBDUiBhdCB0aGUgZW5kIG9mIHRoZSBsaW5lIGlzIGV2aWRlbmNlIG9mIGFcbiAgICAvLyBcIlxcclxcblwiIGF0IHRoZSBlbmQgb2YgdGhlIGxpbmUuIFRoZSBcIlxcclwiIHBhcnQgc2hvdWxkIGJlXG4gICAgLy8gcmVtb3ZlZCB0b28uXG4gICAgaWYgKGNodW5rLmVuZHNXaXRoKFwiXFxyXCIpKSB7XG4gICAgICBjaHVuayA9IGNodW5rLnNsaWNlKDAsIC0xKTtcbiAgICB9XG4gICAgeWllbGQgY2h1bms7XG4gIH1cbn1cbiJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFTQSxNQUFNLEdBQUcsSUFBSSxRQUFRLENBQWlCO0FBQ3RDLE1BQU0sR0FBRyxNQUFNLFFBQVEsQ0FBb0I7QUFDM0MsTUFBTSxHQUFHLFNBQVMsUUFBUSxDQUF3QjtBQUNsRCxNQUFNLEdBQUcsUUFBUSxFQUFFLFlBQVksUUFBUSxDQUFXO0FBRWxELEtBQUssQ0FBQyxnQkFBZ0IsR0FBRyxJQUFJO0FBQzdCLEtBQUssQ0FBQyxZQUFZLEdBQUcsRUFBRTtBQUN2QixLQUFLLENBQUMsMkJBQTJCLEdBQUcsR0FBRztBQUN2QyxLQUFLLENBQUMsRUFBRSxHQUFHLENBQUksSUFBQyxVQUFVLENBQUMsQ0FBQztBQUM1QixLQUFLLENBQUMsRUFBRSxHQUFHLENBQUksSUFBQyxVQUFVLENBQUMsQ0FBQztBQUU1QixNQUFNLE9BQU8sZUFBZSxTQUFTLEtBQUs7SUFFckIsT0FBbUI7SUFEdEMsSUFBSSxHQUFHLENBQWlCO2dCQUNMLE9BQW1CLENBQUUsQ0FBQztRQUN2QyxLQUFLLENBQUMsQ0FBYTthQURGLE9BQW1CLEdBQW5CLE9BQW1CO0lBRXRDLENBQUM7O0FBR0gsTUFBTSxPQUFPLGdCQUFnQixTQUFTLEtBQUs7SUFDekMsSUFBSSxHQUFHLENBQWtCO0lBQ3pCLE9BQU87aUJBQ08sQ0FBQztRQUNiLEtBQUssQ0FBQyxDQUFxRDtJQUM3RCxDQUFDOztBQVNILEVBQTBELEFBQTFELHNEQUEwRCxBQUExRCxFQUEwRCxDQUMxRCxNQUFNLE9BQU8sU0FBUztJQUNaLEdBQUc7SUFDSCxFQUFFO0lBQ0YsQ0FBQyxHQUFHLENBQUM7SUFDTCxDQUFDLEdBQUcsQ0FBQztJQUNMLEdBQUcsR0FBRyxLQUFLO0lBQ25CLEVBQTRCLEFBQTVCLDBCQUE0QjtJQUM1QixFQUFn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