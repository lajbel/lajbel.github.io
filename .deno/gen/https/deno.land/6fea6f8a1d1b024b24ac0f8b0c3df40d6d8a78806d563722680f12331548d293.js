// Copyright 2018-2021 the Deno authors. All rights reserved. MIT license.
import { deferred } from "./deferred.ts";
/** The MuxAsyncIterator class multiplexes multiple async iterators into a
 * single stream. It currently makes an assumption:
 * - The final result (the value returned and not yielded from the iterator)
 *   does not matter; if there is any, it is discarded.
 */ export class MuxAsyncIterator {
    iteratorCount = 0;
    yields = [];
    // deno-lint-ignore no-explicit-any
    throws = [];
    signal = deferred();
    add(iterable) {
        ++this.iteratorCount;
        this.callIteratorNext(iterable[Symbol.asyncIterator]());
    }
    async callIteratorNext(iterator) {
        try {
            const { value , done  } = await iterator.next();
            if (done) {
                --this.iteratorCount;
            } else {
                this.yields.push({
                    iterator,
                    value
                });
            }
        } catch (e) {
            this.throws.push(e);
        }
        this.signal.resolve();
    }
    async *iterate() {
        while(this.iteratorCount > 0){
            // Sleep until any of the wrapped iterators yields.
            await this.signal;
            // Note that while we're looping over `yields`, new items may be added.
            for(let i = 0; i < this.yields.length; i++){
                const { iterator , value  } = this.yields[i];
                yield value;
                this.callIteratorNext(iterator);
            }
            if (this.throws.length) {
                for (const e of this.throws){
                    throw e;
                }
                this.throws.length = 0;
            }
            // Clear the `yields` list and reset the `signal` promise.
            this.yields.length = 0;
            this.signal = deferred();
        }
    }
    [Symbol.asyncIterator]() {
        return this.iterate();
    }
}
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImh0dHBzOi8vZGVuby5sYW5kL3N0ZEAwLjEwOS4wL2FzeW5jL211eF9hc3luY19pdGVyYXRvci50cyJdLCJzb3VyY2VzQ29udGVudCI6WyIvLyBDb3B5cmlnaHQgMjAxOC0yMDIxIHRoZSBEZW5vIGF1dGhvcnMuIEFsbCByaWdodHMgcmVzZXJ2ZWQuIE1JVCBsaWNlbnNlLlxuaW1wb3J0IHsgRGVmZXJyZWQsIGRlZmVycmVkIH0gZnJvbSBcIi4vZGVmZXJyZWQudHNcIjtcblxuaW50ZXJmYWNlIFRhZ2dlZFlpZWxkZWRWYWx1ZTxUPiB7XG4gIGl0ZXJhdG9yOiBBc3luY0l0ZXJhdG9yPFQ+O1xuICB2YWx1ZTogVDtcbn1cblxuLyoqIFRoZSBNdXhBc3luY0l0ZXJhdG9yIGNsYXNzIG11bHRpcGxleGVzIG11bHRpcGxlIGFzeW5jIGl0ZXJhdG9ycyBpbnRvIGFcbiAqIHNpbmdsZSBzdHJlYW0uIEl0IGN1cnJlbnRseSBtYWtlcyBhbiBhc3N1bXB0aW9uOlxuICogLSBUaGUgZmluYWwgcmVzdWx0ICh0aGUgdmFsdWUgcmV0dXJuZWQgYW5kIG5vdCB5aWVsZGVkIGZyb20gdGhlIGl0ZXJhdG9yKVxuICogICBkb2VzIG5vdCBtYXR0ZXI7IGlmIHRoZXJlIGlzIGFueSwgaXQgaXMgZGlzY2FyZGVkLlxuICovXG5leHBvcnQgY2xhc3MgTXV4QXN5bmNJdGVyYXRvcjxUPiBpbXBsZW1lbnRzIEFzeW5jSXRlcmFibGU8VD4ge1xuICBwcml2YXRlIGl0ZXJhdG9yQ291bnQgPSAwO1xuICBwcml2YXRlIHlpZWxkczogQXJyYXk8VGFnZ2VkWWllbGRlZFZhbHVlPFQ+PiA9IFtdO1xuICAvLyBkZW5vLWxpbnQtaWdub3JlIG5vLWV4cGxpY2l0LWFueVxuICBwcml2YXRlIHRocm93czogYW55W10gPSBbXTtcbiAgcHJpdmF0ZSBzaWduYWw6IERlZmVycmVkPHZvaWQ+ID0gZGVmZXJyZWQoKTtcblxuICBhZGQoaXRlcmFibGU6IEFzeW5jSXRlcmFibGU8VD4pOiB2b2lkIHtcbiAgICArK3RoaXMuaXRlcmF0b3JDb3VudDtcbiAgICB0aGlzLmNhbGxJdGVyYXRvck5leHQoaXRlcmFibGVbU3ltYm9sLmFzeW5jSXRlcmF0b3JdKCkpO1xuICB9XG5cbiAgcHJpdmF0ZSBhc3luYyBjYWxsSXRlcmF0b3JOZXh0KFxuICAgIGl0ZXJhdG9yOiBBc3luY0l0ZXJhdG9yPFQ+LFxuICApIHtcbiAgICB0cnkge1xuICAgICAgY29uc3QgeyB2YWx1ZSwgZG9uZSB9ID0gYXdhaXQgaXRlcmF0b3IubmV4dCgpO1xuICAgICAgaWYgKGRvbmUpIHtcbiAgICAgICAgLS10aGlzLml0ZXJhdG9yQ291bnQ7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICB0aGlzLnlpZWxkcy5wdXNoKHsgaXRlcmF0b3IsIHZhbHVlIH0pO1xuICAgICAgfVxuICAgIH0gY2F0Y2ggKGUpIHtcbiAgICAgIHRoaXMudGhyb3dzLnB1c2goZSk7XG4gICAgfVxuICAgIHRoaXMuc2lnbmFsLnJlc29sdmUoKTtcbiAgfVxuXG4gIGFzeW5jICppdGVyYXRlKCk6IEFzeW5jSXRlcmFibGVJdGVyYXRvcjxUPiB7XG4gICAgd2hpbGUgKHRoaXMuaXRlcmF0b3JDb3VudCA+IDApIHtcbiAgICAgIC8vIFNsZWVwIHVudGlsIGFueSBvZiB0aGUgd3JhcHBlZCBpdGVyYXRvcnMgeWllbGRzLlxuICAgICAgYXdhaXQgdGhpcy5zaWduYWw7XG5cbiAgICAgIC8vIE5vdGUgdGhhdCB3aGlsZSB3ZSdyZSBsb29waW5nIG92ZXIgYHlpZWxkc2AsIG5ldyBpdGVtcyBtYXkgYmUgYWRkZWQuXG4gICAgICBmb3IgKGxldCBpID0gMDsgaSA8IHRoaXMueWllbGRzLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGNvbnN0IHsgaXRlcmF0b3IsIHZhbHVlIH0gPSB0aGlzLnlpZWxkc1tpXTtcbiAgICAgICAgeWllbGQgdmFsdWU7XG4gICAgICAgIHRoaXMuY2FsbEl0ZXJhdG9yTmV4dChpdGVyYXRvcik7XG4gICAgICB9XG5cbiAgICAgIGlmICh0aGlzLnRocm93cy5sZW5ndGgpIHtcbiAgICAgICAgZm9yIChjb25zdCBlIG9mIHRoaXMudGhyb3dzKSB7XG4gICAgICAgICAgdGhyb3cgZTtcbiAgICAgICAgfVxuICAgICAgICB0aGlzLnRocm93cy5sZW5ndGggPSAwO1xuICAgICAgfVxuICAgICAgLy8gQ2xlYXIgdGhlIGB5aWVsZHNgIGxpc3QgYW5kIHJlc2V0IHRoZSBgc2lnbmFsYCBwcm9taXNlLlxuICAgICAgdGhpcy55aWVsZHMubGVuZ3RoID0gMDtcbiAgICAgIHRoaXMuc2lnbmFsID0gZGVmZXJyZWQoKTtcbiAgICB9XG4gIH1cblxuICBbU3ltYm9sLmFzeW5jSXRlcmF0b3JdKCk6IEFzeW5jSXRlcmF0b3I8VD4ge1xuICAgIHJldHVybiB0aGlzLml0ZXJhdGUoKTtcbiAgfVxufVxuIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLEVBQTBFLEFBQTFFLHdFQUEwRTtBQUMxRSxNQUFNLEdBQWEsUUFBUSxRQUFRLENBQWU7QUFPbEQsRUFJRyxBQUpIOzs7O0NBSUcsQUFKSCxFQUlHLENBQ0gsTUFBTSxPQUFPLGdCQUFnQjtJQUNuQixhQUFhLEdBQUcsQ0FBQztJQUNqQixNQUFNLEdBQWlDLENBQUMsQ0FBQztJQUNqRCxFQUFtQyxBQUFuQyxpQ0FBbUM7SUFDM0IsTUFBTSxHQUFVLENBQUMsQ0FBQztJQUNsQixNQUFNLEdBQW1CLFFBQVE7SUFFekMsR0FBRyxDQUFDLFFBQTBCLEVBQVEsQ0FBQztVQUNuQyxJQUFJLENBQUMsYUFBYTtRQUNwQixJQUFJLENBQUMsZ0JBQWdCLENBQUMsUUFBUSxDQUFDLE1BQU0sQ0FBQyxhQUFhO0lBQ3JELENBQUM7VUFFYSxnQkFBZ0IsQ0FDNUIsUUFBMEIsRUFDMUIsQ0FBQztRQUNELEdBQUcsQ0FBQyxDQUFDO1lBQ0gsS0FBSyxDQUFDLENBQUMsQ0FBQyxLQUFLLEdBQUUsSUFBSSxFQUFDLENBQUMsR0FBRyxLQUFLLENBQUMsUUFBUSxDQUFDLElBQUk7WUFDM0MsRUFBRSxFQUFFLElBQUksRUFBRSxDQUFDO2tCQUNQLElBQUksQ0FBQyxhQUFhO1lBQ3RCLENBQUMsTUFBTSxDQUFDO2dCQUNOLElBQUksQ0FBQyxNQUFNLENBQUMsSUFBSSxDQUFDLENBQUM7b0JBQUMsUUFBUTtvQkFBRSxLQUFLO2dCQUFDLENBQUM7WUFDdEMsQ0FBQztRQUNILENBQUMsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxFQUFFLENBQUM7WUFDWCxJQUFJLENBQUMsTUFBTSxDQUFDLElBQUksQ0FBQyxDQUFDO1FBQ3BCLENBQUM7UUFDRCxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU87SUFDckIsQ0FBQztXQUVNLE9BQU8sR0FBNkIsQ0FBQztjQUNuQyxJQUFJLENBQUMsYUFBYSxHQUFHLENBQUMsQ0FBRSxDQUFDO1lBQzlCLEVBQW1ELEFBQW5ELGlEQUFtRDtZQUNuRCxLQUFLLENBQUMsSUFBSSxDQUFDLE1BQU07WUFFakIsRUFBdUUsQUFBdkUscUVBQXVFO1lBQ3ZFLEdBQUcsQ0FBRSxHQUFHLENBQUMsQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQyxHQUFJLENBQUM7Z0JBQzVDLEtBQUssQ0FBQyxDQUFDLENBQUMsUUFBUSxHQUFFLEtBQUssRUFBQyxDQUFDLEdBQUcsSUFBSSxDQUFDLE1BQU0sQ0FBQyxDQUFDO3NCQUNuQyxLQUFLO2dCQUNYLElBQUksQ0FBQyxnQkFBZ0IsQ0FBQyxRQUFRO1lBQ2hDLENBQUM7WUFFRCxFQUFFLEVBQUUsSUFBSSxDQUFDLE1BQU0sQ0FBQyxNQUFNLEVBQUUsQ0FBQztnQkFDdkIsR0FBRyxFQUFFLEtBQUssQ0FBQyxDQUFDLElBQUksSUFBSSxDQUFDLE1BQU0sQ0FBRSxDQUFDO29CQUM1QixLQUFLLENBQUMsQ0FBQztnQkFDVCxDQUFDO2dCQUNELElBQUksQ0FBQyxNQUFNLENBQUMsTUFBTSxHQUFHLENBQUM7WUFDeEIsQ0FBQztZQUNELEVBQTBELEFBQTFELHdEQUEwRDtZQUMxRCxJQUFJLENBQUMsTUFBTSxDQUFDLE1BQU0sR0FBRyxDQUFDO1lBQ3RCLElBQUksQ0FBQyxNQUFNLEdBQUcsUUFBUTtRQUN4QixDQUFDO0lBQ0gsQ0FBQztLQUVBLE1BQU0sQ0FBQyxhQUFhLElBQXNCLENBQUM7UUFDMUMsTUFBTSxDQUFDLElBQUksQ0FBQyxPQUFPO0lBQ3JCLENBQUMifQ==